package autoparts.kz.modules.cml.domain.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Контракт JSON для интеграции с 1C.
 * Этот класс определяет стабильную структуру сообщений для обмена с системой 1C.
 * 
 * Версия контракта: 1.0
 * Дата создания: 2025-10-11
 */
public class OneCIntegrationContract {

    /**
     * Стандартное сообщение о заказе для 1C
     */
    public static class OrderMessage {
        
        @JsonProperty("contract_version")
        private String contractVersion = "1.0";
        
        @JsonProperty("message_type")
        private String messageType = "ORDER";
        
        @JsonProperty("timestamp")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime timestamp = LocalDateTime.now();
        
        @JsonProperty("order_data")
        private OrderData orderData;
        
        // Конструкторы, геттеры и сеттеры
        public OrderMessage() {}
        
        public OrderMessage(OrderData orderData) {
            this.orderData = orderData;
        }
        
        public String getContractVersion() { return contractVersion; }
        public void setContractVersion(String contractVersion) { this.contractVersion = contractVersion; }
        
        public String getMessageType() { return messageType; }
        public void setMessageType(String messageType) { this.messageType = messageType; }
        
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
        
        public OrderData getOrderData() { return orderData; }
        public void setOrderData(OrderData orderData) { this.orderData = orderData; }
    }
    
    /**
     * Стандартное сообщение о возврате для 1C
     */
    public static class ReturnMessage {
        
        @JsonProperty("contract_version")
        private String contractVersion = "1.0";
        
        @JsonProperty("message_type")
        private String messageType = "RETURN";
        
        @JsonProperty("timestamp")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime timestamp = LocalDateTime.now();
        
        @JsonProperty("return_data")
        private ReturnData returnData;
        
        // Конструкторы, геттеры и сеттеры
        public ReturnMessage() {}
        
        public ReturnMessage(ReturnData returnData) {
            this.returnData = returnData;
        }
        
        public String getContractVersion() { return contractVersion; }
        public void setContractVersion(String contractVersion) { this.contractVersion = contractVersion; }
        
        public String getMessageType() { return messageType; }
        public void setMessageType(String messageType) { this.messageType = messageType; }
        
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
        
        public ReturnData getReturnData() { return returnData; }
        public void setReturnData(ReturnData returnData) { this.returnData = returnData; }
    }
    
    /**
     * Данные заказа
     */
    public static class OrderData {
        
        @JsonProperty("order_id")
        private Long orderId;
        
        @JsonProperty("external_id")
        private String externalId;
        
        @JsonProperty("public_code")
        private String publicCode;
        
        @JsonProperty("created_at")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime createdAt;
        
        @JsonProperty("confirmed_at")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime confirmedAt;
        
        @JsonProperty("status")
        private String status;
        
        @JsonProperty("total_amount")
        private BigDecimal totalAmount;
        
        @JsonProperty("currency")
        private String currency;
        
        @JsonProperty("customer")
        private CustomerData customer;
        
        @JsonProperty("delivery_address")
        private String deliveryAddress;
        
        @JsonProperty("payment")
        private PaymentData payment;
        
        @JsonProperty("items")
        private List<OrderItemData> items;
        
        // Геттеры и сеттеры
        public Long getOrderId() { return orderId; }
        public void setOrderId(Long orderId) { this.orderId = orderId; }
        
        public String getExternalId() { return externalId; }
        public void setExternalId(String externalId) { this.externalId = externalId; }
        
        public String getPublicCode() { return publicCode; }
        public void setPublicCode(String publicCode) { this.publicCode = publicCode; }
        
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        
        public LocalDateTime getConfirmedAt() { return confirmedAt; }
        public void setConfirmedAt(LocalDateTime confirmedAt) { this.confirmedAt = confirmedAt; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
        
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        
        public CustomerData getCustomer() { return customer; }
        public void setCustomer(CustomerData customer) { this.customer = customer; }
        
        public String getDeliveryAddress() { return deliveryAddress; }
        public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
        
        public PaymentData getPayment() { return payment; }
        public void setPayment(PaymentData payment) { this.payment = payment; }
        
        public List<OrderItemData> getItems() { return items; }
        public void setItems(List<OrderItemData> items) { this.items = items; }
    }
    
    /**
     * Данные возврата
     */
    public static class ReturnData {
        
        @JsonProperty("return_id")
        private Long returnId;
        
        @JsonProperty("order_id")
        private Long orderId;
        
