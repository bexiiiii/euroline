package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data;



@Data
public class CategoryDto {
    private long id;
    private Long parentId;     // может быть null
    private String name;
    private String code;       // если в CAT присутствует
}