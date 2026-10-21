package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Parts category node from UMAPI v2 autocatalog /Categories ("root" tree, up to 5 levels).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CategoryDto {

    @JsonAlias("CATEGORY_ID")
    private Long id;

    @JsonAlias("DES")
    private String name;

    @JsonAlias("CHILD")
    private List<CategoryDto> children;
}