        @JsonProperty("order_external_id")
        private String orderExternalId;
        
        @JsonProperty("order_public_code")
        private String orderPublicCode;
        
        @JsonProperty("customer_id")
        private Long customerId;
        
        @JsonProperty("status")
        private String status;
        
        @JsonProperty("amount")
        private BigDecimal amount;
        
        @JsonProperty("currency")
        private String currency;
        
        @JsonProperty("reason")
        private String reason;
        
        @JsonProperty("details")
        private String details;
        
        @JsonProperty("created_at")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime createdAt;
        
        @JsonProperty("updated_at")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime updatedAt;
        
        @JsonProperty("customer")
        private CustomerData customer;
        
        // Геттеры и сеттеры
        public Long getReturnId() { return returnId; }
        public void setReturnId(Long returnId) { this.returnId = returnId; }
        
        public Long getOrderId() { return orderId; }
        public void setOrderId(Long orderId) { this.orderId = orderId; }
        
        public String getOrderExternalId() { return orderExternalId; }
        public void setOrderExternalId(String orderExternalId) { this.orderExternalId = orderExternalId; }
        
        public String getOrderPublicCode() { return orderPublicCode; }
        public void setOrderPublicCode(String orderPublicCode) { this.orderPublicCode = orderPublicCode; }
        
        public Long getCustomerId() { return customerId; }
        public void setCustomerId(Long customerId) { this.customerId = customerId; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        
        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }
        
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        
        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
        
        public CustomerData getCustomer() { return customer; }
        public void setCustomer(CustomerData customer) { this.customer = customer; }
    }
    
    /**
     * Данные клиента
     */
    public static class CustomerData {
        
        @JsonProperty("id")
        private Long id;
        
        @JsonProperty("email")
        private String email;
        
        @JsonProperty("phone")
        private String phone;
        
        @JsonProperty("client_name")
        private String clientName;
        
        @JsonProperty("surname")
        private String surname;
        
        @JsonProperty("name")
        private String name;
        
        @JsonProperty("fathername")
        private String fathername;
        
        @JsonProperty("company_type")
        private String companyType;
        
        @JsonProperty("country")
        private String country;
        
        @JsonProperty("state")
        private String state;
        
        @JsonProperty("city")
        private String city;
        
        @JsonProperty("office_address")
        private String officeAddress;
        
        // Геттеры и сеттеры
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        
        public String getClientName() { return clientName; }
        public void setClientName(String clientName) { this.clientName = clientName; }
        
        public String getSurname() { return surname; }
        public void setSurname(String surname) { this.surname = surname; }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getFathername() { return fathername; }
        public void setFathername(String fathername) { this.fathername = fathername; }
        
        public String getCompanyType() { return companyType; }
        public void setCompanyType(String companyType) { this.companyType = companyType; }
        
        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }
        
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        
        public String getOfficeAddress() { return officeAddress; }
        public void setOfficeAddress(String officeAddress) { this.officeAddress = officeAddress; }
    }
    
    /**
     * Данные платежа
     */
    public static class PaymentData {
        
        @JsonProperty("status")
        private String status;
        
        @JsonProperty("amount")
        private BigDecimal amount;
        
        @JsonProperty("payment_method")
        private String paymentMethod;
        
        // Геттеры и сеттеры
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    }
    
    /**
     * Данные товара в заказе
     */
    public static class OrderItemData {
        
        @JsonProperty("product_id")
        private Long productId;
        
        @JsonProperty("product_external_code")
        private String productExternalCode;
        
        @JsonProperty("product_code")
        private String productCode;
        
        @JsonProperty("product_name")
        private String productName;
        
        @JsonProperty("sku")
        private String sku;
        
        @JsonProperty("quantity")
        private Integer quantity;
        
        @JsonProperty("price")
        private BigDecimal price;
        
        @JsonProperty("total_price")
        private BigDecimal totalPrice;
        
        // Геттеры и сеттеры
        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        
        public String getProductExternalCode() { return productExternalCode; }
        public void setProductExternalCode(String productExternalCode) { this.productExternalCode = productExternalCode; }
        
        public String getProductCode() { return productCode; }
        public void setProductCode(String productCode) { this.productCode = productCode; }
        
        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }
        
        public String getSku() { return sku; }
        public void setSku(String sku) { this.sku = sku; }
        
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        
        public BigDecimal getTotalPrice() { return totalPrice; }
        public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }
    }
}