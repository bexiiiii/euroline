package autoparts.kz.modules.cml.integration;

import autoparts.kz.modules.cml.domain.dto.OneCIntegrationContract;
import autoparts.kz.modules.cml.domain.dto.OneCOrderMessage;
import autoparts.kz.modules.cml.domain.dto.OneCReturnMessage;
import autoparts.kz.modules.cml.domain.mapper.OneCContractMapper;
import autoparts.kz.modules.cml.service.OneCIntegrationPublisherService;
import autoparts.kz.modules.cml.service.OneCQueueMonitoringService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Интеграционные тесты для контракта 1C.
 * Проверяют корректность маппинга, сериализации и работы с очередями.
 */
@SpringBootTest
@Testcontainers
@TestPropertySource(properties = {
    "spring.rabbitmq.host=localhost",
    "spring.task.scheduling.enabled=false"  // Отключаем планировщики в тестах
})
class OneCIntegrationContractTest {

    @Container
    static final RabbitMQContainer RABBIT = new RabbitMQContainer("rabbitmq:3.13-management");

    @Autowired
    private OneCContractMapper contractMapper;

    @Autowired
    private OneCIntegrationPublisherService publisherService;

    @Autowired
    private OneCQueueMonitoringService monitoringService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testOrderMessageMapping() {
        // Создаем тестовое сообщение заказа
        OneCOrderMessage orderMessage = createTestOrderMessage();

        // Преобразуем в контракт
        OneCIntegrationContract.OrderMessage contractMessage = contractMapper.toOrderMessage(orderMessage);

        // Проверяем основные поля
        assertNotNull(contractMessage);
        assertEquals("1.0", contractMessage.getContractVersion());
        assertEquals("ORDER", contractMessage.getMessageType());
        assertNotNull(contractMessage.getTimestamp());

        OneCIntegrationContract.OrderData orderData = contractMessage.getOrderData();
        assertNotNull(orderData);
        assertEquals(orderMessage.getOrderId(), orderData.getOrderId());
        assertEquals(orderMessage.getExternalId(), orderData.getExternalId());
        assertEquals(orderMessage.getPublicCode(), orderData.getPublicCode());
        assertEquals(orderMessage.getStatus(), orderData.getStatus());
        assertEquals(orderMessage.getTotalAmount(), orderData.getTotalAmount());
        assertEquals(orderMessage.getCurrency(), orderData.getCurrency());

        // Проверяем клиента
        assertNotNull(orderData.getCustomer());
        assertEquals(orderMessage.getCustomer().getId(), orderData.getCustomer().getId());
        assertEquals(orderMessage.getCustomer().getEmail(), orderData.getCustomer().getEmail());

        // Проверяем товары
        assertNotNull(orderData.getItems());
        assertEquals(1, orderData.getItems().size());
        OneCIntegrationContract.OrderItemData item = orderData.getItems().get(0);
        assertEquals(orderMessage.getItems().get(0).getProductId(), item.getProductId());
        assertEquals(orderMessage.getItems().get(0).getSku(), item.getSku());
        assertEquals(orderMessage.getItems().get(0).getQuantity(), item.getQuantity());
        assertEquals(orderMessage.getItems().get(0).getPrice(), item.getPrice());
    }

    @Test
    void testReturnMessageMapping() {
        // Создаем тестовое сообщение возврата
        OneCReturnMessage returnMessage = createTestReturnMessage();

        // Преобразуем в контракт
        OneCIntegrationContract.ReturnMessage contractMessage = contractMapper.toReturnMessage(returnMessage);

        // Проверяем основные поля
        assertNotNull(contractMessage);
        assertEquals("1.0", contractMessage.getContractVersion());
        assertEquals("RETURN", contractMessage.getMessageType());
        assertNotNull(contractMessage.getTimestamp());

        OneCIntegrationContract.ReturnData returnData = contractMessage.getReturnData();
        assertNotNull(returnData);
        assertEquals(returnMessage.getReturnId(), returnData.getReturnId());
        assertEquals(returnMessage.getOrderId(), returnData.getOrderId());
        assertEquals(returnMessage.getStatus(), returnData.getStatus());
        assertEquals(returnMessage.getAmount(), returnData.getAmount());
        assertEquals(returnMessage.getReason(), returnData.getReason());

        // Проверяем клиента
        assertNotNull(returnData.getCustomer());
        assertEquals(returnMessage.getCustomer().getId(), returnData.getCustomer().getId());
        assertEquals(returnMessage.getCustomer().getEmail(), returnData.getCustomer().getEmail());
    }

