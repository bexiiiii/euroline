package autoparts.kz.modules.vinLaximo.dto;



import lombok.Data;
import java.util.List;


@Data public class VehicleDto {
    private String vehicleId;
    private String ssd;
    private String catalog;
    private String brand;
    private String name;
    private List<VehicleAttrDto> attributes;
}
