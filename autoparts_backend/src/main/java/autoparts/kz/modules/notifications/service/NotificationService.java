package autoparts.kz.modules.notifications.service;


import autoparts.kz.modules.notifications.repository.NotificationRepository;
import autoparts.kz.modules.notifications.entity.Notification;
import autoparts.kz.modules.notifications.notifications.InAppBroadcaster;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository repo;
    private final InAppBroadcaster inApp;
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NotificationService.class);

    @Transactional
    public Notification createAndBroadcast(Long userId, String title, String body,
                                           Notification.Type type, Notification.Severity sev) {
        Notification n = Notification.builder()
                .userId(userId).title(title).body(body)
                .type(type).severity(sev).readFlag(false).build();
        repo.save(n);
        log.info("Created notification id={} userId={} type={} severity={} title={}", n.getId(), userId, type, sev, title);
        // пушим в браузер
        try {
            inApp.push(userId, new NotificationPayload(n));
            log.info("Pushed notification to userId={}", userId);
        } catch (Exception ex) {
            log.warn("Failed to push SSE notification for userId={}: {}", userId, ex.getMessage());
        }
        return n;
    }

    // компактный payload для фронта
    public record NotificationPayload(Long id, String title, String body, String type,
                                      String severity, boolean read, java.time.Instant createdAt) {
        public NotificationPayload(Notification n) {
            this(n.getId(), n.getTitle(), n.getBody(), n.getType().name(), n.getSeverity().name(), n.isReadFlag(), n.getCreatedAt());
        }
    }
}
