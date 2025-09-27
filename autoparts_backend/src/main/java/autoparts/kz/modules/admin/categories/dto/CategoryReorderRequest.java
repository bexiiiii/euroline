package autoparts.kz.modules.admin.categories.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CategoryReorderRequest {
    @NotEmpty
    private List<Long> categoryIds;
}
