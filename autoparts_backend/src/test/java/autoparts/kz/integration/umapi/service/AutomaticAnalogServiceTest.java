package autoparts.kz.integration.umapi.service;

import autoparts.kz.integration.umapi.client.UmapiClient;
import autoparts.kz.integration.umapi.config.UmapiProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import java.util.*;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AutomaticAnalogServiceTest {
    final ObjectMapper mapper = new ObjectMapper();
    final UmapiClient client = mock(UmapiClient.class);
    final OeCatalogCache cache = mock(OeCatalogCache.class);
    final AutomaticAnalogService service = new AutomaticAnalogService(client, cache, mapper, new UmapiProperties());
    @AfterEach void close() { service.close(); }
    JsonNode json(String data) throws Exception { return mapper.readTree(data); }
    JsonNode part(String article, String brand, int id) throws Exception {
        return json("""
          {"ART_ID":%d,"ARTICLE_NR":"%s","BRAND":"%s","COMPLETE_DES":"Sensor","SUP_ID":22,
          "PRODUCTS":[{"PT_ID":412}],"CRITERIAS":[],"OE_CODES":[{"BRAND":"DAF","DISPLAY_NR":"0082826"}],
          "ARL_TYPE":"OENumber","ARL_BRA_BRAND":"DAF","ARL_DISPLAY_NR":"0082826"}
          """.formatted(id, article, brand));
    }
    void identity(String article, String brand, int id) throws Exception {
        when(client.getCrossArticleInfo(article, brand)).thenReturn(json("""
          {"article":"%s","brand":"%s","catalogId":%d}
          """.formatted(article, brand, id)));
        when(client.getArticleDetails(id)).thenReturn(part(article, brand, id));
    }
    AutomaticAnalogService.Snapshot await(String article, String brand) throws Exception {
        var result = service.lookup(article, brand);
        long until = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
        while (result.loading() && System.nanoTime() < until) { Thread.sleep(10); result = service.lookup(article, brand); }
        assertFalse(result.loading()); return result;
    }
    @Test void discoversBothDirectionsFromSharedOeWithoutPairSeed() throws Exception {
        identity("4410329212", "WABCO", 1); identity("71932", "AUGER", 2);
        when(client.getOeCandidates("0082826", 0)).thenReturn(mapper.valueToTree(Map.of("rows", 2,
                "data", List.of(part("4410329212", "WABCO", 1), part("71932", "AUGER", 2)))));
        var forward = await("441 032 9212", "wabco");
        var reverse = await("71932", "AUGER");
        assertFalse(forward.partial()); assertFalse(reverse.partial());
        assertEquals("AUGER", forward.matches().get(0).brand());
        assertEquals("WABCO", reverse.matches().get(0).brand());
        assertEquals(List.of("DAF 0082826"), forward.matches().get(0).oeReferences());
    }
    @Test void doesNotDependOnSpecificArticleOrOeNumbers() throws Exception {
        identity("ABC123", "MAKER", 7);
        var source = (com.fasterxml.jackson.databind.node.ObjectNode) part("ABC123", "MAKER", 7);
        source.set("OE_CODES", json("[{\"BRAND\":\"OEM\",\"DISPLAY_NR\":\"0009\"}]"));
        when(client.getArticleDetails(7)).thenReturn(source);
        var target = (com.fasterxml.jackson.databind.node.ObjectNode) part("XYZ789", "OTHER", 8);
        target.put("ARL_BRA_BRAND", "OEM"); target.put("ARL_DISPLAY_NR", "0009");
        when(client.getOeCandidates("0009", 0)).thenReturn(mapper.valueToTree(Map.of("rows", 1, "data", List.of(target))));
        assertEquals("XYZ789", await("ABC123", "MAKER").matches().get(0).article());
    }
    @Test void rejectsWrongOeBrandCategoryAndKnownConflictingDimensions() throws Exception {
        identity("SOURCE1", "MAKER", 1);
        var source = (com.fasterxml.jackson.databind.node.ObjectNode) part("SOURCE1", "MAKER", 1);
        source.set("CRITERIAS", json("[{\"CRI_ID\":203,\"VALUE\":\"400\"}]"));
        when(client.getArticleDetails(1)).thenReturn(source);
        var wrongBrand = (com.fasterxml.jackson.databind.node.ObjectNode) part("TARGET1", "OTHER", 2);
        wrongBrand.put("ARL_BRA_BRAND", "VOLVO");
        var wrongGroup = (com.fasterxml.jackson.databind.node.ObjectNode) part("TARGET2", "OTHER", 3);
        wrongGroup.set("PRODUCTS", json("[{\"PT_ID\":999}]"));
        var wrongLength = (com.fasterxml.jackson.databind.node.ObjectNode) part("TARGET3", "OTHER", 4);
        wrongLength.set("CRITERIAS", json("[{\"CRI_ID\":203,\"VALUE\":\"500\"}]"));
        when(client.getOeCandidates("0082826", 0)).thenReturn(mapper.valueToTree(Map.of("rows", 3, "data", List.of(wrongBrand, wrongGroup, wrongLength))));
        assertTrue(await("SOURCE1", "MAKER").matches().isEmpty());
    }
    @Test void followsOffsetAfterShortPageAndDeduplicates() throws Exception {
        identity("SOURCE1", "MAKER", 1);
        var target = part("TARGET1", "OTHER", 2);
        when(client.getOeCandidates("0082826", 0)).thenReturn(mapper.valueToTree(Map.of("rows", 102, "data", List.of(target))));
        when(client.getOeCandidates("0082826", 100)).thenReturn(mapper.valueToTree(Map.of("rows", 102, "data", List.of(target, part("TARGET2", "OTHER", 3)))));
        assertEquals(2, await("SOURCE1", "MAKER").matches().size());
        verify(client).getOeCandidates("0082826", 100);
    }
    @Test void providerFailureIsPartialAndNotCachedAsSuccess() throws Exception {
        identity("SOURCE1", "MAKER", 1);
        when(client.getOeCandidates("0082826", 0)).thenThrow(new IllegalStateException("429"));
        assertTrue(await("SOURCE1", "MAKER").partial());
        verify(cache, never()).write(startsWith("result:"), any());
    }
    @Test void cacheHitAvoidsUpstreamAndConcurrentLookupIsSingleFlight() throws Exception {
        CountDownLatch entered = new CountDownLatch(1), release = new CountDownLatch(1);
        when(client.getCrossArticleInfo("SOURCE1", "MAKER")).thenAnswer(invocation -> {
            entered.countDown(); release.await(2, TimeUnit.SECONDS);
            return json("{\"article\":\"SOURCE1\",\"brand\":\"MAKER\",\"catalogId\":null}");
        });
        assertTrue(service.lookup("SOURCE1", "MAKER").loading()); assertTrue(entered.await(2, TimeUnit.SECONDS));
        for (int i = 0; i < 10; i++) assertTrue(service.lookup("SOURCE1", "MAKER").loading());
        release.countDown(); assertFalse(await("SOURCE1", "MAKER").partial());
        verify(client, times(1)).getCrossArticleInfo("SOURCE1", "MAKER");
        when(cache.read(startsWith("result:"))).thenReturn(mapper.valueToTree(new AutomaticAnalogService.Snapshot(List.of(
                new AutomaticAnalogService.Match("TARGET", "OTHER", "Sensor", null, List.of("OEM 009"))), false, false)));
        assertEquals(1, service.lookup("DIFFERENT", "MAKER").matches().size());
        verify(client, never()).getCrossArticleInfo("DIFFERENT", "MAKER");
    }
    @Test void malformedSuccessIsNotCachedAndIdentityCannotSwitchBrand() throws Exception {
        when(client.getCrossArticleInfo("SOURCE1", "MAKER")).thenReturn(json("{\"article\":\"SOURCE1\",\"brand\":\"WRONG\",\"catalogId\":2}"));
        assertTrue(await("SOURCE1", "MAKER").partial());
        verify(client, never()).getArticleDetails(anyLong());
        identity("SOURCE2", "MAKER", 3);
        when(client.getOeCandidates("0082826", 0)).thenReturn(json("{\"message\":\"unavailable\"}"));
        assertTrue(await("SOURCE2", "MAKER").partial());
        verify(cache, never()).write(contains("oe:0082826"), any());
    }
}
