package autoparts.kz.modules.admin.Events.service;

import autoparts.kz.modules.admin.Events.entity.EventLog;
import autoparts.kz.modules.admin.Events.repository.EventLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
public class EventLogInitializer implements ApplicationRunner {
    
    private final EventLogRepository eventLogRepository;
    private final Random random = new Random();

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // Disabled sample data creation - only real events should be logged
        // if (eventLogRepository.count() > 0) {
        //     return;
        // }
        // List<EventLog> sampleLogs = createSampleEventLogs();
        // eventLogRepository.saveAll(sampleLogs);
        // System.out.println("Created " + sampleLogs.size() + " sample event logs");
        
        System.out.println("Event logging system initialized - logging real events only");
    }

    private List<EventLog> createSampleEventLogs() {
        List<EventLog> logs = new ArrayList<>();
        Instant now = Instant.now();

        // Create logs for the past 30 days
        for (int day = 0; day < 30; day++) {
            Instant dayTime = now.minus(day, ChronoUnit.DAYS);
            
            // 5-15 events per day
            int eventsPerDay = 5 + random.nextInt(11);
            
            for (int i = 0; i < eventsPerDay; i++) {
                EventLog log = new EventLog();
                
                // Random event type
                String[] eventTypes = {
                    "USER_LOGIN", "USER_LOGOUT", "USER_CREATED", "USER_UPDATED", 
                    "PRODUCT_CREATED", "PRODUCT_UPDATED", "PRODUCT_DELETED",
                    "ORDER_CREATED", "ORDER_UPDATED", "ORDER_CANCELLED",
                    "PAYMENT_COMPLETED", "PAYMENT_FAILED", "REFUND_ISSUED",
                    "SETTINGS_UPDATED", "SYSTEM_BACKUP", "SYSTEM_RESTART",
                    "ADMIN_ACTION", "SECURITY_EVENT", "ERROR_OCCURRED"
                };
                
                String eventType = eventTypes[random.nextInt(eventTypes.length)];
                log.setEventType(eventType);
                
                // Set entity type based on event type
                if (eventType.startsWith("USER_")) {
                    log.setEntityType("USER");
                    log.setEntityId((long) (1 + random.nextInt(100)));
                } else if (eventType.startsWith("PRODUCT_")) {
                    log.setEntityType("PRODUCT");
                    log.setEntityId((long) (1 + random.nextInt(1000)));
                } else if (eventType.startsWith("ORDER_")) {
                    log.setEntityType("ORDER");
                    log.setEntityId((long) (1 + random.nextInt(500)));
                } else if (eventType.startsWith("PAYMENT_") || eventType.startsWith("REFUND_")) {
                    log.setEntityType("PAYMENT");
                    log.setEntityId((long) (1 + random.nextInt(300)));
                } else {
                    log.setEntityType("SYSTEM");
                }
                
                // User information
                if (random.nextBoolean()) {
                    log.setUserId((long) (1 + random.nextInt(50)));
                    log.setUserName("user" + log.getUserId());
                } else {
                    log.setUserName("Система");
                }
                
                // Description based on event type
                log.setDescription(generateDescription(eventType, log.getEntityId()));
                
                // Details
                if (random.nextBoolean()) {
                    log.setDetails(generateDetails(eventType));
                }
                
                // IP Address
                log.setIpAddress(generateRandomIP());
                
                // User Agent
                String[] userAgents = {
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
                };
                log.setUserAgent(userAgents[random.nextInt(userAgents.length)]);
                
                // Success rate - 90% success, 10% failures
                boolean success = random.nextDouble() < 0.9;
                log.setSuccess(success);
                
                if (!success) {
                    log.setErrorMessage(generateErrorMessage(eventType));
                }
                
                // Session ID
                log.setSessionId("sess_" + System.currentTimeMillis() + "_" + random.nextInt(1000));
                
                // Created at with random time during the day
                log.setCreatedAt(dayTime.plus(random.nextInt(24 * 60), ChronoUnit.MINUTES));
                
                logs.add(log);
            }
        }
        
        return logs;
    }
    
    private String generateDescription(String eventType, Long entityId) {
        switch (eventType) {
            case "USER_LOGIN":
                return "Пользователь вошел в систему";
            case "USER_LOGOUT":
                return "Пользователь вышел из системы";
            case "USER_CREATED":
                return "Создан новый пользователь с ID: " + entityId;
            case "USER_UPDATED":
                return "Обновлены данные пользователя ID: " + entityId;
            case "PRODUCT_CREATED":
                return "Добавлен новый товар ID: " + entityId;
            case "PRODUCT_UPDATED":
                return "Обновлен товар ID: " + entityId;
            case "PRODUCT_DELETED":
                return "Удален товар ID: " + entityId;
            case "ORDER_CREATED":
                return "Создан заказ ID: " + entityId;
            case "ORDER_UPDATED":
                return "Обновлен заказ ID: " + entityId;
            case "ORDER_CANCELLED":
                return "Отменен заказ ID: " + entityId;
            case "PAYMENT_COMPLETED":
                return "Платеж завершен успешно для заказа ID: " + entityId;
            case "PAYMENT_FAILED":
                return "Ошибка при обработке платежа для заказа ID: " + entityId;
            case "REFUND_ISSUED":
                return "Возврат средств для заказа ID: " + entityId;
            case "SETTINGS_UPDATED":
                return "Обновлены системные настройки";
            case "SYSTEM_BACKUP":
                return "Создана резервная копия системы";
            case "SYSTEM_RESTART":
                return "Система перезапущена";
            case "ADMIN_ACTION":
                return "Выполнено административное действие";
            case "SECURITY_EVENT":
                return "Событие безопасности: подозрительная активность";
            case "ERROR_OCCURRED":
                return "Произошла системная ошибка";
            default:
                return "Системное событие: " + eventType;
        }
    }
    
    private String generateDetails(String eventType) {
        switch (eventType) {
            case "USER_LOGIN":
                return "Успешная аутентификация через веб-интерфейс";
            case "PAYMENT_FAILED":
                return "Недостаточно средств на карте";
            case "SECURITY_EVENT":
                return "Множественные неудачные попытки входа с одного IP";
            case "ERROR_OCCURRED":
                return "NullPointerException в модуле обработки заказов";
            case "SYSTEM_BACKUP":
                return "Резервная копия базы данных размером 250MB";
            default:
                return "Дополнительная информация о событии " + eventType;
        }
    }
    
    private String generateErrorMessage(String eventType) {
        switch (eventType) {
            case "PAYMENT_FAILED":
                return "Transaction declined by bank";
            case "ORDER_CANCELLED":
                return "Order cancellation failed due to payment processing";
            case "ERROR_OCCURRED":
                return "Internal server error: Connection timeout";
            case "SECURITY_EVENT":
                return "Access denied: suspicious activity detected";
            default:
                return "Operation failed: " + eventType;
        }
    }
    
    private String generateRandomIP() {
        return String.format("%d.%d.%d.%d", 
            random.nextInt(256),
            random.nextInt(256), 
            random.nextInt(256),
            random.nextInt(256));
    }
}