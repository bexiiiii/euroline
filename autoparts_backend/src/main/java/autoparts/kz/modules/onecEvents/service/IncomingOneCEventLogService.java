package autoparts.kz.modules.onecEvents.service;

import autoparts.kz.modules.onecEvents.dto.OneCEventRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class IncomingOneCEventLogService {
    private final JdbcTemplate jdbcTemplate;

    public IncomingOneCEventLogService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** Persists failures outside the processing transaction so retryable 5xx errors are visible. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailure(OneCEventRequest event, String rawPayload, int status, String errorMessage) {
        if (event == null || event.eventId() == null) {
            return;
        }
        try {
            UUID eventId = UUID.fromString(event.eventId());
            jdbcTemplate.update(
                    "INSERT INTO incoming_1c_events " +
                            "(event_id, event_type, source, http_status, error_message, payload, received_at) " +
                            "VALUES (?, ?, ?, ?, ?, CAST(? AS jsonb), CURRENT_TIMESTAMP) " +
                            "ON CONFLICT (event_id) DO UPDATE SET http_status = EXCLUDED.http_status, " +
                            "error_message = EXCLUDED.error_message, payload = EXCLUDED.payload, received_at = CURRENT_TIMESTAMP, " +
                            "processed_at = NULL WHERE incoming_1c_events.http_status >= 500",
                    eventId, event.eventType(), event.source(), status, truncate(errorMessage), rawPayload
            );
        } catch (IllegalArgumentException ignored) {
            // Invalid eventId cannot be used as an idempotency key or stored in the UUID journal.
        }
    }

    private String truncate(String value) {
        return value == null ? null : value.substring(0, Math.min(value.length(), 2000));
    }
}
