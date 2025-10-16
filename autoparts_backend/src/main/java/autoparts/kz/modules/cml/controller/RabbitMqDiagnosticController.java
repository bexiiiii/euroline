package autoparts.kz.modules.cml.controller;

import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

@RestController
@RequestMapping("/api/diagnostic/rabbitmq")
public class RabbitMqDiagnosticController {

    private final RabbitTemplate rabbitTemplate;
    private final AmqpAdmin amqpAdmin;

    public RabbitMqDiagnosticController(RabbitTemplate rabbitTemplate, AmqpAdmin amqpAdmin) {
        this.rabbitTemplate = rabbitTemplate;
        this.amqpAdmin = amqpAdmin;
    }

    @GetMapping("/queue-info")
    public Map<String, Object> getQueueInfo() {
        Map<String, Object> info = new HashMap<>();
        
        String[] queues = {
            "orders.export.q",
            "orders.export.q.dlq",
            "import.catalog.q",
            "offers.import.q",
            "orders.apply.q",
            "orders.integration.q",
            "returns.integration.q"
        };
        
        for (String queueName : queues) {
            try {
                Properties queueProperties = amqpAdmin.getQueueProperties(queueName);
                info.put(queueName, queueProperties);
            } catch (Exception e) {
                info.put(queueName, "Error: " + e.getMessage());
            }
        }
        
        return info;
    }

    @GetMapping("/peek-dlq")
    public Map<String, Object> peekDlq() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Peek at message in DLQ without removing it
            Message message = rabbitTemplate.receive("orders.export.q.dlq", 1000);
            
            if (message == null) {
                result.put("status", "No messages in DLQ");
                return result;
            }
            
            // Put it back
            rabbitTemplate.send("orders.export.q.dlq", message);
            
            result.put("body", new String(message.getBody(), StandardCharsets.UTF_8));
            result.put("headers", message.getMessageProperties().getHeaders());
            result.put("receivedRoutingKey", message.getMessageProperties().getReceivedRoutingKey());
            result.put("contentType", message.getMessageProperties().getContentType());
            
        } catch (Exception e) {
            result.put("error", e.getMessage());
            e.printStackTrace();
        }
        
        return result;
    }

    @GetMapping("/listener-status")
    public Map<String, Object> getListenerStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("rabbitTemplate", rabbitTemplate != null ? "Active" : "Null");
        status.put("amqpAdmin", amqpAdmin != null ? "Active" : "Null");
        status.put("note", "Check application logs for listener registration messages");
        return status;
    }
}
