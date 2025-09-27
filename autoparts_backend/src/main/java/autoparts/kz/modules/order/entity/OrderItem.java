package autoparts.kz.modules.order.entity;

import autoparts.kz.modules.manualProducts.entity.Product;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "order_items",
        indexes = @Index(name = "idx_order_items_order_id", columnList = "order_id"))
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Заказ */
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    /** Продукт (как и было у тебя) */
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** SKU снимком для интеграций (чтобы не ходить в Product при обработке событий) */
    @Column(length = 100)
    private String sku;

    /** Количество */
    @Column(nullable = false)
    private int quantity;

    /** Цена на момент оформления (snapshot) */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
}
