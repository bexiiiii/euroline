package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Article DTO from UMAPI v2 autocatalog /Articles ("data" items).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ArticleDto {

    @JsonAlias("ART_ID")
    private Long id;

    @JsonAlias("ARTICLE_NR")
    private String articleNumber;

    @JsonAlias("SUP_ID")
    private Long supplierId;

    @JsonAlias("BRAND")
    private String brand;

    @JsonAlias("COMPLETE_DES")
    private String name;

    @JsonAlias("DES")
    private String shortName;

    @JsonAlias("STATUS_DES")
    private String status;

    /**
     * Main image file name (UMAPI media file, not a full URL)
     */
    @JsonAlias("MEDIA_FILE")
    private String mediaFile;

    @JsonAlias("PRODUCTS")
    private List<Product> products;

    @JsonAlias("MEDIAS")
    private List<Media> medias;

    @JsonAlias("CRITERIAS")
    private List<Criterion> criteria;

    @JsonAlias("OE_CODES")
    private List<OeCode> oeCodes;

    @JsonAlias("EAN_CODES")
    private List<String> eanCodes;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Product {
        @JsonAlias("PT_ID")
        private Long id;
        @JsonAlias("DES")
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Media {
        @JsonAlias("SORT")
        private Integer sort;
        @JsonAlias("FILE_NAME")
        private String fileName;
        @JsonAlias("SUP_ID")
        private Long supplierId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Criterion {
        @JsonAlias("CRI_ID")
        private Long id;
        @JsonAlias("CRI_DES")
        private String name;
        @JsonAlias("VALUE")
        private String value;
        @JsonAlias("CRI_UNIT_DES")
        private String unit;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OeCode {
        @JsonAlias("DISPLAY_NR")
        private String number;
        @JsonAlias("BRAND")
        private String brand;
    }
}
