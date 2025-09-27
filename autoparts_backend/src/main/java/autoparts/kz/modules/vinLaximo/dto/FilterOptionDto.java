package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data;
@Data public class FilterOptionDto {
    private String key;      // код фильтра/атрибута
    private String label;    // метка
    private String value;    // значение
}
