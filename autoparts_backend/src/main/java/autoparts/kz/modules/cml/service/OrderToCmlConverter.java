package autoparts.kz.modules.cml.service;

import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.cml.domain.entity.CmlOrder;
import autoparts.kz.modules.cml.domain.entity.CmlOrderItem;
import autoparts.kz.modules.cml.domain.entity.CmlOrderStatus;
import autoparts.kz.modules.cml.repo.CmlProductRepository;
import autoparts.kz.modules.order.entity.Order;
import autoparts.kz.modules.order.entity.OrderItem;
import autoparts.kz.modules.order.orderStatus.OrderStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Профессиональный конвертер заказов в формат CommerceML для интеграции с 1С.
 * 
 * Преобразует заказы из внутренней таблицы orders в формат cml_orders для экспорта в 1С.
 * Автоматически обогащает данные информацией о клиенте и связывает товары с номенклатурой 1С.
 */
@Service
public class OrderToCmlConverter {

    private static final Logger log = LoggerFactory.getLogger(OrderToCmlConverter.class);

    private final CmlProductRepository cmlProductRepository;

    public OrderToCmlConverter(CmlProductRepository cmlProductRepository) {
        this.cmlProductRepository = cmlProductRepository;
    }

    /**
     * Конвертирует заказ в формат CommerceML.
     * 
     * @param order исходный заказ из таблицы orders
     * @return CmlOrder готовый к экспорту в 1С
     */
    public CmlOrder convert(Order order) {
        log.debug("Converting order {} to CmlOrder format", order.getId());

        CmlOrder cmlOrder = new CmlOrder();
        
        // Уникальный GUID для заказа (стандарт CommerceML)
        String orderGuid = order.getExternalId() != null 
            ? order.getExternalId() 
            : UUID.randomUUID().toString();
        cmlOrder.setGuid(orderGuid);
        
        // Номер заказа (публичный код для клиента)
        cmlOrder.setNumber(order.getPublicCode() != null 
            ? order.getPublicCode() 
            : String.valueOf(order.getId()));
        
        // Дата создания
        cmlOrder.setCreatedAt(order.getCreatedAt() != null 
            ? order.getCreatedAt() 
            : LocalDateTime.now());
        
        // Статус заказа
        cmlOrder.setStatus(mapOrderStatus(order.getStatus()));
        
        // Сумма заказа (используем поле total в CmlOrder)
        cmlOrder.setTotal(order.getTotalAmount());
        
        // Информация о клиенте
        User user = order.getUser();
        if (user != null) {
            enrichCustomerData(cmlOrder, user, order);
        } else {
            log.warn("Order {} has no user information", order.getId());
        }
        
        // Позиции заказа
        List<CmlOrderItem> cmlItems = convertOrderItems(order, cmlOrder);
        cmlOrder.setItems(cmlItems);
        
        log.info("Successfully converted order {} to CmlOrder with {} items", 
            order.getId(), cmlItems.size());
        
        return cmlOrder;
    }

    /**
     * Обогащает CmlOrder данными о клиенте согласно стандарту CommerceML.
     */
    private void enrichCustomerData(CmlOrder cmlOrder, User user, Order order) {
        // GUID клиента (генерируем новый, так как в User нет externalId)
        cmlOrder.setCustomerGuid(UUID.randomUUID().toString());
        
        // ФИО клиента
        String fullName = buildFullName(user);
        cmlOrder.setCustomerName(fullName);
        
        // Название компании (для юр. лиц)
        cmlOrder.setCustomerClientName(user.getClientName());
        
        // Контактная информация
        cmlOrder.setCustomerEmail(user.getEmail());
        cmlOrder.setCustomerPhone(user.getPhone());
        
        // Адрес клиента
        cmlOrder.setCustomerCountry(user.getCountry());
        cmlOrder.setCustomerCity(user.getCity());
        
        // Полный адрес доставки (комбинированный)
        String deliveryAddress = buildDeliveryAddress(order, user);
        cmlOrder.setCustomerAddress(deliveryAddress);
        
        log.debug("Enriched customer data for order: customer={}, email={}", 
            fullName, user.getEmail());
    }

    /**
     * Формирует полное имя клиента.
     */
    private String buildFullName(User user) {
        StringBuilder name = new StringBuilder();
        
        if (user.getSurname() != null && !user.getSurname().isEmpty()) {
            name.append(user.getSurname());
        }
        if (user.getName() != null && !user.getName().isEmpty()) {
            if (name.length() > 0) name.append(" ");
            name.append(user.getName());
        }
        if (user.getFathername() != null && !user.getFathername().isEmpty()) {
            if (name.length() > 0) name.append(" ");
            name.append(user.getFathername());
        }
        
        return name.length() > 0 ? name.toString() : user.getEmail();
    }

