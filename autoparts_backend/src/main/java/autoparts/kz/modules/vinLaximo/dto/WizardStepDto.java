package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data; import java.util.List;
@Data public class WizardStepDto {
    private String ssd;                 // текущий ssd шага
    private List<WizardParamDto> params;
    private boolean finalStep;          // true если следующий вызов = FindVehicleByWizard2
}
