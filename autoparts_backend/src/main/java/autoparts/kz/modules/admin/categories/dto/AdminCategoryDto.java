package autoparts.kz.modules.admin.categories.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminCategoryDto {
    private Long id;
    private Long parentId;
    private String name;
    private String slug;
    private String description;
    private Boolean isActive;
    private Integer sortOrder;
    private String imageUrl;
    private Long productCount;
    private Instant createdAt;
    private Instant updatedAt;
    private List<AdminCategoryDto> subcategories = new ArrayList<>();
}
