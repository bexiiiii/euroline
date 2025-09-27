package autoparts.kz.modules.notifications.notifications;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SmsNotifier implements Notifier {
    @Override
    public void notify(String subject, String message) {
        // TODO: интеграция с провайдером SMS
        System.out.println("[SMS] " + subject + " :: " + message);
    }
}