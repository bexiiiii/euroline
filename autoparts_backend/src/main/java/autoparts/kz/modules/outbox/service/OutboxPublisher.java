package autoparts.kz.modules.outbox.service;



import autoparts.kz.modules.outbox.repository.OutboxEventRepo;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@ConditionalOnProperty(prefix = "integration.kafka", name = "enabled", havingValue = "true")
public class OutboxPublisher {

    private final OutboxEventRepo repo;
    private final KafkaTemplate<String,Object> kafka;
    private final ObjectMapper om = new ObjectMapper();

    public OutboxPublisher(OutboxEventRepo repo, 
                          @Qualifier("kafkaTemplate") KafkaTemplate<String,Object> kafka) {
        this.repo = repo;
        this.kafka = kafka;
    }

    @Scheduled(fixedDelayString = "${outbox.publisher.delay-ms:5000}")  
    @Transactional
    public void publishBatch(){
        var batch = repo.findBatch(PageRequest.of(0, 100));
        if (batch.isEmpty()) {
            return; // Ранний выход если нет данных
        }
        
        log.info("Processing {} outbox events", batch.size());
        for (var e : batch){
            try {
                Object payload = om.readValue(e.getPayload(), Object.class);
                kafka.executeInTransaction(kt -> { kt.send(e.getTopic(), e.getKey(), payload); return null; });
                e.setStatus("SENT");
                log.debug("Outbox event sent: id={}, topic={}", e.getId(), e.getTopic());
            } catch (Exception ex){
                log.error("Outbox send error for event id={}: {}", e.getId(), ex.getMessage(), ex);
                e.setAttempts(e.getAttempts()+1);
                if (e.getAttempts()>=10) e.setStatus("ERROR");
            }
            repo.save(e);
        }
    }
}