    /**
     * Формирует полный адрес доставки.
     */
    private String buildDeliveryAddress(Order order, User user) {
        // Приоритет: адрес из заказа > адрес офиса > адрес из профиля
        if (order.getDeliveryAddress() != null && !order.getDeliveryAddress().isEmpty()) {
            return order.getDeliveryAddress();
        }
        
        if (user.getOfficeAddress() != null && !user.getOfficeAddress().isEmpty()) {
            return user.getOfficeAddress();
        }
        
        // Формируем адрес из компонентов
        StringBuilder address = new StringBuilder();
        if (user.getCountry() != null) {
            address.append(user.getCountry());
        }
        if (user.getCity() != null) {
            if (address.length() > 0) address.append(", ");
            address.append(user.getCity());
        }
        if (user.getState() != null) {
            if (address.length() > 0) address.append(", ");
            address.append(user.getState());
        }
        
        return address.length() > 0 ? address.toString() : null;
    }

    /**
     * Конвертирует позиции заказа в формат CommerceML.
     */
    private List<CmlOrderItem> convertOrderItems(Order order, CmlOrder cmlOrder) {
        List<CmlOrderItem> cmlItems = new ArrayList<>();
        
        if (order.getItems() == null || order.getItems().isEmpty()) {
            log.warn("Order {} has no items", order.getId());
            return cmlItems;
        }
        
        for (OrderItem item : order.getItems()) {
            try {
                CmlOrderItem cmlItem = convertOrderItem(item, cmlOrder);
                cmlItems.add(cmlItem);
            } catch (Exception e) {
                log.error("Failed to convert order item {}: {}", item.getId(), e.getMessage(), e);
                // Продолжаем конвертацию остальных позиций
            }
        }
        
        return cmlItems;
    }

    /**
     * Конвертирует одну позицию заказа.
     */
    private CmlOrderItem convertOrderItem(OrderItem item, CmlOrder cmlOrder) {
        CmlOrderItem cmlItem = new CmlOrderItem();
        cmlItem.setOrder(cmlOrder);
        
        // GUID товара из номенклатуры 1С
        String productGuid = null;
        if (item.getProduct() != null && item.getProduct().getExternalCode() != null) {
            productGuid = item.getProduct().getExternalCode();
            log.debug("Found 1C GUID for product {}: {}", item.getProduct().getId(), productGuid);
        } else {
            // Пытаемся найти в cml_products по SKU
            productGuid = findProductGuidBySku(item.getSku());
        }
        
        if (productGuid == null) {
            log.warn("No 1C GUID found for product SKU: {}. Using fallback GUID.", item.getSku());
            productGuid = UUID.randomUUID().toString(); // Fallback
        }
        
        cmlItem.setProductGuid(productGuid);
        
        // Артикул товара
        cmlItem.setArticle(item.getSku());
        
        // Название товара (используем поле productName)
        String productName = item.getProduct() != null 
            ? item.getProduct().getName() 
            : item.getSku();
        cmlItem.setProductName(productName);
        
        // Цена и количество
        cmlItem.setPrice(item.getPrice());
        cmlItem.setQty(BigDecimal.valueOf(item.getQuantity()));
        
        // Сумма позиции
        if (item.getPrice() != null) {
            cmlItem.setSum(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        
        return cmlItem;
    }

    /**
     * Ищет GUID товара в номенклатуре 1С по артикулу.
     */
    private String findProductGuidBySku(String sku) {
        if (sku == null || sku.isEmpty()) {
            return null;
        }
        
        try {
            return cmlProductRepository.findBySku(sku)
                .map(p -> p.getGuid())
                .orElse(null);
        } catch (Exception e) {
            log.error("Error searching for product GUID by SKU {}: {}", sku, e.getMessage());
            return null;
        }
    }

    /**
     * Маппинг статусов заказа.
     */
    private CmlOrderStatus mapOrderStatus(OrderStatus status) {
        if (status == null) {
            return CmlOrderStatus.NEW;
        }
        
        return switch (status) {
            case PENDING -> CmlOrderStatus.NEW;
            case CONFIRMED -> CmlOrderStatus.CONFIRMED;
            case CANCELLED -> CmlOrderStatus.CANCELLED;
        };
    }
}
