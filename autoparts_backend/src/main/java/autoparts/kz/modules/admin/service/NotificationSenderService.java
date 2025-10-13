package autoparts.kz.modules.admin.service;

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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class NotificationSenderService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationCampaignRepository notificationCampaignRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
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
        List<User> recipients = resolveRecipients(request, target);
        if (recipients.isEmpty()) {
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

        for (User user : recipients) {
            Notification notification = new Notification();
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setStatus(request.isStatus());
            notification.setRecipient(user);
            notification.setImageUrl(campaign.getImageUrl());
            notification.setTarget(target);
            notification.setCampaign(campaign);
            notificationRepository.save(notification);
        }
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
    public List<NotificationHistoryResponse> getNotificationHistory() {
        return notificationCampaignRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .map(campaign -> {
                    User sender = campaign.getSender();
                    long recipientCount = notificationRepository.countByCampaignId(campaign.getId());
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
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Not found"));
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void deleteNotification(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new RuntimeException("Notification not found");
        }
        notificationRepository.deleteById(id);
    }

    private List<User> resolveRecipients(NotificationRequest request, String target) {
        if (request.getUserId() != null) {
            return List.of(userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found")));
        }

        List<User> recipients = new ArrayList<>();
        switch (target) {
            case "ADMINS" -> recipients.addAll(userRepository.findByRole(Role.ADMIN));
            case "USERS" -> recipients.addAll(userRepository.findByRole(Role.USER));
            case "ALL" -> recipients.addAll(userRepository.findAll());
            default -> {
                if (request.getUserId() != null) {
                    recipients.add(userRepository.findById(request.getUserId())
                            .orElseThrow(() -> new RuntimeException("User not found")));
                } else {
                    recipients.addAll(userRepository.findAll());
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
