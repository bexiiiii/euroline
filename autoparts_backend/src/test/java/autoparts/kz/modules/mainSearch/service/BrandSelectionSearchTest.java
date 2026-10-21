package autoparts.kz.modules.mainSearch.service;

import autoparts.kz.integration.umapi.dto.*;
import autoparts.kz.integration.umapi.service.UmapiIntegrationService;
import autoparts.kz.integration.umapi.service.AutomaticAnalogService;
import autoparts.kz.modules.cml.service.ProductEnrichmentService;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.manualProducts.repository.ProductRepository;
import autoparts.kz.modules.stockOneC.client.OneCClient;
import autoparts.kz.modules.vinLaximo.service.CatService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BrandSelectionSearchTest {
    final UmapiIntegrationService umapi = mock(UmapiIntegrationService.class);
    final ProductRepository products = mock(ProductRepository.class);
    final ProductEnrichmentService enrichment = mock(ProductEnrichmentService.class);
    final AutomaticAnalogService automatic = mock(AutomaticAnalogService.class);
    final MainSearchService search = new MainSearchService(mock(CatService.class), mock(OneCClient.class),
            umapi, enrichment, products, mock(JdbcTemplate.class), automatic);

    @BeforeEach void setup() {
        when(products.findAllByNormalizedArticleIn(anyList())).thenReturn(List.of());
        when(enrichment.enrichProducts(anyList())).thenReturn(Map.of());
        when(umapi.searchByArticle("71932")).thenReturn(List.of(candidate("71932", "AUGER"), candidate("71932", "AIC")));
    }
    static BrandRefinementDto candidate(String article, String brand) {
        var result = new BrandRefinementDto(); result.setArticle(article); result.setBrand(brand); return result;
    }
    static AnalogDto cross(String article, String brand) {
        var result = new AnalogDto(); result.setArticle(article); result.setBrand(brand); return result;
    }
    @Test void ambiguousArticleDoesNotMixCrosses() {
        var result = search.search("71932", null);
        assertTrue(result.isSelectionRequired());
        assertEquals(2, result.getResults().size());
        verify(umapi, never()).getAnalogs(anyString(), anyString());
        verifyNoInteractions(automatic);
    }
    @Test void automaticOeMatchesMergeWithoutBorrowingPrimaryStockAndKeepEvidence() {
        when(automatic.lookup("71932", "AUGER")).thenReturn(new AutomaticAnalogService.Snapshot(List.of(
                new AutomaticAnalogService.Match("4410329212", "WABCO", "Sensor", null, List.of("DAF 0082826"))), true, false));
        when(umapi.getAnalogs("71932", "AUGER")).thenReturn(List.of(cross("441 032 9212", "WABCO")));
        var result = search.search("71932", null, "AUGER");
        assertTrue(result.isAnalogsLoading()); assertEquals(2, result.getResults().size());
        var other = result.getResults().get(1);
        assertEquals("UMAPI_SHARED_OE", other.getAnalogSource());
        assertEquals(List.of("DAF 0082826"), other.getOeNumbers());
        assertNull(other.getProductId()); assertNull(other.getQuantity());
        assertEquals("UNVERIFIED", other.getCompatibilityStatus());
    }
    @Test void explicitBrandUsesOnlyItsCrossesAndKeepsDifferentManufacturers() {
        when(umapi.getAnalogs("71932", "AUGER")).thenReturn(List.of(
                cross("71932", "AUGER"), cross("4410329212", "WABCO"), cross("441 032 9212", "WABCO"),
                cross("4410329212", "SAMPA")));
        var result = search.search("71932", null, "auger");
        assertFalse(result.isSelectionRequired());
        assertEquals("AUGER", result.getSelectedBrand());
        assertEquals(3, result.getResults().size());
        assertEquals("UNVERIFIED", result.getResults().get(1).getCompatibilityStatus());
        verify(umapi).getAnalogs("71932", "AUGER");
        verify(umapi, never()).getAnalogs("71932", "AIC");
    }
    @Test void typedBrandAndUnknownBrand() {
        assertEquals("AUGER", search.search("AUGER 71932", null).getSelectedBrand());
        var result = search.search("71932", null, "UNKNOWN");
        assertTrue(result.isSelectionRequired());
        assertFalse(result.getWarnings().isEmpty());
        verify(umapi, never()).getAnalogs("71932", "UNKNOWN");
    }
    @Test void spacedArticleUsesSameIdentity() {
        when(umapi.searchByArticle("4410329212")).thenReturn(List.of(candidate("4410329212", "WABCO")));
        assertEquals("WABCO", search.search("441 032 92 12", null).getSelectedBrand());
        verify(umapi).getAnalogs("4410329212", "WABCO");
    }
    @Test void stockNeverLeaksToAnotherBrandAndUsesStableProductId() {
        Product product = new Product(); product.setId(9L); product.setCode("00-00000017");
        product.setSku("71932"); product.setBrand("AUGER"); product.setOneCRefKey("onec-ref");
        when(products.findAllByNormalizedArticleIn(anyList())).thenReturn(List.of(product));
        var data = new ProductEnrichmentService.EnrichmentData(); data.setStock(550); data.setPrice(100);
        data.setWarehouses(List.of());
        when(enrichment.enrichProducts(anyList())).thenReturn(Map.of(9L, data));
        var result = search.search("71932", null);
        var auger = result.getResults().stream().filter(i -> i.getBrand().equals("AUGER")).findFirst().orElseThrow();
        var aic = result.getResults().stream().filter(i -> i.getBrand().equals("AIC")).findFirst().orElseThrow();
        assertEquals(550, auger.getQuantity()); assertEquals(9L, auger.getProductId());
        assertEquals("onec-ref", auger.getOnecRefKey());
        assertNull(aic.getQuantity()); assertNull(aic.getProductId());
    }
    @Test void missingCrossIsNotInventedAndSupplierFailureIsVisible() {
        assertEquals(1, search.search("71932", null, "AUGER").getResults().size());
        when(umapi.getAnalogs("71932", "AUGER")).thenThrow(new RuntimeException("upstream down"));
        assertFalse(search.search("71932", null, "AUGER").getWarnings().isEmpty());
    }
    @Test void legacyOneCLeadingBrandArticleRetainsStockButDescriptionNumbersDoNotMatch() {
        Product product = new Product(); product.setId(36L); product.setCode("00-00000017");
        product.setBrand("1C"); product.setName("WABCO 4410329212 датчик ABS L=400"); product.setOneCRefKey("ref");
        when(products.findAllByNormalizedArticleIn(anyList())).thenReturn(List.of(product));
        var data = new ProductEnrichmentService.EnrichmentData(); data.setStock(1000); data.setWarehouses(List.of());
        when(enrichment.enrichProducts(anyList())).thenReturn(Map.of(36L, data));
        when(umapi.searchByArticle("4410329212")).thenReturn(List.of(candidate("4410329212", "WABCO")));
        var result = search.search("4410329212", null, "WABCO");
        assertEquals(1000, result.getResults().get(0).getQuantity());
        assertEquals(36L, result.getResults().get(0).getProductId());
        product.setName("Датчик для WABCO 4410329212");
        assertEquals("", MainSearchService.legacyNameArticle(product));
        product.setName("WABCO 4410329212 датчик"); product.setSku("different");
        assertEquals("", MainSearchService.legacyNameArticle(product));
    }
}
