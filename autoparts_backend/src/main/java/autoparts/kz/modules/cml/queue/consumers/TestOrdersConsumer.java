package autoparts.kz.modules.cml.queue.consumers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/**
 * Temporary diagnostic consumer to debug why OrdersExportConsumer is not receiving messages
 */
@Component
public class TestOrdersConsumer {

    private static final Logger log = LoggerFactory.getLogger(TestOrdersConsumer.class);

    public TestOrdersConsumer() {
        log.info("🧪 TestOrdersConsumer CREATED");
    }

    @RabbitListener(queues = "orders.export.q", containerFactory = "rabbitListenerContainerFactory")
    public void consumeRaw(Message message) {
        log.error("🧪🧪🧪 TEST CONSUMER RECEIVED MESSAGE! 🧪🧪🧪");
        log.error("🧪 Body: {}", new String(message.getBody(), StandardCharsets.UTF_8));
        log.error("🧪 Headers: {}", message.getMessageProperties().getHeaders());
        log.error("🧪 Content-Type: {}", message.getMessageProperties().getContentType());
        
        // Don't process, just log to see if this consumer works
    }
}
