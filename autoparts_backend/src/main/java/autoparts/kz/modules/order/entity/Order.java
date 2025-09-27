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

    /** Оптимистическая блокировка для безопасных апдейтов по событиям. */
    @Version
    private Long version;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public BigDecimal getTotalPrice() {
        return items == null
                ? BigDecimal.ZERO
                : items.stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transient
    public BigDecimal getTotalAmount() {
        return getTotalPrice();
    }

    @Transient
    public String getCustomerEmail() {
        return user != null ? user.getEmail() : null;
    }

    @Transient
    public List<Product> getProducts() {
        return items == null ? List.of() : items.stream().map(OrderItem::getProduct).toList();
    }

    public enum PaymentStatus { UNPAID, PAID, REFUNDED, PARTIALLY_PAID }
}
