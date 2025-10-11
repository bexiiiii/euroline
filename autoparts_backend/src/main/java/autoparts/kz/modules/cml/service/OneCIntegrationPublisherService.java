package autoparts.kz.modules.cml.service;

import autoparts.kz.modules.cml.config.CommerceMlProperties;
import autoparts.kz.modules.cml.domain.dto.OneCOrderMessage;
import autoparts.kz.modules.cml.domain.dto.OneCReturnMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

/**
 * Сервис для публикации сообщений интеграции с 1C в RabbitMQ очереди.
 * Обеспечивает надежную доставку сообщений о заказах и возвратах в систему 1C.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OneCIntegrationPublisherService {

    private final RabbitTemplate rabbitTemplate;
    private final CommerceMlProperties properties;

    /**
     * Публикует сообщение о заказе в очередь интеграции с 1C
     * 
     * @param orderMessage сообщение о заказе
     */
    public void publishOrderMessage(OneCOrderMessage orderMessage) {
        try {
            log.debug("Publishing order message for orderId={} to integration queue", orderMessage.getOrderId());
            
            rabbitTemplate.convertAndSend(
                properties.getQueue().getExchange(),
                properties.getQueue().getOrdersIntegrationRoutingKey(),
                orderMessage
            );
            
            log.info("Order message published successfully for orderId={}", orderMessage.getOrderId());
            
        } catch (Exception e) {
            log.error("Failed to publish order message for orderId={}: {}", 
                orderMessage.getOrderId(), e.getMessage(), e);
            throw new RuntimeException("Ошибка публикации сообщения о заказе: " + e.getMessage(), e);
        }
    }

    /**
     * Публикует сообщение о возврате в очередь интеграции с 1C
     * 
     * @param returnMessage сообщение о возврате
     */
    public void publishReturnMessage(OneCReturnMessage returnMessage) {
        try {
            log.debug("Publishing return message for returnId={} to integration queue", returnMessage.getReturnId());
            
            rabbitTemplate.convertAndSend(
                properties.getQueue().getExchange(),
                properties.getQueue().getReturnsIntegrationRoutingKey(),
                returnMessage
            );
            
            log.info("Return message published successfully for returnId={}", returnMessage.getReturnId());
            
        } catch (Exception e) {
            log.error("Failed to publish return message for returnId={}: {}", 
                returnMessage.getReturnId(), e.getMessage(), e);
            throw new RuntimeException("Ошибка публикации сообщения о возврате: " + e.getMessage(), e);
        }
    }

    /**
     * Публикует сообщение о заказе с дополнительными параметрами
     * 
     * @param orderMessage сообщение о заказе
     * @param delayMs задержка доставки в миллисекундах (если поддерживается)
     */
    public void publishOrderMessageWithDelay(OneCOrderMessage orderMessage, long delayMs) {
        try {
            log.debug("Publishing delayed order message for orderId={} with delay={}ms", 
                orderMessage.getOrderId(), delayMs);
            
            // Базовая отправка (RabbitMQ delayed message plugin требует дополнительной настройки)
            rabbitTemplate.convertAndSend(
                properties.getQueue().getExchange(),
                properties.getQueue().getOrdersIntegrationRoutingKey(),
                orderMessage,
                message -> {
                    // Можно добавить метаданные в заголовки сообщения
                    message.getMessageProperties().setHeader("delay", delayMs);
                    message.getMessageProperties().setHeader("retry-count", 0);
                    return message;
                }
            );
            
            log.info("Delayed order message published successfully for orderId={}", orderMessage.getOrderId());
            
        } catch (Exception e) {
            log.error("Failed to publish delayed order message for orderId={}: {}", 
                orderMessage.getOrderId(), e.getMessage(), e);
            throw new RuntimeException("Ошибка публикации отложенного сообщения о заказе: " + e.getMessage(), e);
        }
    }

    /**
     * Публикует сообщение о возврате с дополнительными параметрами
     * 
     * @param returnMessage сообщение о возврате
     * @param priority приоритет сообщения (0-255)
     */
    public void publishReturnMessageWithPriority(OneCReturnMessage returnMessage, int priority) {
        try {
            log.debug("Publishing return message for returnId={} with priority={}", 
                returnMessage.getReturnId(), priority);
            
            rabbitTemplate.convertAndSend(
                properties.getQueue().getExchange(),
                properties.getQueue().getReturnsIntegrationRoutingKey(),
                returnMessage,
                message -> {
                    message.getMessageProperties().setPriority(Math.max(0, Math.min(255, priority)));
                    message.getMessageProperties().setHeader("priority", priority);
                    return message;
                }
            );
            
            log.info("Priority return message published successfully for returnId={}", returnMessage.getReturnId());
            
        } catch (Exception e) {
            log.error("Failed to publish priority return message for returnId={}: {}", 
                returnMessage.getReturnId(), e.getMessage(), e);
            throw new RuntimeException("Ошибка публикации приоритетного сообщения о возврате: " + e.getMessage(), e);
        }
    }
}