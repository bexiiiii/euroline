package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Article DTO from UMAPI
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArticleDto {

    /**
     * Article ID
     */
    @JsonProperty("articleId")
    private Long id;

    /**
     * Article number (part number)
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
     * Generic article number
     */
    @JsonProperty("genericArticleNr")
    private String genericArticleNumber;

    /**
     * OE numbers (original equipment numbers)
     */
    @JsonProperty("oeNumbers")
    private List<String> oeNumbers;

    /**
     * Trade numbers
     */
    @JsonProperty("tradeNumbers")
    private List<String> tradeNumbers;

    /**
     * EAN/Barcode
     */
    @JsonProperty("eanNumbers")
    private List<String> eanNumbers;

    /**
     * Criteria (specifications)
     */
    @JsonProperty("criteria")
    private List<Criterion> criteria;

    /**
     * Images
     */
    @JsonProperty("images")
    private List<String> images;

    /**
     * Documents
     */
    @JsonProperty("documents")
    private List<DocumentInfo> documents;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Criterion {
        @JsonProperty("criterionId")
        private Long id;

        @JsonProperty("criterionName")
        private String name;

        @JsonProperty("criterionValue")
        private String value;

        @JsonProperty("criterionUnit")
        private String unit;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentInfo {
        @JsonProperty("documentType")
        private String type;

        @JsonProperty("documentUrl")
        private String url;

        @JsonProperty("fileName")
        private String fileName;
    }
}