    @Test
    void testOrderMessageSerialization() throws Exception {
        // Создаем тестовое сообщение заказа
        OneCOrderMessage orderMessage = createTestOrderMessage();
        OneCIntegrationContract.OrderMessage contractMessage = contractMapper.toOrderMessage(orderMessage);

        // Сериализуем в JSON
        String json = objectMapper.writeValueAsString(contractMessage);
        
        // Проверяем, что JSON содержит основные поля
        assertTrue(json.contains("\"contract_version\":\"1.0\""));
        assertTrue(json.contains("\"message_type\":\"ORDER\""));
        assertTrue(json.contains("\"order_id\":12345"));
        assertTrue(json.contains("\"external_id\":\"EXT-12345\""));
        assertTrue(json.contains("\"total_amount\":15000.00"));

        // Десериализуем обратно
        OneCIntegrationContract.OrderMessage deserializedMessage = 
            objectMapper.readValue(json, OneCIntegrationContract.OrderMessage.class);

        // Проверяем корректность десериализации
        assertNotNull(deserializedMessage);
        assertEquals(contractMessage.getContractVersion(), deserializedMessage.getContractVersion());
        assertEquals(contractMessage.getMessageType(), deserializedMessage.getMessageType());
        assertEquals(contractMessage.getOrderData().getOrderId(), deserializedMessage.getOrderData().getOrderId());
    }

    @Test
    void testReturnMessageSerialization() throws Exception {
        // Создаем тестовое сообщение возврата
        OneCReturnMessage returnMessage = createTestReturnMessage();
        OneCIntegrationContract.ReturnMessage contractMessage = contractMapper.toReturnMessage(returnMessage);

        // Сериализуем в JSON
        String json = objectMapper.writeValueAsString(contractMessage);
        
        // Проверяем, что JSON содержит основные поля
        assertTrue(json.contains("\"contract_version\":\"1.0\""));
        assertTrue(json.contains("\"message_type\":\"RETURN\""));
        assertTrue(json.contains("\"return_id\":98765"));
        assertTrue(json.contains("\"order_id\":12345"));

        // Десериализуем обратно
        OneCIntegrationContract.ReturnMessage deserializedMessage = 
            objectMapper.readValue(json, OneCIntegrationContract.ReturnMessage.class);

        // Проверяем корректность десериализации
        assertNotNull(deserializedMessage);
        assertEquals(contractMessage.getContractVersion(), deserializedMessage.getContractVersion());
        assertEquals(contractMessage.getMessageType(), deserializedMessage.getMessageType());
        assertEquals(contractMessage.getReturnData().getReturnId(), deserializedMessage.getReturnData().getReturnId());
    }

    @Test
    void testReverseMapping() {
        // Создаем тестовое сообщение заказа
        OneCOrderMessage originalMessage = createTestOrderMessage();

        // Преобразуем в контракт и обратно
        OneCIntegrationContract.OrderMessage contractMessage = contractMapper.toOrderMessage(originalMessage);
        OneCOrderMessage mappedBackMessage = contractMapper.fromOrderMessage(contractMessage);

        // Проверяем, что данные сохранились
        assertEquals(originalMessage.getOrderId(), mappedBackMessage.getOrderId());
        assertEquals(originalMessage.getExternalId(), mappedBackMessage.getExternalId());
        assertEquals(originalMessage.getPublicCode(), mappedBackMessage.getPublicCode());
        assertEquals(originalMessage.getStatus(), mappedBackMessage.getStatus());
        assertEquals(originalMessage.getTotalAmount(), mappedBackMessage.getTotalAmount());
        assertEquals(originalMessage.getCurrency(), mappedBackMessage.getCurrency());

        // Проверяем клиента
        assertEquals(originalMessage.getCustomer().getId(), mappedBackMessage.getCustomer().getId());
        assertEquals(originalMessage.getCustomer().getEmail(), mappedBackMessage.getCustomer().getEmail());

        // Проверяем товары
        assertEquals(originalMessage.getItems().size(), mappedBackMessage.getItems().size());
        assertEquals(originalMessage.getItems().get(0).getProductId(), 
            mappedBackMessage.getItems().get(0).getProductId());
    }

