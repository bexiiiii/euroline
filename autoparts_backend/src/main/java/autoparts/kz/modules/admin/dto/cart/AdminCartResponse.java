package autoparts.kz.modules.admin.dto.cart;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
public class AdminCartResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private boolean abandoned;
    private Instant createdAt;
    private Instant lastUpdated;
    private Instant abandonedAt;
    private int totalItems;
    private BigDecimal totalAmount;
    private List<CartItem> items;

    @Data
    public static class CartItem {
        private Long id;
        private Long productId;
        private String productName;
        private String productSku;
        private BigDecimal price;
        private BigDecimal total;
        private int quantity;
        private Instant addedAt;
    }
}
