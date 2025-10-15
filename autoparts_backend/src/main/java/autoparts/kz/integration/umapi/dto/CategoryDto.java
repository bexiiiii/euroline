package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Category DTO from UMAPI
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {

    /**
     * Category ID
     */
    @JsonProperty("categoryId")
    private Long id;

    /**
     * Category name
     */
    @JsonProperty("categoryName")
    private String name;

    /**
     * Parent category ID (if subcategory)
     */
    @JsonProperty("parentId")
    private Long parentId;

    /**
     * Number of products in this category
     */
    @JsonProperty("productCount")
    private Integer productCount;
}