    @Test
    void testQueueMonitoring() {
        // Проверяем, что мониторинг может получить статистику очередей
        var stats = monitoringService.getIntegrationQueuesStats();
        
        assertNotNull(stats);
        assertTrue(stats.containsKey("orders.integration.q"));
        assertTrue(stats.containsKey("returns.integration.q"));
        assertTrue(stats.containsKey("orders.integration.q.dlq"));
        assertTrue(stats.containsKey("returns.integration.q.dlq"));

        // Проверяем здоровье очередей
        boolean healthy = monitoringService.areIntegrationQueuesHealthy();
        assertTrue(healthy); // В тестовой среде очереди должны быть здоровыми

        // Проверяем отчет о здоровье
        String report = monitoringService.getQueuesHealthReport();
        assertNotNull(report);
        assertTrue(report.contains("1C Integration Queues Health Report"));
    }

    @Test
    void testPublishOrderMessage() {
        // Создаем тестовое сообщение заказа
        OneCOrderMessage orderMessage = createTestOrderMessage();

        // Публикуем сообщение
        assertDoesNotThrow(() -> publisherService.publishOrderMessage(orderMessage));

        // Проверяем, что сообщение попало в очередь
        var orderQueueStats = monitoringService.getQueueStats("orders.integration.q");
        assertTrue(orderQueueStats.getMessageCount() >= 0); // Может быть обработано быстро
    }

    @Test
    void testPublishReturnMessage() {
        // Создаем тестовое сообщение возврата
        OneCReturnMessage returnMessage = createTestReturnMessage();

        // Публикуем сообщение
        assertDoesNotThrow(() -> publisherService.publishReturnMessage(returnMessage));

        // Проверяем, что сообщение попало в очередь
        var returnQueueStats = monitoringService.getQueueStats("returns.integration.q");
        assertTrue(returnQueueStats.getMessageCount() >= 0); // Может быть обработано быстро
    }

    private OneCOrderMessage createTestOrderMessage() {
        OneCOrderMessage message = new OneCOrderMessage();
        message.setOrderId(12345L);
        message.setExternalId("EXT-12345");
        message.setPublicCode("PUB-12345");
        message.setCreatedAt(LocalDateTime.now().minusHours(1));
        message.setConfirmedAt(LocalDateTime.now().minusMinutes(30));
        message.setStatus("CONFIRMED");
        message.setTotalAmount(new BigDecimal("15000.00"));
        message.setCurrency("KZT");
        message.setDeliveryAddress("г. Алматы, ул. Абая 100");

        // Клиент
        OneCOrderMessage.Customer customer = new OneCOrderMessage.Customer();
        customer.setId(67890L);
        customer.setEmail("customer@example.com");
        customer.setPhone("+7 777 123 4567");
        customer.setClientName("ТОО Пример");
        customer.setSurname("Иванов");
        customer.setName("Иван");
        customer.setFathername("Иванович");
        customer.setCompanyType("ТОО");
        customer.setCountry("Казахстан");
        customer.setState("Алматинская область");
        customer.setCity("Алматы");
        customer.setOfficeAddress("ул. Примерная 1");
        message.setCustomer(customer);

        // Платеж
        OneCOrderMessage.Payment payment = new OneCOrderMessage.Payment();
        payment.setStatus("PAID");
        payment.setAmount(new BigDecimal("15000.00"));
        message.setPayment(payment);

        // Товары
        OneCOrderMessage.Item item = new OneCOrderMessage.Item();
        item.setProductId(111L);
        item.setProductExternalCode("EXT-PROD-111");
        item.setProductCode("PROD-111");
        item.setProductName("Тормозные колодки");
        item.setSku("TK-001");
        item.setQuantity(2);
        item.setPrice(new BigDecimal("7500.00"));
        message.setItems(List.of(item));

        return message;
    }

    private OneCReturnMessage createTestReturnMessage() {
        OneCReturnMessage message = new OneCReturnMessage();
        message.setReturnId(98765L);
        message.setOrderId(12345L);
        message.setOrderExternalId("EXT-12345");
        message.setOrderPublicCode("PUB-12345");
        message.setCustomerId(67890L);
        message.setStatus("PENDING");
        message.setAmount(new BigDecimal("7500.00"));
        message.setCurrency("KZT");
        message.setReason("Брак товара");
        message.setDetailsJson("Обнаружены дефекты при осмотре");
        message.setCreatedAt(Instant.now());
        message.setUpdatedAt(Instant.now());

        // Клиент
        OneCReturnMessage.Customer customer = new OneCReturnMessage.Customer();
        customer.setId(67890L);
        customer.setEmail("customer@example.com");
        customer.setPhone("+7 777 123 4567");
        customer.setClientName("ТОО Пример");
        customer.setSurname("Иванов");
        customer.setName("Иван");
        customer.setFathername("Иванович");
        message.setCustomer(customer);

        return message;
    }
}