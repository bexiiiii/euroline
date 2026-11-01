package autoparts.kz.modules.mainSearch.service;

import autoparts.kz.integration.umapi.dto.AnalogDto;
import autoparts.kz.integration.umapi.dto.BrandRefinementDto;
import autoparts.kz.integration.umapi.service.AutomaticAnalogService;
import autoparts.kz.integration.umapi.service.UmapiIntegrationService;
import autoparts.kz.modules.cml.service.ProductEnrichmentService;
import autoparts.kz.modules.mainSearch.dto.SearchResponse;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.manualProducts.repository.ProductRepository;
import autoparts.kz.modules.stockOneC.client.OneCClient;
import autoparts.kz.modules.vinLaximo.service.CatService;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LocalNameSearchTest {
    static final String ONEC_NAME = "WABCO 4410329212 датчик ABS Г-ный !L=400";
    static final String UMAPI_NAME = "Датчик, частота вращения колеса";

    final UmapiIntegrationService umapi = mock(UmapiIntegrationService.class);
    final ProductRepository products = mock(ProductRepository.class);
    final ProductEnrichmentService enrichment = mock(ProductEnrichmentService.class);
    final MainSearchService search = new MainSearchService(mock(CatService.class), mock(OneCClient.class),
            umapi, enrichment, products, mock(JdbcTemplate.class), mock(AutomaticAnalogService.class));

    static SearchResponse.Item item(String oem, String name) {
        var item = new SearchResponse.Item(); item.setOem(oem); item.setName(name); return item;
    }

    @Test void oneCNameWinsAndCatalogNameIsKept() {
        var item = item("4410329212", UMAPI_NAME);
        MainSearchService.preferLocalName(item, " " + ONEC_NAME + " ");
        assertEquals(ONEC_NAME, item.getName());
        assertEquals(UMAPI_NAME, item.getCatalogName());
    }

    @Test void catalogNameOmittedWhenSameMissingOrJustArticle() {
        var same = item("1", "датчик abs"); MainSearchService.preferLocalName(same, "Датчик ABS");
        assertEquals("Датчик ABS", same.getName()); assertNull(same.getCatalogName());
        var missing = item("1", null); MainSearchService.preferLocalName(missing, "Датчик");
        assertEquals("Датчик", missing.getName()); assertNull(missing.getCatalogName());
        var article = item("71932", "71932"); MainSearchService.preferLocalName(article, "Датчик");
        assertNull(article.getCatalogName());
    }

    @Test void blankLocalNameKeepsCatalogName() {
        var item = item("1", UMAPI_NAME); MainSearchService.preferLocalName(item, "  ");
        assertEquals(UMAPI_NAME, item.getName()); assertNull(item.getCatalogName());
    }

    @Test void analogFromOneCShowsOurNameOthersKeepUmapiName() {
        var candidate = new BrandRefinementDto(); candidate.setArticle("71932"); candidate.setBrand("AUGER");
        candidate.setTitle(UMAPI_NAME);
        when(umapi.searchByArticle("71932")).thenReturn(List.of(candidate));
        var wabco = new AnalogDto(); wabco.setArticle("4410329212"); wabco.setBrand("WABCO"); wabco.setTitle(UMAPI_NAME);
        var other = new AnalogDto(); other.setArticle("62258DF"); other.setBrand("4u"); other.setTitle(UMAPI_NAME);
        when(umapi.getAnalogs("71932", "AUGER")).thenReturn(List.of(wabco, other));

        Product onec = new Product(); onec.setId(36L); onec.setCode("00-00000017"); onec.setSku("4410329212");
        onec.setBrand("1C"); onec.setName(ONEC_NAME); onec.setOneCRefKey("ref");
        Product ceray = new Product(); ceray.setId(70L); ceray.setSku("62258DF"); ceray.setBrand("4u");
        ceray.setName("Локальное без 1С");
        when(products.findAllByNormalizedArticleIn(anyList())).thenReturn(List.of(onec, ceray));
        var onecData = new ProductEnrichmentService.EnrichmentData();
        onecData.setName(ONEC_NAME); onecData.setOneCProduct(true); onecData.setStock(550); onecData.setWarehouses(List.of());
        var cerayData = new ProductEnrichmentService.EnrichmentData();
        cerayData.setName("Локальное без 1С"); cerayData.setWarehouses(List.of());
        when(enrichment.enrichProducts(anyList())).thenReturn(Map.of(36L, onecData, 70L, cerayData));

        var results = search.search("71932", null, "AUGER").getResults();
        var w = results.stream().filter(i -> i.getBrand().equals("WABCO")).findFirst().orElseThrow();
        assertEquals(ONEC_NAME, w.getName()); assertEquals(UMAPI_NAME, w.getCatalogName());
        var u = results.stream().filter(i -> i.getBrand().equals("4u")).findFirst().orElseThrow();
        assertEquals(UMAPI_NAME, u.getName()); assertNull(u.getCatalogName());
        assertEquals(UMAPI_NAME, results.get(0).getName());
    }
}
