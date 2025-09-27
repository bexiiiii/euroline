package autoparts.kz.modules.admin.service;

import autoparts.kz.modules.admin.dto.NotificationRequest;
import autoparts.kz.modules.admin.dto.NotificationResponse;
import autoparts.kz.modules.admin.entity.Notification;
import autoparts.kz.modules.admin.repository.NotificationRepository;
import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
@Service
public class NotificationSenderService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    public void sendNotification(NotificationRequest request) {
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Notification notification = new Notification();
            notification.setTitle(request.getTitle());
            notification.setMessage(request.getMessage());
            notification.setRecipient(user);
            notificationRepository.save(notification);
        } else {
            // отправить всем
            List<User> allUsers = userRepository.findAll();
            for (User user : allUsers) {
                Notification n = new Notification();
                n.setTitle(request.getTitle());
                n.setMessage(request.getMessage());
                n.setRecipient(user);
                notificationRepository.save(n);
            }
        }
    }
    public List<NotificationResponse> getUserNotifications(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId).stream()
                .map(n -> new NotificationResponse(
                        n.getId(),
                        n.getTitle(),
                        n.getMessage(),
                        n.isRead(),
                        n.getCreatedAt().toString()
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

}
