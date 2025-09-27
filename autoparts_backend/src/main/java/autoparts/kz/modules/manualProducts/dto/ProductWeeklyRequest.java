package autoparts.kz.modules.manualProducts.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductWeeklyRequest {
    private Boolean value;       // true/false включить/выключить
    private String startAt;      // ISO-8601 (optional)
    private String endAt;        // ISO-8601 (optional)
    private Boolean autoRange;   // если true или null и даты не заданы — ставим текущую неделю
}

