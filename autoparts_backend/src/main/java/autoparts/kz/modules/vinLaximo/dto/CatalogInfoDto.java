package autoparts.kz.modules.vinLaximo.dto;

import lombok.Data; import java.util.Map;
@Data public class CatalogInfoDto {
    private String code;
    private String name;
    private Map<String,String> attributes; // произвольные параметры каталога
}