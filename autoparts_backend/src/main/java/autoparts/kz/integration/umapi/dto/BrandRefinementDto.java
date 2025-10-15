package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Brand refinement result from UMAPI /v2/cross/{locale}/BrandRefinement/{article}
 * Represents a single brand match for an article number
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BrandRefinementDto {

    /**
     * Article number as displayed
     */
    @JsonProperty("article")
    private String article;

    /**
     * Article number used for search (normalized)
     */
    @JsonProperty("articleSearch")
    private String articleSearch;

    /**
     * Part title/description
     */
    @JsonProperty("title")
    private String title;

    /**
     * Image URL (can be null)
     */
    @JsonProperty("img")
    private String img;

    /**
     * Type of match (e.g., "Indefinite")
     */
    @JsonProperty("type")
    private String type;

    /**
     * Brand name
     */
    @JsonProperty("brand")
    private String brand;

    /**
     * Brand name used for search
     */
    @JsonProperty("brandSearch")
    private String brandSearch;
}
