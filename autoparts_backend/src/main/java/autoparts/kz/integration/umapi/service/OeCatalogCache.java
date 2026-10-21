package autoparts.kz.integration.umapi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import java.time.Duration;

/** Bounded-TTL catalog data only. Never cache stock, prices, or supplier errors here. */
@Component
@RequiredArgsConstructor
public class OeCatalogCache {
    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;

    public JsonNode read(String key) {
        try {
            String value = redis.opsForValue().get("umapi-oe-v1:" + key);
            return value == null ? null : mapper.readTree(value);
        } catch (Exception ignored) { return null; } // Cache failure must not break search.
    }

    public void write(String key, JsonNode value) {
        try { redis.opsForValue().set("umapi-oe-v1:" + key, value.toString(), Duration.ofHours(6)); }
        catch (Exception ignored) { /* Successful upstream data still remains available in this job. */ }
    }
}
