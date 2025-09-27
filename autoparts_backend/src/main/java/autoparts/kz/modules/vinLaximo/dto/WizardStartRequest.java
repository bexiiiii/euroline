package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data;

@Data
public class WizardStartRequest {
    private String catalog;
    private String locale; // optional override
    private String vin;    // optional
}

