package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Analog (cross-reference) DTO from UMAPI
 * Represents a single analog article result
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalogDto {

    /**
     * Article number
     */
    @JsonProperty("article")
    private String article;

    /**
     * Article number used for search (normalized)
     */
    @JsonProperty("articleSearch")
    private String articleSearch;

    /**
     * Article title/description
     */
    @JsonProperty("title")
    private String title;

    /**
     * Image URL (if available)
     */
    @JsonProperty("img")
    private String img;

    /**
     * Article ID (if available)
     */
    @JsonProperty("artId")
    private Long artId;

    /**
     * Match type (e.g., "Indefinite", "OEM", "OES")
     */
    @JsonProperty("type")
    private String type;

    /**
     * Target type (e.g., "Cross", "Original")
     */
    @JsonProperty("target")
    private String target;

    /**
     * Brand/Supplier name
     */
    @JsonProperty("brand")
    private String brand;

    /**
     * Brand name used for search (normalized)
     */
    @JsonProperty("brandSearch")
    private String brandSearch;
}
