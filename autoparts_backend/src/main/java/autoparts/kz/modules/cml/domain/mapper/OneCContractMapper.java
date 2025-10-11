package autoparts.kz.modules.cml.domain.mapper;

import autoparts.kz.modules.cml.domain.dto.OneCIntegrationContract;
import autoparts.kz.modules.cml.domain.dto.OneCOrderMessage;
import autoparts.kz.modules.cml.domain.dto.OneCReturnMessage;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.stream.Collectors;

/**
 * Маппер для преобразования между старыми DTO и новым контрактом интеграции с 1C.
 * Обеспечивает обратную совместимость и стабильность контракта.
 */
@Component
public class OneCContractMapper {

    /**
     * Преобразует OneCOrderMessage в стандартизированный контракт OrderMessage
     */
    public OneCIntegrationContract.OrderMessage toOrderMessage(OneCOrderMessage orderMessage) {
        OneCIntegrationContract.OrderData orderData = new OneCIntegrationContract.OrderData();
        
        // Основные данные заказа
        orderData.setOrderId(orderMessage.getOrderId());
        orderData.setExternalId(orderMessage.getExternalId());
        orderData.setPublicCode(orderMessage.getPublicCode());
        orderData.setCreatedAt(orderMessage.getCreatedAt());
        orderData.setConfirmedAt(orderMessage.getConfirmedAt());
        orderData.setStatus(orderMessage.getStatus());
        orderData.setTotalAmount(orderMessage.getTotalAmount());
        orderData.setCurrency(orderMessage.getCurrency());
        orderData.setDeliveryAddress(orderMessage.getDeliveryAddress());
        
        // Данные клиента
        if (orderMessage.getCustomer() != null) {
            OneCIntegrationContract.CustomerData customerData = new OneCIntegrationContract.CustomerData();
            OneCOrderMessage.Customer customer = orderMessage.getCustomer();
            
            customerData.setId(customer.getId());
            customerData.setEmail(customer.getEmail());
            customerData.setPhone(customer.getPhone());
            customerData.setClientName(customer.getClientName());
            customerData.setSurname(customer.getSurname());
            customerData.setName(customer.getName());
            customerData.setFathername(customer.getFathername());
            customerData.setCompanyType(customer.getCompanyType());
            customerData.setCountry(customer.getCountry());
            customerData.setState(customer.getState());
            customerData.setCity(customer.getCity());
            customerData.setOfficeAddress(customer.getOfficeAddress());
            
            orderData.setCustomer(customerData);
        }
        
        // Данные платежа
        if (orderMessage.getPayment() != null) {
            OneCIntegrationContract.PaymentData paymentData = new OneCIntegrationContract.PaymentData();
            OneCOrderMessage.Payment payment = orderMessage.getPayment();
            
            paymentData.setStatus(payment.getStatus());
            paymentData.setAmount(payment.getAmount());
            // Можно добавить метод платежа из других источников данных
            
            orderData.setPayment(paymentData);
        }
        
        // Товары заказа
        if (orderMessage.getItems() != null) {
            orderData.setItems(
                orderMessage.getItems().stream()
                    .map(this::mapOrderItem)
                    .collect(Collectors.toList())
            );
        }
        
        return new OneCIntegrationContract.OrderMessage(orderData);
    }
    
    /**
     * Преобразует OneCReturnMessage в стандартизированный контракт ReturnMessage
     */
    public OneCIntegrationContract.ReturnMessage toReturnMessage(OneCReturnMessage returnMessage) {
        OneCIntegrationContract.ReturnData returnData = new OneCIntegrationContract.ReturnData();
        
        // Основные данные возврата
        returnData.setReturnId(returnMessage.getReturnId());
        returnData.setOrderId(returnMessage.getOrderId());
        returnData.setOrderExternalId(returnMessage.getOrderExternalId());
        returnData.setOrderPublicCode(returnMessage.getOrderPublicCode());
        returnData.setCustomerId(returnMessage.getCustomerId());
        returnData.setStatus(returnMessage.getStatus());
        returnData.setAmount(returnMessage.getAmount());
        returnData.setCurrency(returnMessage.getCurrency());
        returnData.setReason(returnMessage.getReason());
        returnData.setDetails(returnMessage.getDetailsJson());
        
        // Преобразование Instant в LocalDateTime
        if (returnMessage.getCreatedAt() != null) {
            returnData.setCreatedAt(LocalDateTime.ofInstant(returnMessage.getCreatedAt(), ZoneOffset.UTC));
        }
        if (returnMessage.getUpdatedAt() != null) {
            returnData.setUpdatedAt(LocalDateTime.ofInstant(returnMessage.getUpdatedAt(), ZoneOffset.UTC));
        }
        
        // Данные клиента
        if (returnMessage.getCustomer() != null) {
            OneCIntegrationContract.CustomerData customerData = new OneCIntegrationContract.CustomerData();
            OneCReturnMessage.Customer customer = returnMessage.getCustomer();
            
            customerData.setId(customer.getId());
            customerData.setEmail(customer.getEmail());
            customerData.setPhone(customer.getPhone());
            customerData.setClientName(customer.getClientName());
            customerData.setSurname(customer.getSurname());
            customerData.setName(customer.getName());
            customerData.setFathername(customer.getFathername());
            
            returnData.setCustomer(customerData);
        }
        
        return new OneCIntegrationContract.ReturnMessage(returnData);
    }
    
