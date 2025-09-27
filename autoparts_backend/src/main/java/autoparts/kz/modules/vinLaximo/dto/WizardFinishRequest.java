package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data;

@Data
public class WizardFinishRequest {
    private String catalog;
    private String ssd;
    private String locale; // optional override
}

