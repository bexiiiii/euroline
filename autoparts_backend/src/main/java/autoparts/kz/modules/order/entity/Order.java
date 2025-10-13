package autoparts.kz.modules.order.entity;

import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.order.orderStatus.OrderStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "orders",
        indexes = {
                @Index(name = "idx_orders_user_id", columnList = "user_id"),
                @Index(name = "idx_orders_idem", columnList = "idempotencyKey", unique = true)
        })
public class Order {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Внешний UUID для интеграций (Kafka/1С). */
    @Column(nullable = false, updatable = false, unique = true, length = 36)
    private String externalId = UUID.randomUUID().toString();

    /** Публичный код заказа для отображения пользователю (5 символов A-Z0-9). */
    @Column(name = "public_code", length = 10, unique = true)
    private String publicCode;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private User user;

    @Column(name = "customer_email", nullable = false, length = 255)
    private String customerEmail;

    /** Адрес доставки, который требуется 1С. */
    @Column(length = 500)
    private String deliveryAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    /** Idempotency key с уровня API, чтобы не создать дубликат. */
    @Column(length = 64, unique = true)
    private String idempotencyKey;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    /** Оптимистическая блокировка для безопасных апдейтов по событиям. */
    @Version
    private Long version;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = createdAt;
        recalcTotals();
        if (customerEmail == null && user != null) {
            customerEmail = user.getEmail();
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
        recalcTotals();
        if (customerEmail == null && user != null) {
            customerEmail = user.getEmail();
        }
    }

    public BigDecimal getTotalPrice() {
        return items == null
                ? BigDecimal.ZERO
                : items.stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal getTotalAmount() {
        return totalAmount == null ? BigDecimal.ZERO : totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount == null ? BigDecimal.ZERO : totalAmount;
    }

    @Transient
    public List<Product> getProducts() {
        return items == null ? List.of() : items.stream().map(OrderItem::getProduct).toList();
    }

    public enum PaymentStatus { UNPAID, PAID, REFUNDED, PARTIALLY_PAID }

    public void applyCustomerSnapshot(User source) {
        if (source == null) {
            throw new IllegalArgumentException("Источник данных о пользователе не может быть пустым");
        }
        this.user = source;
        if (source.getEmail() == null || source.getEmail().isBlank()) {
            throw new IllegalStateException("Для пользователя отсутствует email, необходимый для создания заказа");
        }
        this.customerEmail = source.getEmail();
    }

    private void recalcTotals() {
        this.totalAmount = getTotalPrice();
    }
}
