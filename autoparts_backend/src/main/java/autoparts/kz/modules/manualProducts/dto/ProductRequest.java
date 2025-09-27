package autoparts.kz.modules.manualProducts.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {
    private String name;
    private String code;
    private String description;
    private String brand;
    private String externalCode;
    private String imageUrl;

    private List<PropertyDTO> properties;

    @Getter
    @Setter
    public static class PropertyDTO {
        private String propertyName;
        private String propertyValue;
    }
}
