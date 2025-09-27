package autoparts.kz.modules.notifications.notifications;



import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EmailNotifier implements Notifier {
    @Override
    public void notify(String subject, String message) {
        // TODO: подключить JavaMailSender/SendGrid
        System.out.println("[EMAIL] " + subject + " :: " + message);
    }
}