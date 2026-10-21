package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Raw /Categories response: {"quic": [...], "root": [...]}. Only the tree is used.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UmapiCategoriesResponse {

    private List<CategoryDto> root;
}
