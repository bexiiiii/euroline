package autoparts.kz.modules.notifications.notifications;


import autoparts.kz.modules.notifications.entity.Notification;
import autoparts.kz.modules.notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReminderService {

    private final EmailNotifier email;
    private final SmsNotifier sms;
    private final TelegramNotifier tg;
    private final NotificationService inApp;

    public void orderCreated(Long userId, Long orderId) {
        String subj = "Новый заказ";
        String msg  = "Создан заказ #" + orderId;
        // IN-APP
        inApp.createAndBroadcast(userId, subj, msg, Notification.Type.ORDER, Notification.Severity.INFO);
        // внешние каналы
        tg.notify(subj, msg);
        email.notify(subj, msg);
        sms.notify(subj, msg);
    }

    public void orderConfirmed(Long userId, Long orderId) {
        String s="Заказ подтверждён", m="Заказ #"+orderId+" подтверждён.";
        inApp.createAndBroadcast(userId, s, m, Notification.Type.ORDER, Notification.Severity.SUCCESS);
        tg.notify(s, m); email.notify(s, m); sms.notify(s, m);
    }

    public void orderCancelled(Long userId, Long orderId, String reason) {
        String s="Заказ отменён", m="Заказ #"+orderId+" отменён. Причина: "+(reason==null?"—":reason);
        inApp.createAndBroadcast(userId, s, m, Notification.Type.ORDER, Notification.Severity.WARNING);
        tg.notify(s, m); email.notify(s, m); sms.notify(s, m);
    }

    public void returnCreated(Long userId, Long returnId, Long orderId) {
        String s="Создан возврат", m="Возврат #"+returnId+" по заказу #"+orderId;
        inApp.createAndBroadcast(userId, s, m, Notification.Type.RETURN, Notification.Severity.INFO);
        tg.notify(s, m); email.notify(s, m); sms.notify(s, m);
    }

    public void returnProcessed(Long userId, Long returnId) {
        String s="Возврат обработан", m="Возврат #"+returnId+" обработан";
        inApp.createAndBroadcast(userId, s, m, Notification.Type.RETURN, Notification.Severity.SUCCESS);
        tg.notify(s, m); email.notify(s, m); sms.notify(s, m);
    }
}
