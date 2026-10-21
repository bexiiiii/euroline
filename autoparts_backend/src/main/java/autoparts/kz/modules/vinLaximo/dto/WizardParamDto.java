package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data; import java.util.List;
@Data public class WizardParamDto {
    private String code;         // код параметра (conditionid)
    private String label;        // метка
    private List<WizardValueDto> values; // варианты; code = ssd для следующего вызова GetWizard2
    private boolean determined;  // параметр уже выбран
    private String value;        // выбранное значение (если determined)
    private String removeKey;    // ssd, с которым этот параметр будет сброшен
}
