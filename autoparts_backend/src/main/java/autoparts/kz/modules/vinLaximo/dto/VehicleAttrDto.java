package autoparts.kz.modules.vinLaximo.dto;


import lombok.Data;
import java.util.List;

@Data
public class VehicleAttrDto {
    private String code;
    private String label;
    private List<String> values;
}