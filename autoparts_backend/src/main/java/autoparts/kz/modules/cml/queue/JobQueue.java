package autoparts.kz.modules.cml.queue;

import autoparts.kz.modules.cml.config.CommerceMlProperties;
import autoparts.kz.modules.cml.domain.dto.ExchangeJob;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class JobQueue {

    private static final Logger log = LoggerFactory.getLogger(JobQueue.class);

    private final RabbitTemplate rabbitTemplate;
    private final CommerceMlProperties properties;

    public JobQueue(RabbitTemplate rabbitTemplate, CommerceMlProperties properties) {
        this.rabbitTemplate = rabbitTemplate;
        this.properties = properties;
    }

    public void submit(JobType jobType, ExchangeJob job) {
        log.info("Publishing job {} for file {} key {}", jobType, job.filename(), job.objectKey());
        rabbitTemplate.convertAndSend(properties.getQueue().getExchange(),
                jobType.routingKey(),
                job,
                message -> {
                    message.getMessageProperties().setHeader("X-Request-Id", job.requestId());
                    message.getMessageProperties().setAppId("cml-integration");
                    return message;
                });
    }
}
