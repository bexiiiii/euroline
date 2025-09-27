package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data;
import java.util.List;
import java.util.ArrayList;

@Data
public class QuickGroupDto {
    private Long id;          // quickgroupid
    private String code;
    private String name;
    private Boolean link;     // указывает, ведет ли группа к конкретным деталям
    private String synonyms;  // синонимы для поиска
    private List<QuickGroupDto> children = new ArrayList<>(); // дочерние группы
}