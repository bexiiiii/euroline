// пример для одного DTO
package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

@Data
public class CatalogDto implements Serializable {
    private static final long serialVersionUID = 1L;

    private String code;
    private String name;
    private String brand;
    private String region;
    private String icon;

    private Boolean supportVinSearch;
    private Boolean supportFrameSearch;
    private Boolean supportQuickGroups;
    private Boolean supportDetailApplicability;
    private Boolean supportParameterIdentification;
    private Boolean supportParameterIdentification2;

    private String vinExample;
    private String frameExample;

    private List<FeatureDto> features;
    private List<OperationDto> operations;
}
