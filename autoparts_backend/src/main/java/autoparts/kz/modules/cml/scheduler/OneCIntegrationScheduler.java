package autoparts.kz.modules.cml.scheduler;

import autoparts.kz.modules.cml.service.OneCIntegrationPublisherService;
import autoparts.kz.modules.cml.service.OneCQueueMonitoringService;
import autoparts.kz.modules.stockOneC.service.OneCIntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Планировщик для автоматических задач интеграции с 1C.
 * Выполняет периодические проверки состояния очередей и отправку накопившихся заказов.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(value = "spring.task.scheduling.enabled", havingValue = "true", matchIfMissing = true)
public class OneCIntegrationScheduler {

    private final OneCIntegrationService oneCIntegrationService;
    private final OneCQueueMonitoringService queueMonitoringService;
    private final OneCIntegrationPublisherService publisherService;

    /**
     * Периодическая проверка здоровья очередей интеграции (каждые 5 минут)
     */
    @Scheduled(fixedRate = 300_000) // 5 минут
    public void checkQueuesHealth() {
        try {
            log.debug("Performing scheduled queue health check");
            
            boolean healthy = queueMonitoringService.areIntegrationQueuesHealthy();
            
            if (!healthy) {
                log.warn("Integration queues are not healthy!");
                String report = queueMonitoringService.getQueuesHealthReport();
                log.warn("Queue health report:\n{}", report);
            } else {
                log.debug("All integration queues are healthy");
            }
            
        } catch (Exception e) {
            log.error("Error during scheduled queue health check: {}", e.getMessage(), e);
        }
    }

    /**
     * Периодическая отправка ожидающих заказов в 1C (каждые 3 минуты)
     */
    @Scheduled(fixedRate = 180_000) // 3 минуты
    public void sendPendingOrders() {
        try {
            log.debug("Performing scheduled pending orders sync");
            
            // Сначала проверяем соединение с 1C
            if (!oneCIntegrationService.testConnection()) {
                log.warn("Cannot sync pending orders: 1C connection is not available");
                return;
            }
            
            oneCIntegrationService.sendPendingOrdersToOneC();
            log.info("Scheduled pending orders sync completed successfully");
            
        } catch (Exception e) {
            log.error("Error during scheduled pending orders sync: {}", e.getMessage(), e);
        }
    }

    /**
     * Проверка соединения с 1C (каждые 2 минуты)
     */
    @Scheduled(fixedRate = 120_000) // 2 минуты
    public void checkOneCConnection() {
        try {
            log.debug("Performing scheduled 1C connection check");
            
            boolean connected = oneCIntegrationService.testConnection();
            
            if (!connected) {
                log.warn("1C connection is not available during scheduled check");
            } else {
                log.debug("1C connection is available");
            }
            
        } catch (Exception e) {
            log.error("Error during scheduled 1C connection check: {}", e.getMessage(), e);
        }
    }

    /**
     * Мониторинг DLQ очередей и уведомление о проблемах (каждые 10 минут)
     */
    @Scheduled(fixedRate = 600_000) // 10 минут
    public void monitorDeadLetterQueues() {
        try {
            log.debug("Performing scheduled DLQ monitoring");
            
            var ordersDlqStats = queueMonitoringService.getQueueStats("orders.integration.q.dlq");
            var returnsDlqStats = queueMonitoringService.getQueueStats("returns.integration.q.dlq");
            
            if (ordersDlqStats.getMessageCount() > 0) {
                log.warn("Orders DLQ contains {} failed messages! Manual intervention may be required.", 
                    ordersDlqStats.getMessageCount());
            }
            
            if (returnsDlqStats.getMessageCount() > 0) {
                log.warn("Returns DLQ contains {} failed messages! Manual intervention may be required.", 
                    returnsDlqStats.getMessageCount());
            }
            
            // Проверяем основные очереди на переполнение
            var ordersStats = queueMonitoringService.getQueueStats("orders.integration.q");
            var returnsStats = queueMonitoringService.getQueueStats("returns.integration.q");
            
            if (ordersStats.getMessageCount() > 1000) {
                log.warn("Orders integration queue has {} messages. This may indicate processing issues.", 
                    ordersStats.getMessageCount());
            }
            
            if (returnsStats.getMessageCount() > 100) {
                log.warn("Returns integration queue has {} messages. This may indicate processing issues.", 
                    returnsStats.getMessageCount());
            }
            
        } catch (Exception e) {
            log.error("Error during scheduled DLQ monitoring: {}", e.getMessage(), e);
        }
    }

    /**
     * Еженедельная синхронизация каталога (каждое воскресенье в 02:00)
     */
    @Scheduled(cron = "0 0 2 * * SUN")
    public void weeklyFullCatalogSync() {
        try {
            log.info("Starting weekly full catalog sync");
            
            if (!oneCIntegrationService.testConnection()) {
                log.warn("Cannot perform weekly catalog sync: 1C connection is not available");
                return;
            }
            
            oneCIntegrationService.syncCatalog();
            log.info("Weekly full catalog sync completed successfully");
            
        } catch (Exception e) {
            log.error("Error during weekly catalog sync: {}", e.getMessage(), e);
        }
    }

    /**
     * Ежедневная очистка статистики и логов (каждый день в 03:00)
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void dailyMaintenance() {
        try {
            log.info("Starting daily maintenance tasks for 1C integration");
            
            // Логируем текущее состояние очередей
            String healthReport = queueMonitoringService.getQueuesHealthReport();
            log.info("Daily queue health report:\n{}", healthReport);
            
            // Можно добавить очистку старых метрик, логов и т.д.
            
            log.info("Daily maintenance tasks completed");
            
        } catch (Exception e) {
            log.error("Error during daily maintenance: {}", e.getMessage(), e);
        }
    }
}
