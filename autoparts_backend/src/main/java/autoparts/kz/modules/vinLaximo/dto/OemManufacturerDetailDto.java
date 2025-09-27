package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class OemManufacturerDetailDto {
    private String detailId;
    private String manufacturer;
    private String manufacturerId;
    private String name;
    private String oem;
    private String formattedOem;
    private String weight;
    private String dimensions;
    private String volume;
    private List<OemReplacementDto> replacements = new ArrayList<>();
}
