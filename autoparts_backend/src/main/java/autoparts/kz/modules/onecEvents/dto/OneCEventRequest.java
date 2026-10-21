package autoparts.kz.modules.onecEvents.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCEventRequest(
        String eventId,
        String eventType,
        String entity,
        String refKey,
        String occurredAt,
        String source,
        Integer version,
        Integer attempt,
        JsonNode data
) {
}
