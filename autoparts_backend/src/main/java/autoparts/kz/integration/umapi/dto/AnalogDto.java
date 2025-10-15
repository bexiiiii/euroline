package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Analog (cross-reference) DTO from UMAPI
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalogDto {

    /**
     * Original article number
     */
    @JsonProperty("originalArticle")
    private String originalArticle;

    /**
     * Original supplier name
     */
    @JsonProperty("originalSupplier")
    private String originalSupplier;

    /**
     * List of analog articles
     */
    @JsonProperty("analogs")
    private List<AnalogArticle> analogs;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnalogArticle {
        /**
         * Analog article number
         */
        @JsonProperty("articleNr")
        private String articleNumber;

        /**
         * Supplier/Brand ID
         */
        @JsonProperty("supplierId")
        private Long supplierId;

        /**
         * Supplier/Brand name
         */
        @JsonProperty("supplierName")
        private String supplierName;

        /**
         * Article name
         */
        @JsonProperty("articleName")
        private String name;

        /**
         * Match type (OE, EXACT, SIMILAR)
         */
        @JsonProperty("matchType")
        private String matchType;

        /**
         * Quality indicator (OE, OEM, Aftermarket)
         */
        @JsonProperty("quality")
        private String quality;

        /**
         * Availability status
         */
        @JsonProperty("availability")
        private Boolean available;
    }
}
