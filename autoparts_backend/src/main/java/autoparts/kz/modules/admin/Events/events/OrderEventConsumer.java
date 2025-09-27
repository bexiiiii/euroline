package autoparts.kz.modules.admin.Events.events;

import autoparts.kz.modules.notifications.notifications.ReminderService;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final ReminderService reminders;

    @KafkaListener(topics = "orders.events", groupId = "autoparts-consumers")
    public void onOrderEvent(OrderEvent evt) {
        switch (evt.type()) {
            case "CREATED"   -> reminders.orderCreated(evt.userId(), evt.orderId());
            case "CONFIRMED" -> reminders.orderConfirmed(evt.userId(), evt.orderId());
            case "CANCELLED", "FAILED" -> reminders.orderCancelled(evt.userId(), evt.orderId(), evt.payload());
            // для REFUNDED — можно вызвать returnProcessed, если у тебя событие о возврате в этот же топик
        }
    }
}