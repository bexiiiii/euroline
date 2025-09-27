package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data;

@Data
public class FeatureDto {
    private String name;     // vinsearch / framesearch / wizardsearch / quickgroups / ...
    private String example;  // если присутствует
}