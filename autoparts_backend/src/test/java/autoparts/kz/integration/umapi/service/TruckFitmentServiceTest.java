package autoparts.kz.integration.umapi.service;

import autoparts.kz.integration.umapi.client.UmapiClient;
import autoparts.kz.integration.umapi.config.UmapiProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TruckFitmentServiceTest {
    final ObjectMapper mapper = new ObjectMapper();
    JsonNode json(String s) throws Exception { return mapper.readTree(s); }
    String segment(String s) throws Exception { return TruckFitmentService.classify(json(s)).status(); }
    @Test void truckIsConfirmedEvenWithPassengerApplications() throws Exception {
        assertEquals("TRUCK_TRAILER", segment("{\"PC\":[{\"PC_ID\":9}],\"CV\":[{\"CV_ID\":1,\"PLATFORM_TYPE\":\"Грузовой автомобиль\"}]}"));
    }
    @Test void trailerAxleIsConfirmed() throws Exception {
        assertEquals("TRUCK_TRAILER", segment("{\"Axle\":[{\"AXL_ID\":2,\"AXLE_STYLE\":\"Ось полуприцепа\"}]}"));
    }
    @Test void passengerAndBusAreNotTruck() throws Exception {
        assertEquals("NON_TARGET", segment("{\"PC\":[{\"PC_ID\":3}]}"));
        assertEquals("NON_TARGET", segment("{\"CV\":[{\"CV_ID\":4,\"PLATFORM_TYPE\":\"Автобус\"}]}"));
    }
    @Test void cvAloneAndBrandOrModelNamesCannotProveTruck() throws Exception {
        assertEquals("UNKNOWN", segment("{\"CV\":[{\"CV_ID\":1,\"MANUFACTURER\":\"DAF\",\"MODEL_SERIES\":\"65 CF\",\"PLATFORM_TYPE\":null}]}"));
        assertEquals("UNKNOWN", segment("{\"Axle\":[{\"AXL_ID\":2,\"MANUFACTURER\":\"BPW\",\"AXLE_TYPE\":\"Ведущая ось\"}]}"));
    }
    @Test void absentMalformedOrEngineOnlyStaysUnknown() throws Exception {
        for (String s : List.of("{}", "null", "{\"CV\":{}}", "{\"CV\":[{\"PLATFORM_TYPE\":\"Truck\"}]}", "{\"Engine\":[{\"ENG_ID\":1}]}"))
            assertEquals("UNKNOWN", segment(s));
    }
    @Test void unknownCommercialLinkIsNotPassengerOnly() throws Exception {
        assertEquals("UNKNOWN", segment("{\"PC\":[{\"PC_ID\":3}],\"CV\":[{\"CV_ID\":1}]}"));
    }
    @Test void conflictingTypeLabelsStayUnknown() throws Exception {
        assertEquals("UNKNOWN", segment("{\"CV\":[{\"CV_ID\":1,\"PLATFORM_TYPE\":\"Truck / bus\"}]}"));
    }

    @Test void resolvesMissingVehicleTypeAndUsesPersistentCacheWithoutBorrowingOe() throws Exception {
        var client = mock(UmapiClient.class); var cache = mock(OeCatalogCache.class);
        Map<String, JsonNode> stored = new ConcurrentHashMap<>();
        when(cache.read(anyString())).thenAnswer(i -> stored.get(i.getArgument(0)));
        doAnswer(i -> { stored.put(i.getArgument(0), i.getArgument(1)); return null; }).when(cache).write(anyString(), any());
        when(client.getCrossArticleInfo("00123", "PARTS")).thenReturn(json("{\"article\":\"00-123\",\"brand\":\"PARTS\",\"catalogId\":7}"));
        when(client.getArticleDetails(7)).thenReturn(json("{\"ART_ID\":7,\"ARTICLE_NR\":\"00123\",\"BRAND\":\"PARTS\",\"LINK\":{\"CV\":[{\"CV_ID\":20}]}}"));
        when(client.getCommercialVehicleDetails(20)).thenReturn(json("{\"CV_ID\":20,\"PLATFORM_TYPE\":\"Truck\"}"));
        var service = new TruckFitmentService(client, cache, mapper, new UmapiProperties());
        try {
            var result = waitFor(service, "00123", "parts");
            assertEquals("TRUCK_TRAILER", result.status()); assertTrue(result.evidence().get(0).contains("#20"));
            verify(client, times(1)).getArticleDetails(7);
            try (var second = new ServiceCloser(new TruckFitmentService(client, cache, mapper, new UmapiProperties()))) {
                assertEquals("TRUCK_TRAILER", second.service.lookup("00123", "PARTS").status());
                verify(client, times(1)).getCrossArticleInfo("00123", "PARTS");
            }
            verify(client, never()).getOeCandidates(anyString(), anyInt());
        } finally { service.close(); }
    }
    @Test void upstreamFailureIsUnknownAndNeverSavedAsSuccessfulResult() throws Exception {
        var client = mock(UmapiClient.class); var cache = mock(OeCatalogCache.class);
        when(client.getCrossArticleInfo(anyString(), anyString())).thenThrow(new IllegalStateException("offline"));
        var service = new TruckFitmentService(client, cache, mapper, new UmapiProperties());
        try { assertEquals("UNKNOWN", waitFor(service, "00123", "PARTS").status());
            verify(cache, never()).write(startsWith("fitment-v1:"), any());
        } finally { service.close(); }
    }
    @Test void mismatchedIdentityCannotImportAnotherBrandsFitment() throws Exception {
        var client = mock(UmapiClient.class); var cache = mock(OeCatalogCache.class);
        when(client.getCrossArticleInfo(anyString(), anyString())).thenReturn(json("{\"article\":\"00123\",\"brand\":\"OTHER\",\"catalogId\":7}"));
        var service = new TruckFitmentService(client, cache, mapper, new UmapiProperties());
        try { assertEquals("UNKNOWN", waitFor(service, "00123", "PARTS").status());
            verify(client, never()).getArticleDetails(anyLong());
        } finally { service.close(); }
    }
    static TruckFitmentService.Result waitFor(TruckFitmentService service, String article, String brand) throws Exception {
        var result = service.lookup(article, brand);
        long until = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
        while (result.status().equals("PENDING") && System.nanoTime() < until) {
            Thread.sleep(10); result = service.lookup(article, brand);
        }
        assertNotEquals("PENDING", result.status()); return result;
    }
    record ServiceCloser(TruckFitmentService service) implements AutoCloseable { public void close() { service.close(); } }
}
