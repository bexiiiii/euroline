package autoparts.kz.modules.vinLaximo.dto;

public class VehicleModelDto {
    private String code;
    private String label;
    
    public VehicleModelDto() {}
    
    public VehicleModelDto(String code, String label) {
        this.code = code;
        this.label = label;
    }
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public String getLabel() {
        return label;
    }
    
    public void setLabel(String label) {
        this.label = label;
    }
}
