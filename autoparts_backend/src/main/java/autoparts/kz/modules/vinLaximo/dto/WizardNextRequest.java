package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data;

@Data
public class WizardNextRequest {
    private String catalog;
    private String ssd;
    private Selection selection;

    @Data
    public static class Selection {
        private String key;
        private String value;
    }
}

