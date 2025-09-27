package autoparts.kz.modules.admin.categories.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminCategoryRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String slug;

    private String description;

    private String imageUrl;

    private Long parentId;

    @NotNull
    private Integer sortOrder;

    private Boolean isActive;
}
