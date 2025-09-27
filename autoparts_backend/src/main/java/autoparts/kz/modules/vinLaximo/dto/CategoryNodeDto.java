package autoparts.kz.modules.vinLaximo.dto;


import lombok.Data;
import java.util.List;

@Data
public class CategoryNodeDto {
    private Long id;
    private Long parentId;
    private String code;
    private String name;
    private List<UnitDto> units;
}