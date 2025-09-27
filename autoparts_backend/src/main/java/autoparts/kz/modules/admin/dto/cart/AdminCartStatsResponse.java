package autoparts.kz.modules.admin.dto.cart;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class AdminCartStatsResponse {
    private long totalActiveCarts;
    private long totalAbandonedCarts;
    private BigDecimal totalCartValue;
    private BigDecimal averageCartValue;
    private double cartConversionRate;
    private List<PopularProduct> mostAddedProducts;

    @Data
    public static class PopularProduct {
        private Long productId;
        private String productName;
        private long addedCount;
    }
}
