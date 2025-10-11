package autoparts.kz.modules.admin.Events.events;

import autoparts.kz.modules.notifications.notifications.ReminderService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "integration.kafka", name = "enabled", havingValue = "true")
public class ReturnEventConsumer {
    private final ReminderService reminders;

    @KafkaListener(topics = "returns.events", groupId = "autoparts-consumers")
    public void onReturn(ReturnEvent e){
        switch (e.type()){
            case "CREATED"  -> reminders.returnCreated(e.userId(), e.returnId(), e.orderId());
            case "PROCESSED"-> reminders.returnProcessed(e.userId(), e.returnId());
        }
    }
}
