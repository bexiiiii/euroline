package autoparts.kz.modules.cml.controller;

import autoparts.kz.modules.cml.domain.dto.ExchangeJob;
import autoparts.kz.modules.cml.queue.JobQueue;
import autoparts.kz.modules.cml.queue.JobType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/diagnostic")
public class DiagnosticController {

    private static final Logger log = LoggerFactory.getLogger(DiagnosticController.class);

    private final JobQueue jobQueue;

    public DiagnosticController(JobQueue jobQueue) {
        this.jobQueue = jobQueue;
    }

    @PostMapping("/trigger-order-export")
    public String triggerOrderExport() {
        String requestId = UUID.randomUUID().toString();
        log.info("🔧 DIAGNOSTIC: Manually triggering order export with requestId: {}", requestId);
        
        ExchangeJob job = new ExchangeJob(
                JobType.ORDERS_EXPORT.routingKey(), 
                "orders.xml", 
                "", 
                requestId, 
                Instant.now()
        );
        
        jobQueue.submit(JobType.ORDERS_EXPORT, job);
        
        return "Order export job triggered with requestId: " + requestId + 
               "\nCheck logs for processing status.\n" +
               "Look for: '📥 RECEIVED message in OrdersExportConsumer'";
    }
}
