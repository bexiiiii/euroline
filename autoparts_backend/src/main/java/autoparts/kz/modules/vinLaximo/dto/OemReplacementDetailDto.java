package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data;

@Data
public class OemReplacementDetailDto {
    private String detailId;
    private String oem;
    private String formattedOem;
    private String manufacturer;
    private String manufacturerId;
    private String name;
    private String weight;
    private String dimensions;
    private String volume;
}
