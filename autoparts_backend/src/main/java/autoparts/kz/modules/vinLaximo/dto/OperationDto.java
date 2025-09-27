package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data;
import java.util.List;

@Data
public class OperationDto {
    private String name;         // e.g. searchByChassis
    private String description;  // "Поиск по номеру шасси"
    private String kind;         // search_vehicle и т.п.
    private List<OperationFieldDto> fields;
}