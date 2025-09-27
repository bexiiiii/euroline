package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data;
@Data public class ImageMapDto {
    private long detailId;
    private Integer x; private Integer y; private Integer w; private Integer h; // прямоуг-я зона
    private String callout; // номер позиции, подпись и т.п.
}