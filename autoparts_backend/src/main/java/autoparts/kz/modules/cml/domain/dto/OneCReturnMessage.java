package autoparts.kz.modules.cml.domain.dto;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Сообщение для передачи информации о возврате в 1С через RabbitMQ.
 */
public class OneCReturnMessage {

    private Long returnId;
    private Long orderId;
    private Long customerId;
    private String status;
    private BigDecimal amount;
    private String currency;
    private String reason;
    private String detailsJson;
    private Instant createdAt;
    private Instant updatedAt;
    private String orderExternalId;
    private String orderPublicCode;
    private Customer customer;

    public Long getReturnId() {
        return returnId;
    }

    public void setReturnId(Long returnId) {
        this.returnId = returnId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getDetailsJson() {
        return detailsJson;
    }

    public void setDetailsJson(String detailsJson) {
        this.detailsJson = detailsJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getOrderExternalId() {
        return orderExternalId;
    }

    public void setOrderExternalId(String orderExternalId) {
        this.orderExternalId = orderExternalId;
    }

    public String getOrderPublicCode() {
        return orderPublicCode;
    }

    public void setOrderPublicCode(String orderPublicCode) {
        this.orderPublicCode = orderPublicCode;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public static class Customer {
        private Long id;
        private String email;
        private String phone;
        private String clientName;
        private String surname;
        private String name;
        private String fathername;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getClientName() {
            return clientName;
        }

        public void setClientName(String clientName) {
            this.clientName = clientName;
        }

        public String getSurname() {
            return surname;
        }

        public void setSurname(String surname) {
            this.surname = surname;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getFathername() {
            return fathername;
        }

        public void setFathername(String fathername) {
            this.fathername = fathername;
        }
    }
}
