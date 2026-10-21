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
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@EnabledIfEnvironmentVariable(named = "RUN_UMAPI_FITMENT_LIVE_TEST", matches = "true")
class TruckFitmentLiveTest {
    @Test void realUnknownsAreNotPromotedBySharedOe() throws Exception {
        var properties = new UmapiProperties(); properties.setBaseUrl("https://api.umapi.ru");
        var factory = new SimpleClientHttpRequestFactory(); factory.setConnectTimeout(5000); factory.setReadTimeout(10000);
        var http = new RestTemplate(factory);
        http.getInterceptors().add((request, body, execution) -> {
            request.getHeaders().set("X-App-Key", System.getenv("UMAPI_API_KEY").trim()); return execution.execute(request, body);
        });
        Map<String, JsonNode> memory = new ConcurrentHashMap<>();
        var cache = mock(OeCatalogCache.class);
        when(cache.read(anyString())).thenAnswer(i -> memory.get(i.getArgument(0)));
        doAnswer(i -> { memory.put(i.getArgument(0), i.getArgument(1)); return null; }).when(cache).write(anyString(), any());
        var service = new TruckFitmentService(new UmapiClient(http, properties), cache, new ObjectMapper(), properties);
        try {
            for (String[] part : new String[][]{{"4410329212", "WABCO"}, {"71932", "AUGER"}, {"71932", "AIC"}}) {
                var result = service.lookup(part[0], part[1]); long until = System.nanoTime() + TimeUnit.SECONDS.toNanos(60);
                while (result.status().equals("PENDING") && System.nanoTime() < until) {
                    Thread.sleep(100); result = service.lookup(part[0], part[1]);
                }
                assertNotEquals("PENDING", result.status());
                assertFalse(result.reason().startsWith("Не удалось"), "Upstream failure is not a successful live check");
                System.out.printf("Fitment live: %s %s => %s (%s)%n", part[1], part[0], result.status(), result.reason());
                if (part[1].equals("AUGER")) assertEquals("UNKNOWN", result.status());
            }
        } finally { service.close(); }
    }
}
