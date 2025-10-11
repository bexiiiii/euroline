package autoparts.kz.modules.cml.queue.consumers;

import autoparts.kz.modules.cml.domain.dto.OneCOrderMessage;
import autoparts.kz.modules.cml.domain.dto.OneCReturnMessage;
import autoparts.kz.modules.stockOneC.service.OneCIntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Бридж, пересылающий сообщения из RabbitMQ в REST API 1С.
 * Позволяет изолировать обмен HTTP-запросами и повторно использовать DLQ для ошибок.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OneCIntegrationBridgeConsumer {

    private final OneCIntegrationService oneCIntegrationService;

    @RabbitListener(queues = "orders.integration.q")
    public void onOrderIntegration(OneCOrderMessage message) {
        log.debug("Received order integration message for orderId={}", message.getOrderId());
        oneCIntegrationService.sendOrderMessageToOneC(message);
    }

    @RabbitListener(queues = "returns.integration.q")
    public void onReturnIntegration(OneCReturnMessage message) {
        log.debug("Received return integration message for returnId={}", message.getReturnId());
        oneCIntegrationService.sendReturnMessageToOneC(message);
    }
}
