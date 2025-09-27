package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class OemPartReferenceDto {
    private String oem;
    private String name;
    private List<OemCatalogReferenceDto> catalogs = new ArrayList<>();
    private List<OemManufacturerDetailDto> manufacturers = new ArrayList<>();
}
