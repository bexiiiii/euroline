package autoparts.kz.modules.onecEvents.service;

import autoparts.kz.modules.category.repository.CategoryRepository;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.manualProducts.repository.ProductRepository;
import autoparts.kz.modules.onecEvents.dto.OneCEventRequest;
import autoparts.kz.modules.order.repository.OrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.PreparedStatementSetter;
import org.springframework.jdbc.core.ResultSetExtractor;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class OneCEventServiceStockTest {

    private static final String KNOWN = "20291bf2-722a-11f1-9923-ac1f6bdbe64e";
    private static final String UNKNOWN = "77a4446a-722a-11f1-9923-ac1f6bdbe64e";
    private static final String WAREHOUSE = "2c78f37c-5fe8-11f1-9840-ac1f6bdbe64e";
    private static final String PRICE_TYPE = "39a4354d-763a-11f1-938e-ac1f6bdbe64e";
    private static final String ZERO = "00000000-0000-0000-0000-000000000000";

    private final ObjectMapper mapper = new ObjectMapper();
    private JdbcTemplate jdbc;
    private ProductRepository products;
    private CategoryRepository categories;
    private OneCEventService service;

    @BeforeEach
    void setUp() {
        jdbc = mock(JdbcTemplate.class);
        products = mock(ProductRepository.class);
        categories = mock(CategoryRepository.class);
        service = new OneCEventService("token", jdbc, products, categories, mock(OrderRepository.class));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);
        when(jdbc.query(anyString(), any(PreparedStatementSetter.class), any(ResultSetExtractor.class)))
                .thenReturn(new BigDecimal("93"));
    }

    @Test
    void acceptsRegisterRowArray() throws Exception {
        Product product = new Product();
        when(products.findByOneCRefKey(KNOWN)).thenReturn(Optional.of(product));
        when(products.findByOneCRefKey(UNKNOWN)).thenReturn(Optional.empty());

        String raw = """
                {"eventId":"c30a39d3-0f3d-444d-b479-52dd3f1bcec5","eventType":"stock.updated","entity":"stock",
                 "refKey":"110d0f2c-69a0-498b-b432-b3c79f5a3d3a","source":"ELP","version":2,"attempt":1,
                 "data":[%s,%s,%s]}
                """.formatted(row(KNOWN, 100, 10, "a"), row(KNOWN, 5, 2, "b"), row(UNKNOWN, 100, 0, ZERO));

        service.accept(mapper.readValue(raw, OneCEventRequest.class), raw);

        // Two rows of the known product in one warehouse are summed: (100-10) + (5-2) = 93.
        verify(jdbc).update(contains("INSERT INTO onec_stocks"),
                eq(KNOWN), eq(WAREHOUSE), eq(WAREHOUSE), eq(new BigDecimal("93")), anyString());
        // Unknown product is still stored for a later product.updated.
        verify(jdbc).update(contains("INSERT INTO onec_stocks"),
                eq(UNKNOWN), eq(WAREHOUSE), eq(WAREHOUSE), eq(new BigDecimal("100")), anyString());
        assertEquals(93, product.getStock());
        verify(products).save(product);
    }

    @Test
    void rejectsRowWithoutProduct() throws Exception {
        String raw = """
                {"eventId":"9aa2dc61-1aec-4363-8433-c46aea304d6b","eventType":"stock.updated","entity":"stock",
                 "source":"ELP","data":[{"ВНаличии":1,"СкладRefKey":"%s"}]}
                """.formatted(WAREHOUSE);
        assertThrows(IllegalArgumentException.class,
                () -> service.accept(mapper.readValue(raw, OneCEventRequest.class), raw));
    }

    @Test
    void acceptsPriceRegisterRowArray() throws Exception {
        Product product = new Product();
        when(products.findByOneCRefKey(KNOWN)).thenReturn(Optional.of(product));
        String raw = """
                {"eventId":"9a0d6d35-86c4-4b11-80e0-6d0d5507a156","eventType":"price.updated","entity":"price",
                 "source":"ELP","data":[{"НоменклатураRefKey":"%s","ВидЦеныRefKey":"%s","Цена":12500,"ВалютаRefKey":"%s"}]}
                """.formatted(KNOWN, PRICE_TYPE, ZERO);

        service.accept(mapper.readValue(raw, OneCEventRequest.class), raw);

        verify(jdbc).update(contains("INSERT INTO onec_prices"),
                eq(KNOWN), eq(PRICE_TYPE), eq(new BigDecimal("12500")), eq(ZERO), anyString());
        assertEquals(12500, product.getPrice());
        verify(products).save(product);
    }

    @Test
    void storesPricesFromInitialProductSnapshot() throws Exception {
        Product product = new Product();
        when(products.findByOneCRefKey(KNOWN)).thenReturn(Optional.of(product));
        when(jdbc.query(anyString(), any(PreparedStatementSetter.class), any(ResultSetExtractor.class)))
                .thenReturn(new BigDecimal("12500"), BigDecimal.ZERO);
        String raw = """
                {"eventId":"8e933a68-3c1e-49cf-ae65-60baf6684870","eventType":"product.updated","entity":"product",
                 "refKey":"%s","source":"ELP","data":{"refKey":"%s","exists":true,"name":"Тестовый товар","code":"T-1",
                 "prices":[{"priceTypeRefKey":"%s","price":12500,"currencyRefKey":"%s"}]}}
                """.formatted(KNOWN, KNOWN, PRICE_TYPE, ZERO);

        service.accept(mapper.readValue(raw, OneCEventRequest.class), raw);

        verify(jdbc).update(contains("INSERT INTO onec_prices"),
                eq(KNOWN), eq(PRICE_TYPE), eq(new BigDecimal("12500")), eq(ZERO), anyString());
        assertEquals(12500, product.getPrice());
        verify(products).save(product);
    }

    @Test
    void assignsCategoryFromOneCProductGroup() throws Exception {
        Product product = new Product();
        when(products.findByOneCRefKey(KNOWN)).thenReturn(Optional.of(product));
        when(categories.findBySlug("onec-2c78f37c-5fe8-11f1-9840-ac1f6bdbe64e")).thenReturn(Optional.empty());
        when(categories.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        String raw = """
                {"eventId":"67e5d415-6776-4d1e-aab5-ae2b826e8450","eventType":"product.updated","entity":"product",
                 "refKey":"%s","source":"ELP","data":{"refKey":"%s","exists":true,"name":"Тестовый товар","code":"T-1",
                 "categoryRefKey":"2c78f37c-5fe8-11f1-9840-ac1f6bdbe64e","categoryName":"Ходовая часть"}}
                """.formatted(KNOWN, KNOWN);

        service.accept(mapper.readValue(raw, OneCEventRequest.class), raw);

        assertEquals("Ходовая часть", product.getCategory().getName());
        verify(categories).save(any());
    }

    @Test
    void storesWarehouseDirectory() throws Exception {
        String raw = """
                {"eventId":"5b0c7a1e-3a8f-4d38-9f0e-0f4b5c6d7e8f","eventType":"warehouse.updated","entity":"warehouse",
                 "source":"ELP","data":[{"refKey":"%s","name":"Основной склад","code":"000001","deletionMark":false}]}
                """.formatted(WAREHOUSE);
        service.accept(mapper.readValue(raw, OneCEventRequest.class), raw);

        verify(jdbc).update(contains("INSERT INTO onec_warehouses"),
                eq(WAREHOUSE), eq("Основной склад"), eq("000001"), eq(false), anyString());
        verify(jdbc).update(contains("UPDATE onec_stocks SET warehouse_name"), eq("Основной склад"), eq(WAREHOUSE));
    }

    private static String row(String product, int inStock, int toShip, String series) {
        return """
                {"ВНаличии":%d,"КОтгрузке":%d,"СкладRefKey":"%s","НоменклатураRefKey":"%s",
                 "СерияRefKey":"%s","ХарактеристикаRefKey":"%s","КонтролироватьОстатки":false}
                """.formatted(inStock, toShip, WAREHOUSE, product, series, ZERO);
    }
}
