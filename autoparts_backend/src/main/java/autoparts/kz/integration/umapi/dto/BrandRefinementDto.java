package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Brand refinement result DTO from UMAPI
 * Used when searching by article number to clarify the brand
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BrandRefinementDto {

    /**
     * Article number
     */
    @JsonProperty("articleNr")
    private String articleNumber;

    /**
     * Available suppliers/brands for this article
     */
    @JsonProperty("suppliers")
    private List<SupplierMatch> suppliers;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupplierMatch {
        @JsonProperty("supplierId")
        private Long id;

        @JsonProperty("supplierName")
        private String name;

        @JsonProperty("matchType")
        private String matchType; // EXACT, SIMILAR, OE

        @JsonProperty("articleCount")
        private Integer articleCount;
    }
}
