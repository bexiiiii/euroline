package autoparts.kz.integration.umapi.service;

import autoparts.kz.integration.umapi.client.UmapiClient;
import autoparts.kz.integration.umapi.config.UmapiProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Explicit opt-in: read-only upstream requests, no database, cart, order or 1C calls. */
@EnabledIfEnvironmentVariable(named = "RUN_UMAPI_OE_LIVE_TEST", matches = "true")
class AutomaticAnalogLiveTest {
    @Test void coldSearchFindsBothDirectionsViaRealOeData() throws Exception {
        String token = System.getenv("UMAPI_API_KEY");
        assertNotNull(token);
        var properties = new UmapiProperties(); properties.setBaseUrl("https://api.umapi.ru");
        var factory = new SimpleClientHttpRequestFactory(); factory.setConnectTimeout(5000); factory.setReadTimeout(10000);
        var http = new RestTemplate(factory);
        http.getInterceptors().add((request, body, execution) -> {
            request.getHeaders().set("X-App-Key", token.trim()); return execution.execute(request, body);
        });
        Map<String, JsonNode> memory = new ConcurrentHashMap<>();
        var cache = mock(OeCatalogCache.class);
        when(cache.read(anyString())).thenAnswer(i -> memory.get(i.getArgument(0)));
        doAnswer(i -> { memory.put(i.getArgument(0), i.getArgument(1)); return null; }).when(cache).write(anyString(), any());
        var service = new AutomaticAnalogService(new UmapiClient(http, properties), cache, new ObjectMapper(), properties);
        try {
            for (String[] pair : new String[][]{{"4410329212", "WABCO", "71932", "AUGER"}, {"71932", "AUGER", "4410329212", "WABCO"}}) {
                // Clear all cache before each direction: no dependence on the previous search.
                memory.clear();
                var result = service.lookup(pair[0], pair[1]);
                long until = System.currentTimeMillis() + 115_000;
                while (result.loading() && System.currentTimeMillis() < until) {
                    Thread.sleep(250); result = service.lookup(pair[0], pair[1]);
                }
                assertFalse(result.loading());
                assertTrue(result.matches().stream().anyMatch(m -> m.article().equals(pair[2]) && m.brand().equals(pair[3])),
                        "Missing automatic reciprocal OE match for " + pair[1]);
                System.out.printf("OE live: %s %s -> %s %s found; candidates=%d partial=%s%n",
                        pair[1], pair[0], pair[3], pair[2], result.matches().size(), result.partial());
                assertFalse(result.partial(), "Discovery did not finish cleanly");
            }
        } finally { service.close(); }
    }
}
