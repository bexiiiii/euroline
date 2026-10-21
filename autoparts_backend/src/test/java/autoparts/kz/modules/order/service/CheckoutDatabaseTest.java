package autoparts.kz.modules.order.service;

import autoparts.kz.common.exception.RestExceptionHandler;
import autoparts.kz.common.security.SimplePrincipal;
import autoparts.kz.modules.auth.Roles.Role;
import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.auth.repository.UserRepository;
import autoparts.kz.modules.cart.controller.CartController;
import autoparts.kz.modules.cart.repository.CartRepository;
import autoparts.kz.modules.cart.service.CartService;
import autoparts.kz.modules.cml.service.*;
import autoparts.kz.modules.finance.service.FinanceService;
import autoparts.kz.modules.order.controller.OrderController;
import autoparts.kz.modules.order.repository.OrderRepository;
import autoparts.kz.modules.notifications.service.NotificationService;
import autoparts.kz.modules.telegram.service.TelegramNotificationService;
import autoparts.kz.modules.common.storage.FileStorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.*;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Explicitly opt-in. Runs against a disposable production snapshot, never euroline itself.
 * All tests roll back. No jobs, message consumers, HTTP clients or external notifications are loaded. */
@EnabledIfEnvironmentVariable(named = "CHECKOUT_DB_TEST", matches = "true")
@DataJpaTest(showSql = false, properties = {"spring.liquibase.enabled=false", "spring.jpa.hibernate.ddl-auto=none",
        "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect", "spring.cache.type=none"})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ContextConfiguration(classes = CheckoutDatabaseTest.Config.class)
class CheckoutDatabaseTest {
    @Configuration
    @EnableJpaRepositories("autoparts.kz")
    @EntityScan("autoparts.kz")
    @Import({JdbcTemplateAutoConfiguration.class, CartService.class, OrderService.class, FinanceService.class,
            ProductEnrichmentService.class, OrderToCmlConverter.class})
    static class Config {
        @Bean ObjectMapper objectMapper() { return new ObjectMapper().findAndRegisterModules(); }
        @Bean JdbcTemplate jdbcTemplate(javax.sql.DataSource dataSource) { return new JdbcTemplate(dataSource); }
        @Bean org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate namedJdbcTemplate(JdbcTemplate jdbc) {
            return new org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate(jdbc);
        }
    }
    @MockBean NotificationService notifications;
    @MockBean TelegramNotificationService telegram;
    @MockBean OneCBridgePublisher bridge;
    @MockBean ReturnIntegrationService returns;
    @MockBean FileStorageService storage;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager entityManager;
    @Autowired CartService carts;
    @Autowired OrderService orders;
    @Autowired CartRepository cartRepository;
    @Autowired OrderRepository orderRepository;
    @Autowired UserRepository users;
    @Autowired ObjectMapper mapper;
    @Autowired ProductEnrichmentService enrichment;
    @Autowired autoparts.kz.modules.manualProducts.repository.ProductRepository products;
    MockMvc http;
    Long userId, productId;
    String productRef, warehouseRef;

