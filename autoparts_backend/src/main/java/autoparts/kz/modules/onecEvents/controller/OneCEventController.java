package autoparts.kz.modules.onecEvents.controller;

import autoparts.kz.modules.onecEvents.dto.OneCEventRequest;
import autoparts.kz.modules.onecEvents.service.OneCEventService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;

@RestController
@RequestMapping("/api/integrations/1c/events")
public class OneCEventController {
    private final OneCEventService eventService;
    private final autoparts.kz.modules.onecEvents.service.IncomingOneCEventLogService eventLogService;
    private final ObjectMapper objectMapper;

    public OneCEventController(
            OneCEventService eventService,
            autoparts.kz.modules.onecEvents.service.IncomingOneCEventLogService eventLogService,
            ObjectMapper objectMapper
    ) {
        this.eventService = eventService;
        this.eventLogService = eventLogService;
        this.objectMapper = objectMapper;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> receive(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-Event-Id", required = false) String eventIdHeader,
            @RequestHeader(value = "X-Event-Type", required = false) String eventTypeHeader,
            @RequestHeader(value = "X-1C-Source", required = false) String sourceHeader,
            @RequestHeader(value = "Accept", required = false) String accept,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            @RequestBody JsonNode payload
    ) {
        // Токен проверяем до любой записи в журнал: неаутентифицированный запрос
        // не должен ничего писать в incoming_1c_events.
        eventService.validateAuthorization(authorization);

        OneCEventRequest event = objectMapper.convertValue(payload, OneCEventRequest.class);
        String rawPayload = payload.toString();
        try {
            validateHeader(idempotencyKey, event.eventId(), "Idempotency-Key");
            validateHeader(eventIdHeader, event.eventId(), "X-Event-Id");
            validateHeader(eventTypeHeader, event.eventType(), "X-Event-Type");
            validateHeader(sourceHeader, event.source(), "X-1C-Source");
            if (!"ELP".equals(sourceHeader)) {
                throw new IllegalArgumentException("X-1C-Source must be ELP");
            }
            validateProtocolHeaders(accept, userAgent);
            eventService.accept(event, rawPayload);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException exception) {
            eventLogService.recordFailure(event, rawPayload, 400, exception.getMessage());
            throw exception;
        } catch (RuntimeException exception) {
            eventLogService.recordFailure(event, rawPayload, 500, "Internal processing error");
            throw exception;
        }
    }

    private void validateHeader(String actual, String expected, String name) {
        if (actual == null || actual.isBlank() || expected == null || !actual.equals(expected)) {
            throw new IllegalArgumentException(name + " must match the event payload");
        }
    }

    private void validateProtocolHeaders(String accept, String userAgent) {
        if (accept == null || !accept.toLowerCase(Locale.ROOT).contains(MediaType.APPLICATION_JSON_VALUE)) {
            throw new IllegalArgumentException("Accept must include application/json");
        }
        if (userAgent == null || !userAgent.startsWith("1C-SiteIntegration/2.0")) {
            throw new IllegalArgumentException("User-Agent must be 1C-SiteIntegration/2.0");
        }
    }
}
