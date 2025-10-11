package autoparts.kz.modules.cml.service;

import autoparts.kz.modules.cml.config.CommerceMlProperties;
import autoparts.kz.modules.cml.domain.dto.ExchangeJob;
import autoparts.kz.modules.cml.queue.JobQueue;
import autoparts.kz.modules.cml.queue.JobType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class OrdersExportScheduler {

    private static final Logger log = LoggerFactory.getLogger(OrdersExportScheduler.class);

    private final JobQueue jobQueue;
    private final CommerceMlProperties properties;

    public OrdersExportScheduler(JobQueue jobQueue, CommerceMlProperties properties) {
        this.jobQueue = jobQueue;
        this.properties = properties;
    }

    @Scheduled(fixedDelayString = "${cml.orders-export-interval-ms:300000}")
    public void scheduleExport() {
        String requestId = UUID.randomUUID().toString();
        ExchangeJob job = new ExchangeJob(JobType.ORDERS_EXPORT.routingKey(), "orders.xml", "", requestId, Instant.now());
        jobQueue.submit(JobType.ORDERS_EXPORT, job);
        log.debug("Scheduled orders export job {}", requestId);
    }
}
