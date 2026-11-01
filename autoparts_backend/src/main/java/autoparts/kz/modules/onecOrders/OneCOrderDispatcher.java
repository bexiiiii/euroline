package autoparts.kz.modules.onecOrders;

import autoparts.kz.modules.order.repository.OrderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;

/** Uses the outbox written atomically with the order; never changes payment or business status. */
@Component
@Slf4j
@ConditionalOnProperty(prefix = "integration.onec-orders", name = "enabled", havingValue = "true")
public class OneCOrderDispatcher {
    private final JdbcTemplate db;
    private final OrderRepository orders;
    private final OneCOrderCommandMapper mapper;
    private final OneCOrderApiClient client;
    private final TransactionTemplate tx;
    private final OneCOrderProperties properties;

    public OneCOrderDispatcher(JdbcTemplate db, OrderRepository orders, OneCOrderCommandMapper mapper,
                              OneCOrderApiClient client, PlatformTransactionManager transactions, OneCOrderProperties properties,
                              @Value("${integration.kafka.enabled:false}") boolean kafka,
                              @Value("${integration.push.enabled:false}") boolean legacyPush) {
        if (kafka || legacyPush) throw new IllegalArgumentException("Disable legacy order senders before enabling 1C orders API");
        this.db = db;
        this.orders = orders;
        this.mapper = mapper;
        this.client = client;
        this.tx = new TransactionTemplate(transactions);
        this.properties = properties;
    }

    @Scheduled(fixedDelayString = "${integration.onec-orders.interval-ms:15000}")
    public void dispatch() {
        List<String> ids = db.queryForList("""
                SELECT id FROM order_outbox WHERE status='NEW' AND event_type='OrderCreated'
                AND created_at >= ?
                AND (next_attempt_at IS NULL OR next_attempt_at <= CURRENT_TIMESTAMP)
                ORDER BY created_at LIMIT 25
                """, String.class, properties.getCreatedAfter());
        for (String id : ids) {
            try {
                // Commit the exact command before HTTP. Retries, including after a crash,
                // retain both the idempotency key and the entire original payload.
                tx.executeWithoutResult(s -> prepare(id));
                tx.executeWithoutResult(s -> deliver(id));
            } catch (RuntimeException ex) {
                log.error("1C outbox processing failed for {}: {}", id, ex.getMessage(), ex);
            }
        }
    }

    private Map<String, Object> lock(String id) {
        var rows = db.queryForList("""
                SELECT aggregate_id, command_json, attempts FROM order_outbox
                WHERE id=? AND status='NEW' AND event_type='OrderCreated'
                AND (next_attempt_at IS NULL OR next_attempt_at <= CURRENT_TIMESTAMP)
                FOR UPDATE SKIP LOCKED
                """, id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private void prepare(String id) {
        var row = lock(id);
        if (row == null) return;
        if (row.get("command_json") != null) {
            db.update("UPDATE order_outbox SET attempts=attempts+1 WHERE id=?", id);
            return;
        }
        long orderId = ((Number) row.get("aggregate_id")).longValue();
        var order = orders.findById(orderId).orElseThrow(() -> new IllegalArgumentException("Order not found"));
        if (order.getOneCRefKey() != null && !order.getOneCRefKey().isBlank()) {
            markSent(id);
            return;
        }
        try {
            db.update("UPDATE order_outbox SET command_json=?, attempts=attempts+1 WHERE id=?", mapper.create(id, order), id);
        } catch (IllegalArgumentException ex) {
            db.update("UPDATE order_outbox SET status='FAILED', last_error=? WHERE id=?", ex.getMessage(), id);
            log.error("1C order {} requires correction: {}", orderId, ex.getMessage());
        }
    }

    private void deliver(String id) {
        var row = lock(id);
        if (row == null || row.get("command_json") == null) return;
        long orderId = ((Number) row.get("aggregate_id")).longValue();
        String ref;
        try {
            String knownRef = db.queryForObject("SELECT onec_ref_key FROM orders WHERE id=?", String.class, orderId);
            ref = client.recoverOrSend((String) row.get("command_json"), knownRef,
                    ((Number) row.get("attempts")).intValue() == 1);
        } catch (RuntimeException ex) {
            int attempt = ((Number) row.get("attempts")).intValue();
            boolean retry = retryable(ex) && !(ex instanceof OneCOrderApiClient.UncertainDeliveryException && attempt >= 8);
            int delay = Math.min(3600, 15 * (1 << Math.min(attempt - 1, 8)));
            String error = ex instanceof RestClientResponseException response
                    ? "1C HTTP " + response.getStatusCode().value()
                    : ex instanceof IllegalArgumentException || ex instanceof OneCOrderApiClient.UncertainDeliveryException
                    ? ex.getMessage() : "1C delivery: " + ex.getClass().getSimpleName();
            db.update("""
                    UPDATE order_outbox SET status=?, attempts=?, last_error=?,
                    next_attempt_at=CURRENT_TIMESTAMP + (? * INTERVAL '1 second') WHERE id=?
                    """, retry ? "NEW" : "FAILED", attempt, error, delay, id);
            log.warn("1C order {} delivery failed: {}; retry={}", orderId, error, retry);
            return;
        }
        // A webhook may already have supplied the same key while the request was in flight.
        int updated = db.update("""
                UPDATE orders SET onec_ref_key=?, version=coalesce(version,0)+1, updated_at=CURRENT_TIMESTAMP
                WHERE id=? AND (onec_ref_key IS NULL OR onec_ref_key='' OR onec_ref_key=?)
                """, ref, orderId, ref);
        if (updated != 1) throw new IllegalStateException("1C document key conflicts with the saved order");
        db.update("""
                UPDATE cml_orders SET status='CONFIRMED'
                WHERE guid=(SELECT external_id FROM orders WHERE id=?) AND status='NEW'
                """, orderId);
        markSent(id);
        log.info("Order {} accepted by 1C, document {}", orderId, ref);
    }

    private void markSent(String id) {
        db.update("""
                UPDATE order_outbox SET status='SENT', processed_at=CURRENT_TIMESTAMP,
                last_error=NULL, next_attempt_at=NULL WHERE id=?
                """, id);
    }

    static boolean retryable(RuntimeException ex) {
        if (ex instanceof IllegalArgumentException) return false;
        if (ex instanceof RestClientResponseException response) {
            int status = response.getStatusCode().value();
            return status == 408 || status == 429 || status >= 500;
        }
        return true; // Network failures and incomplete acknowledgments retain the same command.
    }
}
