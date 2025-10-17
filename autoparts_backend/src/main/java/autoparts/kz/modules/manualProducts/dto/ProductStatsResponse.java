package autoparts.kz.modules.manualProducts.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO для статистики по товарам
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductStatsResponse {
    private long totalProducts;
    private long inStock;
    private long outOfStock;
    private long syncedWith1C;
}