    /**
     * Преобразует товар из старого DTO в новый контракт
     */
    private OneCIntegrationContract.OrderItemData mapOrderItem(OneCOrderMessage.Item item) {
        OneCIntegrationContract.OrderItemData itemData = new OneCIntegrationContract.OrderItemData();
        
        itemData.setProductId(item.getProductId());
        itemData.setProductExternalCode(item.getProductExternalCode());
        itemData.setProductCode(item.getProductCode());
        itemData.setProductName(item.getProductName());
        itemData.setSku(item.getSku());
        itemData.setQuantity(item.getQuantity());
        itemData.setPrice(item.getPrice());
        
        // Рассчитываем общую стоимость
        if (item.getPrice() != null && item.getQuantity() > 0) {
            itemData.setTotalPrice(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        
        return itemData;
    }
    
    /**
     * Преобразует контракт OrderMessage обратно в OneCOrderMessage (для обратной совместимости)
     */
    public OneCOrderMessage fromOrderMessage(OneCIntegrationContract.OrderMessage orderMessage) {
        OneCOrderMessage oneCOrderMessage = new OneCOrderMessage();
        OneCIntegrationContract.OrderData orderData = orderMessage.getOrderData();
        
        oneCOrderMessage.setOrderId(orderData.getOrderId());
        oneCOrderMessage.setExternalId(orderData.getExternalId());
        oneCOrderMessage.setPublicCode(orderData.getPublicCode());
        oneCOrderMessage.setCreatedAt(orderData.getCreatedAt());
        oneCOrderMessage.setConfirmedAt(orderData.getConfirmedAt());
        oneCOrderMessage.setStatus(orderData.getStatus());
        oneCOrderMessage.setTotalAmount(orderData.getTotalAmount());
        oneCOrderMessage.setCurrency(orderData.getCurrency());
        oneCOrderMessage.setDeliveryAddress(orderData.getDeliveryAddress());
        
        // Преобразование клиента
        if (orderData.getCustomer() != null) {
            OneCOrderMessage.Customer customer = new OneCOrderMessage.Customer();
            OneCIntegrationContract.CustomerData customerData = orderData.getCustomer();
            
            customer.setId(customerData.getId());
            customer.setEmail(customerData.getEmail());
            customer.setPhone(customerData.getPhone());
            customer.setClientName(customerData.getClientName());
            customer.setSurname(customerData.getSurname());
            customer.setName(customerData.getName());
            customer.setFathername(customerData.getFathername());
            customer.setCompanyType(customerData.getCompanyType());
            customer.setCountry(customerData.getCountry());
            customer.setState(customerData.getState());
            customer.setCity(customerData.getCity());
            customer.setOfficeAddress(customerData.getOfficeAddress());
            
            oneCOrderMessage.setCustomer(customer);
        }
        
        // Преобразование платежа
        if (orderData.getPayment() != null) {
            OneCOrderMessage.Payment payment = new OneCOrderMessage.Payment();
            OneCIntegrationContract.PaymentData paymentData = orderData.getPayment();
            
            payment.setStatus(paymentData.getStatus());
            payment.setAmount(paymentData.getAmount());
            
            oneCOrderMessage.setPayment(payment);
        }
        
        // Преобразование товаров
        if (orderData.getItems() != null) {
            oneCOrderMessage.setItems(
                orderData.getItems().stream()
                    .map(this::mapFromContractItem)
                    .collect(Collectors.toList())
            );
        }
        
        return oneCOrderMessage;
    }
    
    /**
     * Преобразует товар из контракта в старый DTO
     */
    private OneCOrderMessage.Item mapFromContractItem(OneCIntegrationContract.OrderItemData itemData) {
        OneCOrderMessage.Item item = new OneCOrderMessage.Item();
        
        item.setProductId(itemData.getProductId());
        item.setProductExternalCode(itemData.getProductExternalCode());
        item.setProductCode(itemData.getProductCode());
        item.setProductName(itemData.getProductName());
        item.setSku(itemData.getSku());
        item.setQuantity(itemData.getQuantity());
        item.setPrice(itemData.getPrice());
        
        return item;
    }
}