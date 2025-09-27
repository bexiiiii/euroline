package autoparts.kz.modules.vinLaximo.dto;

import java.util.Map;

@lombok.Data
public class ApplicableVehicleDto {
    private String brand;
    private String catalog;
    private String name;
    private String ssd;       // тот самый длинный $*...
    private String vehicleId; // почти всегда "0" для этой команды
    private Map<String,String> attributes; // type=Грузовик и пр.
}