    @BeforeEach void setup() {
        String database = jdbc.queryForObject("select current_database()", String.class);
        assertTrue(database != null && database.startsWith("euroline_checkout_"), "Refusing non-test database");
        User user = new User(); user.setEmail("checkout-" + UUID.randomUUID() + "@example.invalid");
        user.setPassword("test-only-not-a-login-hash"); user.setRole(Role.USER);
        user.setName("Тест"); user.setSurname("Изолированный"); user.setCity("Алматы");
        userId = users.saveAndFlush(user).getId();
        var product = jdbc.queryForMap("select p.id,p.onec_ref_key,s.warehouse_ref_key from products p join onec_stocks s "
                + "on p.onec_ref_key=s.product_ref_key where p.onec_ref_key=?", "eca33ac8-7635-11f1-8ab3-ac1f6bdbe64e");
        productId = ((Number) product.get("id")).longValue(); productRef = (String) product.get("onec_ref_key");
        warehouseRef = (String) product.get("warehouse_ref_key");
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new SimplePrincipal(userId, user.getEmail()), null, List.of()));
        http = MockMvcBuilders.standaloneSetup(new CartController(carts), new OrderController(orders, orderRepository))
                .setControllerAdvice(new RestExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).build();
    }
    @AfterEach void clearAuthentication() { SecurityContextHolder.clearContext(); }

    void testPriceAndBalance() {
        jdbc.update("insert into onec_prices(product_ref_key,price_type_ref_key,amount,currency,payload,updated_at) "
                + "values (?, 'isolated-checkout-test', 100, 'KZT', '{}'::jsonb, now())", productRef);
        jdbc.update("insert into client_balances(client_id,balance,credit_limit,credit_used,updated_at) values (?,1000,0,0,now())", userId);
    }
    String offer(int quantity) throws Exception {
        return mapper.writeValueAsString(Map.of("productId", productId, "warehouseRefKey", warehouseRef, "quantity", quantity));
    }
    @Test void realDatabaseCheckoutPersistsWarehouseTotalOutboxAndClearsCart() throws Exception {
        testPriceAndBalance();
        http.perform(post("/api/cart/offers").contentType("application/json").content(offer(2)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].warehouseRefKey").value(warehouseRef))
                .andExpect(jsonPath("$.items[0].price").value(100));
        entityManager.flush();
        String key = UUID.randomUUID().toString();
        String request = mapper.writeValueAsString(Map.of("deliveryAddress", "ТЕСТ, Алматы, тестовый адрес",
                "comment", "Изолированный тест на копии БД", "idempotencyKey", key));
        http.perform(post("/api/orders/create").contentType("application/json").content(request)).andExpect(status().isOk());
        entityManager.flush();
        Long orderId = jdbc.queryForObject("select id from orders where idempotency_key=?", Long.class, key);
        assertEquals(0, jdbc.queryForObject("select balance from client_balances where client_id=?", java.math.BigDecimal.class, userId).compareTo(new java.math.BigDecimal("800")));
        assertEquals(warehouseRef, jdbc.queryForObject("select warehouse_ref_key from order_items where order_id=?", String.class, orderId));
        assertEquals(2, jdbc.queryForObject("select quantity from order_items where order_id=?", Integer.class, orderId));
        assertEquals(0, jdbc.queryForObject("select count(*) from cart_item i join cart c on c.id=i.cart_id where c.user_id=?", Integer.class, userId));
        assertTrue(jdbc.queryForObject("select count(*) from order_outbox where aggregate_id=?", Integer.class, orderId) > 0);
        http.perform(post("/api/orders/create").contentType("application/json").content(request)).andExpect(status().isConflict());
        assertEquals(1, jdbc.queryForObject("select count(*) from orders where idempotency_key=?", Integer.class, key));
    }
    @Test void realMissingPriceIsRejectedClearly() throws Exception {
        assertNull(jdbc.queryForObject("select price from products where id=?", Integer.class, productId));
        http.perform(post("/api/cart/offers").contentType("application/json").content(offer(1)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Цена пока не подтверждена. Уточните её у менеджера."));
    }
    @Test void warehouseStockLimitIsCheckedOnRealData() throws Exception {
        testPriceAndBalance();
        int quantity = jdbc.queryForObject("select quantity::integer from onec_stocks where product_ref_key=? and warehouse_ref_key=?", Integer.class, productRef, warehouseRef);
        assertThrows(IllegalArgumentException.class, () -> carts.addOffer(userId, productId, warehouseRef, quantity + 1));
    }
    @Test void realLegacyProductStillEnrichesSelectedCatalogPart() {
        var umapi = org.mockito.Mockito.mock(autoparts.kz.integration.umapi.service.UmapiIntegrationService.class);
        var candidate = new autoparts.kz.integration.umapi.dto.BrandRefinementDto();
        candidate.setArticle("4410329212"); candidate.setBrand("WABCO");
        org.mockito.Mockito.when(umapi.searchByArticle("4410329212")).thenReturn(List.of(candidate));
        var search = new autoparts.kz.modules.mainSearch.service.MainSearchService(
                org.mockito.Mockito.mock(autoparts.kz.modules.vinLaximo.service.CatService.class),
                org.mockito.Mockito.mock(autoparts.kz.modules.stockOneC.client.OneCClient.class), umapi, enrichment, products, jdbc,
                org.mockito.Mockito.mock(autoparts.kz.integration.umapi.service.AutomaticAnalogService.class));
        var result = search.search("4410329212", null, "WABCO");
        assertEquals(productId, result.getResults().get(0).getProductId());
        assertEquals(1000, result.getResults().get(0).getQuantity());
        assertEquals(warehouseRef, result.getResults().get(0).getWarehouses().get(0).getRefKey());
    }
}
