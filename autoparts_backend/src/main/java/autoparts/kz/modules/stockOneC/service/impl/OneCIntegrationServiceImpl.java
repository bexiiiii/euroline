package autoparts.kz.modules.stockOneC.service.impl;

import autoparts.kz.modules.order.entity.Order;
import autoparts.kz.modules.order.orderStatus.OrderStatus;
import autoparts.kz.modules.order.repository.OrderRepository;
import autoparts.kz.modules.stockOneC.service.InventoryOnDemandRefresher;
import autoparts.kz.modules.stockOneC.service.OneCIntegrationService;
import autoparts.kz.modules.stockOneC.service.OneCIntegrationService.SyncStatus;
import autoparts.kz.modules.cml.domain.dto.OneCOrderMessage;
import autoparts.kz.modules.cml.domain.dto.OneCReturnMessage;
import autoparts.kz.modules.cml.domain.dto.OneCIntegrationContract;
import autoparts.kz.modules.cml.domain.mapper.OneCContractMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.EnumSet;
import java.util.List;

/**
 * Реализация сервиса интеграции с 1С
 */
@Service
public class OneCIntegrationServiceImpl implements OneCIntegrationService {
    
    private static final Logger logger = LoggerFactory.getLogger(OneCIntegrationServiceImpl.class);
    
    @Value("${oneC.api.url:http://localhost:8081/api/1c}")
    private String oneCApiUrl;
    
    @Value("${oneC.api.username:admin}")
    private String oneCUsername;
    
    @Value("${oneC.api.password:password}")
    private String oneCPassword;
    
    @Value("${oneC.connection.timeout:10000}")
    private int connectionTimeout;
    
    @Autowired
    @Qualifier("oneCRestTemplate")
    private RestTemplate restTemplate;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private InventoryOnDemandRefresher inventoryRefresher;
    
    @Autowired
    private OneCContractMapper contractMapper;
    
    private String lastSyncMessage = "Не синхронизировалось";
    private String lastSyncTime = "Никогда";
    
