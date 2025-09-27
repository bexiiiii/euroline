package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data;

@Data
public class UnitDto {
    private long unitId;
    private String name;
    private String code;       // если есть
    private boolean filtered;  // есть ли фильтры применимости
}