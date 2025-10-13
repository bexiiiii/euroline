package autoparts.kz.modules.admin.service;

import autoparts.kz.common.config.CacheConfig;
import autoparts.kz.common.dto.PageResponse;
import autoparts.kz.modules.admin.dto.NotificationHistoryResponse;
import autoparts.kz.modules.admin.dto.NotificationRequest;
import autoparts.kz.modules.admin.dto.NotificationResponse;
import autoparts.kz.modules.admin.entity.Notification;
import autoparts.kz.modules.admin.entity.NotificationCampaign;
import autoparts.kz.modules.admin.repository.NotificationCampaignRepository;
import autoparts.kz.modules.admin.repository.NotificationRepository;
import autoparts.kz.modules.auth.Roles.Role;
import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.auth.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class NotificationSenderService {

    private static final int BULK_BATCH_SIZE = 500;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationCampaignRepository notificationCampaignRepository;

    @Autowired
    private UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    @CacheEvict(value = CacheConfig.ADMIN_NOTIFICATION_HISTORY_CACHE, allEntries = true)
    public void sendNotification(NotificationRequest request, Long senderId) {
        String title = Optional.ofNullable(request.getTitle())
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .orElseThrow(() -> new IllegalArgumentException("Название уведомления не может быть пустым"));
        String message = Optional.ofNullable(request.getMessage())
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .orElseThrow(() -> new IllegalArgumentException("Текст уведомления не может быть пустым"));

        String target = resolveTargetLabel(request);
        List<Long> recipientIds = resolveRecipientIds(request, target);
        if (recipientIds.isEmpty()) {
            throw new RuntimeException("No recipients resolved for target audience");
        }

        NotificationCampaign campaign = new NotificationCampaign();
        campaign.setTitle(title);
        campaign.setMessage(message);
        campaign.setStatus(request.isStatus());
        campaign.setTarget(target);
        campaign.setImageUrl(normalizeImageUrl(request.getImageUrl()));
        campaign.setSender(resolveSender(senderId));
        notificationCampaignRepository.save(campaign);

        saveNotificationsBulk(campaign, recipientIds);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId).stream()
                .map(n -> new NotificationResponse(
                        n.getId(),
                        n.getTitle(),
                        n.getMessage(),
                        n.isRead(),
                        n.getCreatedAt().toString(),
                        n.getImageUrl(),
                        n.getTarget(),
                        n.isStatus()
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.ADMIN_NOTIFICATION_HISTORY_CACHE, key = "#page + ':' + #size")
    public PageResponse<NotificationHistoryResponse> getNotificationHistory(int page, int size) {
        Page<NotificationCampaign> campaignPage = notificationCampaignRepository.findAllByOrderByCreatedAtDesc(
                PageRequest.of(Math.max(page, 0), Math.max(size, 1))
        );

        Map<Long, Long> recipientCounts = loadCampaignCounts(
                campaignPage.getContent().stream()
                        .map(NotificationCampaign::getId)
                        .collect(Collectors.toList())
        );

        List<NotificationHistoryResponse> content = campaignPage.getContent().stream()
                .map(campaign -> buildHistoryResponse(campaign, recipientCounts.getOrDefault(campaign.getId(), 0L)))
                .toList();

        return new PageResponse<>(
                content,
                campaignPage.getTotalElements(),
                campaignPage.getTotalPages(),
                campaignPage.getSize(),
                campaignPage.getNumber()
        );
    }

    @Transactional
    @CacheEvict(value = CacheConfig.ADMIN_NOTIFICATION_HISTORY_CACHE, allEntries = true)
    public void markAsRead(Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Not found"));
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    @CacheEvict(value = CacheConfig.ADMIN_NOTIFICATION_HISTORY_CACHE, allEntries = true)
    public void deleteNotification(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new RuntimeException("Notification not found");
        }
        notificationRepository.deleteById(id);
    }

    private List<Long> resolveRecipientIds(NotificationRequest request, String target) {
        if (request.getUserId() != null) {
            Long userId = userRepository.findById(request.getUserId())
                    .map(User::getId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return List.of(userId);
        }

        List<Long> recipients = new ArrayList<>();
        switch (target) {
            case "ADMINS" -> recipients.addAll(userRepository.findIdsByRole(Role.ADMIN));
            case "USERS" -> recipients.addAll(userRepository.findIdsByRole(Role.USER));
            case "ALL" -> recipients.addAll(userRepository.findAllIds());
            default -> {
                if (request.getUserId() != null) {
                    Long userId = userRepository.findById(request.getUserId())
                            .map(User::getId)
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    recipients.add(userId);
                } else {
                    recipients.addAll(userRepository.findAllIds());
                }
            }
        }
        return recipients;
    }

    private String resolveTargetLabel(NotificationRequest request) {
        return Optional.ofNullable(request.getTarget())
                .map(t -> t.trim().toUpperCase(Locale.ROOT))
                .filter(t -> !t.isEmpty())
                .orElse("ALL");
    }

    private User resolveSender(Long senderId) {
        if (senderId == null) {
            return null;
        }
        return userRepository.findById(senderId).orElse(null);
    }

    private void saveNotificationsBulk(NotificationCampaign campaign, List<Long> recipientIds) {
        if (recipientIds.isEmpty()) {
            return;
        }

        List<Notification> buffer = new ArrayList<>(BULK_BATCH_SIZE);
        for (Long recipientId : recipientIds) {
            Notification notification = new Notification();
            notification.setTitle(campaign.getTitle());
            notification.setMessage(campaign.getMessage());
            notification.setStatus(campaign.isStatus());
            notification.setRecipient(entityManager.getReference(User.class, recipientId));
            notification.setImageUrl(campaign.getImageUrl());
            notification.setTarget(campaign.getTarget());
            notification.setCampaign(campaign);
            buffer.add(notification);

            if (buffer.size() == BULK_BATCH_SIZE) {
                notificationRepository.saveAll(buffer);
                notificationRepository.flush();
                buffer.clear();
            }
        }

        if (!buffer.isEmpty()) {
            notificationRepository.saveAll(buffer);
            notificationRepository.flush();
            buffer.clear();
        }
    }

    private Map<Long, Long> loadCampaignCounts(Collection<Long> campaignIds) {
        if (campaignIds.isEmpty()) {
            return Map.of();
        }
        return notificationRepository.countByCampaignIds(campaignIds).stream()
                .collect(Collectors.toMap(NotificationRepository.CampaignCount::getCampaignId,
                        NotificationRepository.CampaignCount::getCount));
    }

    private NotificationHistoryResponse buildHistoryResponse(NotificationCampaign campaign, long recipientCount) {
        User sender = campaign.getSender();
        return new NotificationHistoryResponse(
                campaign.getId(),
                campaign.getTitle(),
                campaign.getMessage(),
                campaign.isStatus(),
                campaign.getTarget(),
                campaign.getImageUrl(),
                campaign.getCreatedAt() != null ? campaign.getCreatedAt().toString() : null,
                sender != null ? sender.getId() : null,
                sender != null ? sender.getEmail() : null,
                buildSenderDisplayName(sender),
                recipientCount
        );
    }

    private String normalizeImageUrl(String raw) {
        return Optional.ofNullable(raw)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .orElse(null);
    }

    private String buildSenderDisplayName(User sender) {
        if (sender == null) {
            return null;
        }
        StringBuilder builder = new StringBuilder();
        if (isNotBlank(sender.getSurname())) {
            builder.append(sender.getSurname().trim());
        }
        if (isNotBlank(sender.getName())) {
            if (builder.length() > 0) {
                builder.append(" ");
            }
            builder.append(sender.getName().trim());
        }
        if (builder.length() == 0 && isNotBlank(sender.getClientName())) {
            builder.append(sender.getClientName().trim());
        }
        if (builder.length() == 0) {
            builder.append(Optional.ofNullable(sender.getEmail()).orElse("Администратор"));
        }
        return builder.toString();
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
