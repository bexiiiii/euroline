package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data;

@Data
public class OemReplacementDto {
    private Integer rate;
    private String type;
    private String way;
    private OemReplacementDetailDto detail;
}