    @Override
    public boolean testConnection() {
        try {
            HttpHeaders headers = createHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                oneCApiUrl + "/ping",
                HttpMethod.GET,
                entity,
                String.class
            );
            
            boolean isConnected = response.getStatusCode() == HttpStatus.OK;
            logger.info("1C connection test result: {}", isConnected);
            return isConnected;
            
        } catch (Exception e) {
            logger.error("Failed to connect to 1C: {}", e.getMessage());
            return false;
        }
    }
    
    @Override
    public void syncCatalog() {
        try {
            logger.info("Starting catalog sync from 1C");
            updateSyncStatus("CATALOG", "IN_PROGRESS", "Синхронизация каталога...");
            
            HttpHeaders headers = createHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                oneCApiUrl + "/catalog/sync",
                HttpMethod.POST,
                entity,
                String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                // Запускаем обновление inventory через Kafka
                try {
                    inventoryRefresher.refreshSkus(List.of()); // Пустой список означает обновить все SKU
                } catch (Exception e) {
                    logger.warn("Failed to trigger inventory refresh: {}", e.getMessage());
                }
                updateSyncStatus("CATALOG", "SUCCESS", "Каталог успешно синхронизирован");
                logger.info("Catalog sync completed successfully");
            } else {
                updateSyncStatus("CATALOG", "ERROR", "Ошибка синхронизации каталога");
                logger.error("Catalog sync failed with status: {}", response.getStatusCode());
            }
            
        } catch (Exception e) {
            updateSyncStatus("CATALOG", "ERROR", "Ошибка: " + e.getMessage());
            logger.error("Error during catalog sync: {}", e.getMessage(), e);
            throw new RuntimeException("Ошибка синхронизации каталога: " + e.getMessage());
        }
    }
    
    @Override
    public void sendOrderToOneC(Long orderId) {
        try {
            logger.info("Sending order {} to 1C", orderId);
            updateSyncStatus("ORDER", "IN_PROGRESS", "Отправка заказа #" + orderId);
            
            Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Заказ не найден: " + orderId));
            
            HttpHeaders headers = createHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Order> entity = new HttpEntity<>(order, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                oneCApiUrl + "/orders",
                HttpMethod.POST,
                entity,
                String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                updateSyncStatus("ORDER", "SUCCESS", "Заказ #" + orderId + " успешно отправлен");
                logger.info("Order {} sent to 1C successfully", orderId);
            } else {
                updateSyncStatus("ORDER", "ERROR", "Ошибка отправки заказа #" + orderId);
                logger.error("Failed to send order {} to 1C, status: {}", orderId, response.getStatusCode());
            }
            
        } catch (Exception e) {
            updateSyncStatus("ORDER", "ERROR", "Ошибка отправки заказа: " + e.getMessage());
            logger.error("Error sending order {} to 1C: {}", orderId, e.getMessage(), e);
            throw new RuntimeException("Ошибка отправки заказа в 1С: " + e.getMessage());
        }
    }

    @Override
    public void sendOrderMessageToOneC(OneCOrderMessage message) {
        try {
            // Преобразуем сообщение в стандартизированный контракт
            OneCIntegrationContract.OrderMessage contractMessage = contractMapper.toOrderMessage(message);
            
            HttpHeaders headers = createHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<OneCIntegrationContract.OrderMessage> entity = new HttpEntity<>(contractMessage, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    oneCApiUrl + "/orders",
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("Order {} delivered to 1C via Rabbit bridge using contract v{}", 
                    message.getOrderId(), contractMessage.getContractVersion());
            } else {
                logger.error("Failed to deliver order {} to 1C, status {}", message.getOrderId(), response.getStatusCode());
                throw new IllegalStateException("1C responded with status " + response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("Error sending order {} message to 1C: {}", message.getOrderId(), e.getMessage(), e);
            throw new RuntimeException("Ошибка отправки заказа в 1С: " + e.getMessage(), e);
        }
    }
    
    @Override
    public void sendPendingOrdersToOneC() {
        final int batchSize = 100;
        final List<OrderStatus> statuses = List.copyOf(EnumSet.of(OrderStatus.PENDING, OrderStatus.CONFIRMED));

        try {
            logger.info("Sending pending orders to 1C");
            updateSyncStatus("BATCH_ORDER", "IN_PROGRESS", "Отправка ожидающих заказов");

            int page = 0;
            int successCount = 0;
            int errorCount = 0;
            int totalProcessed = 0;

            Page<Long> batch;
            do {
                batch = orderRepository.findIdsByStatusIn(statuses, PageRequest.of(page, batchSize));
                if (batch.isEmpty()) {
                    break;
                }
                for (Long orderId : batch) {
                    try {
                        sendOrderToOneC(orderId);
                        successCount++;
                    } catch (Exception e) {
                        errorCount++;
                        logger.error("Failed to send order {} to 1C: {}", orderId, e.getMessage());
                    }
                }
                totalProcessed += batch.getNumberOfElements();
                page++;
            } while (batch.hasNext());

            if (totalProcessed == 0) {
                updateSyncStatus("BATCH_ORDER", "SUCCESS", "Нет ожидающих заказов для отправки");
                return;
            }

            String message = String.format("Отправлено: %d, Ошибок: %d из %d заказов",
                    successCount, errorCount, totalProcessed);
            updateSyncStatus("BATCH_ORDER", errorCount == 0 ? "SUCCESS" : "PARTIAL", message);
            logger.info("Pending orders sync completed. Success: {}, Errors: {}", successCount, errorCount);

        } catch (Exception e) {
            updateSyncStatus("BATCH_ORDER", "ERROR", "Ошибка массовой отправки: " + e.getMessage());
            logger.error("Error sending pending orders to 1C: {}", e.getMessage(), e);
            throw new RuntimeException("Ошибка отправки ожидающих заказов в 1С: " + e.getMessage());
        }
    }
    
    @Override
    public SyncStatus getLastSyncStatus() {
        return new SyncStatus("GENERAL", "SUCCESS", lastSyncTime, lastSyncMessage);
    }

    @Override
    public void sendReturnMessageToOneC(OneCReturnMessage message) {
        try {
            // Преобразуем сообщение в стандартизированный контракт
            OneCIntegrationContract.ReturnMessage contractMessage = contractMapper.toReturnMessage(message);
            
            HttpHeaders headers = createHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<OneCIntegrationContract.ReturnMessage> entity = new HttpEntity<>(contractMessage, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    oneCApiUrl + "/returns",
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("Return {} delivered to 1C via Rabbit bridge using contract v{}", 
                    message.getReturnId(), contractMessage.getContractVersion());
            } else {
                logger.error("Failed to deliver return {} to 1C, status {}", message.getReturnId(), response.getStatusCode());
                throw new IllegalStateException("1C responded with status " + response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("Error sending return {} message to 1C: {}", message.getReturnId(), e.getMessage(), e);
            throw new RuntimeException("Ошибка отправки возврата в 1С: " + e.getMessage(), e);
        }
    }
    
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        String auth = oneCUsername + ":" + oneCPassword;
        String encodedAuth = java.util.Base64.getEncoder().encodeToString(auth.getBytes());
        headers.set("Authorization", "Basic " + encodedAuth);
        headers.set("Accept", "application/json");
        return headers;
    }
    
    private void updateSyncStatus(String type, String status, String message) {
        this.lastSyncMessage = message;
        this.lastSyncTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        logger.debug("Sync status updated: type={}, status={}, message={}", type, status, message);
    }
}
