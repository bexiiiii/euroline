package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data;

@Data
public class OperationFieldDto {
    private String name;         // chassis, chassisSeries, engineNo...
    private String description;  // "Номер шасси"
    private String example;      // "77101821"
    private String pattern;      // regexp
}