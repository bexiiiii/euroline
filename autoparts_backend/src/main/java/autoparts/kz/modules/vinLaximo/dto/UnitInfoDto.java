package autoparts.kz.modules.vinLaximo.dto;


import lombok.Data;
import java.util.List;

@Data
public class UnitInfoDto {
    private long unitId;
    private String name;
    private String code;
    private String imageUrl;   // содержит %size% → 150/200/250/source
    private String note;       // примечание узла (если есть)
    private List<DetailDto> details;
}
