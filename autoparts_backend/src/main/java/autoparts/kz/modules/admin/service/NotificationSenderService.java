package autoparts.kz.modules.admin.service;

import autoparts.kz.modules.admin.dto.NotificationRequest;
import autoparts.kz.modules.admin.dto.NotificationResponse;
import autoparts.kz.modules.admin.entity.Notification;
import autoparts.kz.modules.admin.repository.NotificationRepository;
import autoparts.kz.modules.auth.Roles.Role;
import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
    private UserRepository userRepository;

    public void sendNotification(NotificationRequest request) {
        List<User> recipients = resolveRecipients(request);
        if (recipients.isEmpty()) {
            throw new RuntimeException("No recipients resolved for target audience");
        }

        for (User user : recipients) {
            Notification notification = new Notification();
            notification.setTitle(request.getTitle());
            notification.setMessage(request.getMessage());
            notification.setStatus(request.isStatus());
            notification.setRecipient(user);
            notification.setImageUrl(Optional.ofNullable(request.getImageUrl()).map(String::trim).filter(s -> !s.isEmpty()).orElse(null));
            notification.setTarget(resolveTargetLabel(request));
            notificationRepository.save(notification);
        }
    }
    public List<NotificationResponse> getUserNotifications(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId).stream()
                .map(n -> new NotificationResponse(
                        n.getId(),
                        n.getTitle(),
                        n.getMessage(),
                        n.isRead(),
                        n.getCreatedAt().toString(),
                        n.getImageUrl(),
                        n.getTarget()
                ))
                .collect(Collectors.toList());
    }

    public void markAsRead(Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Not found"));
        n.setRead(true);
        notificationRepository.save(n);
    }

    public void deleteNotification(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new RuntimeException("Notification not found");
        }
        notificationRepository.deleteById(id);
    }

    private List<User> resolveRecipients(NotificationRequest request) {
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return List.of(user);
        }

        String target = resolveTargetLabel(request);
        List<User> recipients = new ArrayList<>();
        switch (target) {
            case "ADMINS" -> recipients.addAll(userRepository.findByRole(Role.ADMIN));
            case "USERS" -> recipients.addAll(userRepository.findByRole(Role.USER));
            case "ALL" -> recipients.addAll(userRepository.findAll());
            default -> {
                if (request.getUserId() != null) {
                    User user = userRepository.findById(request.getUserId())
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    recipients.add(user);
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
}
