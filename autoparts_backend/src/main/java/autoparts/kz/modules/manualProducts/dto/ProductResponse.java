package autoparts.kz.modules.manualProducts.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String code;
    private String description;
    private String brand;
    private String externalCode;
    private String imageUrl;
    private List<PropertyDTO> properties;
    private boolean syncedWith1C;

    //   из 1С
    private Integer price;
    private Integer stock;
    private List<WarehouseDTO> warehouses;

    //  weekly info
    private Boolean weekly;
    private java.time.Instant weeklyStartAt;
    private java.time.Instant weeklyEndAt;

    @Getter @Setter
    public static class PropertyDTO {
        private String propertyName;
        private String propertyValue;
    }

    @Getter @Setter
    public static class WarehouseDTO {
        private String name;
        private Integer quantity;
    }
}
