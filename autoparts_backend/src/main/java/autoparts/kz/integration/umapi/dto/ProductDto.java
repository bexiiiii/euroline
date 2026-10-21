package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Product (generic article) DTO from UMAPI v2 autocatalog /Products.
 * UMAPI returns one row per product + supplier pair.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProductDto {

    /**
     * Product type ID (PT_ID), passed as PT_IDS to /Articles
     */
    @JsonAlias("PT_ID")
    private Long id;

    @JsonAlias("PRODUCT")
    private String name;

    @JsonAlias("SUP_ID")
    private Long supplierId;

    @JsonAlias("BRAND")
    private String brand;
}
