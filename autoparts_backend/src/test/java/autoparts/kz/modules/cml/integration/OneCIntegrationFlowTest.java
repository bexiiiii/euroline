package autoparts.kz.modules.cml.integration;

import autoparts.kz.modules.cml.domain.entity.CmlOrder;
import autoparts.kz.modules.cml.domain.entity.CmlOrderItem;
import org.springframework.test.context.ActiveProfiles;
import autoparts.kz.modules.cml.domain.entity.CmlOrderStatus;
import autoparts.kz.modules.cml.repo.CmlOrderRepository;
import autoparts.kz.modules.cml.repo.CmlPriceRepository;
import autoparts.kz.modules.cml.repo.CmlProductRepository;
import autoparts.kz.modules.cml.repo.CmlStockRepository;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.MinIOContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(
        locations = "classpath:application-cml-test.yml",
        properties = "spring.main.allow-bean-definition-overriding=true"
)
@ActiveProfiles("test")
class OneCIntegrationFlowTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:15-alpine");

    @Container
    static final RabbitMQContainer RABBIT = new RabbitMQContainer("rabbitmq:3.13-management");

    @Container
    static final MinIOContainer MINIO = new MinIOContainer("minio/minio:RELEASE.2024-04-18T19-09-19Z");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create");

        registry.add("spring.rabbitmq.host", RABBIT::getHost);
        registry.add("spring.rabbitmq.port", () -> RABBIT.getAmqpPort());
        registry.add("spring.rabbitmq.username", RABBIT::getAdminUsername);
        registry.add("spring.rabbitmq.password", RABBIT::getAdminPassword);

        registry.add("aws.s3.endpoint", () -> MINIO.getS3URL());
        registry.add("aws.s3.access-key", MINIO::getUserName);
        registry.add("aws.s3.secret-key", MINIO::getPassword);
        registry.add("aws.s3.region", () -> "us-east-1");
        registry.add("aws.s3.bucket", () -> "cml-test-" + UUID.randomUUID());
        registry.add("logging.level.autoparts.kz.modules.cml", () -> "INFO");
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private CmlProductRepository productRepository;

    @Autowired
    private CmlPriceRepository priceRepository;

    @Autowired
    private CmlStockRepository stockRepository;

    @Autowired
    private CmlOrderRepository orderRepository;

    @BeforeEach
    void setUpTemplate() {
        restTemplate = restTemplate.withBasicAuth("test_1c", "testpass");
    }

    @Test
    void fullCatalogAndSaleExchangeFlow() {
        // checkauth
        ResponseEntity<String> checkauth = restTemplate.getForEntity(url("type=catalog&mode=checkauth"), String.class);
        assertThat(checkauth.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(checkauth.getBody()).startsWith("success");

        // init
        ResponseEntity<String> init = restTemplate.getForEntity(url("type=catalog&mode=init"), String.class);
        assertThat(init.getBody()).contains("zip=yes");

        // upload import.xml
        String importXml = """
                <КоммерческаяИнформация>
                  <Каталог>
                    <Товары>
                      <Товар>
                        <Ид>prod-1</Ид>
                        <Артикул>SKU001</Артикул>
                        <Наименование>Test product</Наименование>
                        <Описание>Sample description</Описание>
                        <Группы><Ид>101</Ид></Группы>
                      </Товар>
                    </Товары>
                  </Каталог>
                </КоммерческаяИнформация>
                """;
        postFile("catalog", "import.xml", importXml.getBytes());

        // trigger import
        ResponseEntity<String> importResponse = restTemplate.getForEntity(url("type=catalog&mode=import&filename=import.xml"), String.class);
        assertThat(importResponse.getBody()).contains("progress");

        Awaitility.await().atMost(Duration.ofSeconds(30))
                .untilAsserted(() -> assertThat(productRepository.count()).isGreaterThan(0));

        // upload offers.xml
        String offersXml = """
                <КоммерческаяИнформация>
                  <ПакетПредложений>
                    <Предложения>
                      <Предложение>
                        <Ид>prod-1</Ид>
                        <Количество>5</Количество>
                        <Склад><Ид>main</Ид></Склад>
                        <Цены>
                          <Цена>
                            <ИдТипаЦены>retail</ИдТипаЦены>
                            <ЦенаЗаЕдиницу>1990.00</ЦенаЗаЕдиницу>
                            <Валюта>KZT</Валюта>
                          </Цена>
                        </Цены>
                      </Предложение>
                    </Предложения>
                  </ПакетПредложений>
                </КоммерческаяИнформация>
                """;

        postFile("catalog", "offers.xml", offersXml.getBytes());
        restTemplate.getForEntity(url("type=catalog&mode=import&filename=offers.xml"), String.class);

        Awaitility.await().atMost(Duration.ofSeconds(30))
                .untilAsserted(() -> {
                    assertThat(priceRepository.count()).isGreaterThan(0);
                    assertThat(stockRepository.count()).isGreaterThan(0);
                });

        // prepare order
        CmlOrder order = new CmlOrder();
        order.setGuid("order-guid-1");
        order.setNumber("1001");
        order.setCreatedAt(LocalDateTime.now());
        order.setStatus(CmlOrderStatus.NEW);
        order.setTotal(BigDecimal.valueOf(1990));
        order.setCustomerGuid("customer-1");

        CmlOrderItem item = new CmlOrderItem();
        item.setProductGuid("prod-1");
        item.setPrice(BigDecimal.valueOf(1990));
        item.setQty(BigDecimal.ONE);
        item.setSum(BigDecimal.valueOf(1990));
        order.addItem(item);

        orderRepository.save(order);

        // sale query initial (schedules export)
        ResponseEntity<byte[]> saleProgress = restTemplate.getForEntity(url("type=sale&mode=query"), byte[].class);
        assertThat(saleProgress.getHeaders().getContentType()).isEqualTo(MediaType.TEXT_PLAIN);

        Awaitility.await().atMost(Duration.ofSeconds(30))
                .untilAsserted(() -> {
                    ResponseEntity<byte[]> saleXml = restTemplate.getForEntity(url("type=sale&mode=query"), byte[].class);
                    assertThat(saleXml.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_XML);
                    assertThat(new String(saleXml.getBody())).contains("КоммерческаяИнформация");
                });

        // sale import changes
        String ordersChanges = """
                <КоммерческаяИнформация>
                  <Документ>
                    <Ид>order-guid-1</Ид>
                    <Номер>1001</Номер>
                    <Статус>Отгружен</Статус>
                    <Оплачен>true</Оплачен>
                  </Документ>
                </КоммерческаяИнформация>
                """;
        postFile("sale", "orders_changes.xml", ordersChanges.getBytes());
        restTemplate.getForEntity(url("type=sale&mode=import&filename=orders_changes.xml"), String.class);

        Awaitility.await().atMost(Duration.ofSeconds(30))
                .untilAsserted(() -> {
                    CmlOrder updated = orderRepository.findByGuid("order-guid-1").orElseThrow();
                    assertThat(updated.getStatus()).isEqualTo(CmlOrderStatus.PAID);
                });

        // sale success acknowledgement
        ResponseEntity<String> successResponse = restTemplate.getForEntity(url("type=sale&mode=success"), String.class);
        assertThat(successResponse.getBody()).isEqualTo("success");
    }

    private void postFile(String type, String filename, byte[] body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        HttpEntity<byte[]> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.exchange(
                url("type=%s&mode=file&filename=%s".formatted(type, filename)),
                HttpMethod.POST,
                entity,
                String.class);
        assertThat(response.getBody()).isEqualTo("success");
    }

    private String url(String query) {
        return "http://localhost:%d/api/1c-exchange?%s".formatted(port, query);
    }
}
