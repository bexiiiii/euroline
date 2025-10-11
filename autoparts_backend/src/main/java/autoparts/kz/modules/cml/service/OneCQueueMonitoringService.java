package autoparts.kz.modules.cml.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.QueueInformation;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Сервис для мониторинга состояния очередей интеграции с 1C.
 * Предоставляет информацию о количестве сообщений, потребителях и состоянии очередей.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OneCQueueMonitoringService {

    private final AmqpAdmin amqpAdmin;

    /**
     * Получает статистику по очередям интеграции с 1C
     */
    public Map<String, QueueStats> getIntegrationQueuesStats() {
        Map<String, QueueStats> stats = new HashMap<>();
        
        // Проверяем основные очереди интеграции
        stats.put("orders.integration.q", getQueueStats("orders.integration.q"));
        stats.put("returns.integration.q", getQueueStats("returns.integration.q"));
        
        // Проверяем DLQ очереди
        stats.put("orders.integration.q.dlq", getQueueStats("orders.integration.q.dlq"));
        stats.put("returns.integration.q.dlq", getQueueStats("returns.integration.q.dlq"));
        
        return stats;
    }

    /**
     * Получает статистику конкретной очереди
     */
    public QueueStats getQueueStats(String queueName) {
        try {
            QueueInformation info = amqpAdmin.getQueueInfo(queueName);
            
            if (info != null) {
                return new QueueStats(
                    queueName,
                    info.getMessageCount(),
                    info.getConsumerCount(),
                    true,
                    "OK"
                );
            } else {
                return new QueueStats(
                    queueName,
                    0,
                    0,
                    false,
                    "Queue not found"
                );
            }
        } catch (Exception e) {
            log.error("Error getting stats for queue {}: {}", queueName, e.getMessage());
            return new QueueStats(
                queueName,
                0,
                0,
                false,
                "Error: " + e.getMessage()
            );
        }
    }

    /**
     * Проверяет здоровье очередей интеграции
     */
    public boolean areIntegrationQueuesHealthy() {
        Map<String, QueueStats> stats = getIntegrationQueuesStats();
        
        for (QueueStats stat : stats.values()) {
            if (!stat.isAvailable()) {
                log.warn("Queue {} is not healthy: {}", stat.getQueueName(), stat.getStatus());
                return false;
            }
            
            // Предупреждение о накоплении сообщений в DLQ
            if (stat.getQueueName().endsWith(".dlq") && stat.getMessageCount() > 0) {
                log.warn("Dead letter queue {} has {} messages", stat.getQueueName(), stat.getMessageCount());
            }
            
            // Предупреждение о большом количестве сообщений в основных очередях
            if (!stat.getQueueName().endsWith(".dlq") && stat.getMessageCount() > 1000) {
                log.warn("Queue {} has high message count: {}", stat.getQueueName(), stat.getMessageCount());
            }
        }
        
        return true;
    }

    /**
     * Получает краткий отчет о состоянии очередей
     */
    public String getQueuesHealthReport() {
        StringBuilder report = new StringBuilder();
        report.append("=== 1C Integration Queues Health Report ===\n");
        
        Map<String, QueueStats> stats = getIntegrationQueuesStats();
        
        for (QueueStats stat : stats.values()) {
            report.append(String.format("Queue: %s\n", stat.getQueueName()));
            report.append(String.format("  Status: %s\n", stat.isAvailable() ? "HEALTHY" : "UNHEALTHY"));
            report.append(String.format("  Messages: %d\n", stat.getMessageCount()));
            report.append(String.format("  Consumers: %d\n", stat.getConsumerCount()));
            
            if (!stat.isAvailable()) {
                report.append(String.format("  Error: %s\n", stat.getStatus()));
            }
            
            if (stat.getQueueName().endsWith(".dlq") && stat.getMessageCount() > 0) {
                report.append("  WARNING: Dead letter queue contains failed messages!\n");
            }
            
            report.append("\n");
        }
        
        return report.toString();
    }

    /**
     * Статистика очереди
     */
    public static class QueueStats {
        private final String queueName;
        private final int messageCount;
        private final int consumerCount;
        private final boolean available;
        private final String status;

        public QueueStats(String queueName, int messageCount, int consumerCount, boolean available, String status) {
            this.queueName = queueName;
            this.messageCount = messageCount;
            this.consumerCount = consumerCount;
            this.available = available;
            this.status = status;
        }

        public String getQueueName() { return queueName; }
        public int getMessageCount() { return messageCount; }
        public int getConsumerCount() { return consumerCount; }
        public boolean isAvailable() { return available; }
        public String getStatus() { return status; }

        @Override
        public String toString() {
            return String.format("QueueStats{name='%s', messages=%d, consumers=%d, available=%s, status='%s'}", 
                queueName, messageCount, consumerCount, available, status);
        }
    }
}