package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data; import java.util.List;
@Data public class WizardParamDto {
    private String code;         // код параметра
    private String label;        // метка
    private List<WizardValueDto> values;
}