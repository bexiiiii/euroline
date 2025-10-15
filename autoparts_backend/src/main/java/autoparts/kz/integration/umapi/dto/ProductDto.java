package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Product group DTO from UMAPI
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {

    /**
     * Product ID
     */
    @JsonProperty("productId")
    private Long id;

    /**
     * Product name
     */
    @JsonProperty("productName")
    private String name;

    /**
     * Generic articles (OEM numbers)
     */
    @JsonProperty("genericArticles")
    private List<String> genericArticles;

    /**
     * Number of articles
     */
    @JsonProperty("articleCount")
    private Integer articleCount;

    /**
     * Suppliers for this product
     */
    @JsonProperty("suppliers")
    private List<SupplierInfo> suppliers;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupplierInfo {
        @JsonProperty("supplierId")
        private Long id;

        @JsonProperty("supplierName")
        private String name;
    }
}
