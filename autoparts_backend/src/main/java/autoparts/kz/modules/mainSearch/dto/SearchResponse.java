package autoparts.kz.modules.mainSearch.dto;


import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class SearchResponse {
    public enum DetectedType { VIN, FRAME, PLATE, OEM, TEXT }

    private String query;
    private DetectedType detectedType;

    private Vehicle vehicle;      // если найден авто по VIN/FRAME/PLATE
    private List<Item> results;   // если OEM/TEXT — список деталей

    @Data
    public static class Vehicle {
        private String vehicleId;
        private String ssd;
        private String catalog;
        private String brand;
        private String name;
    }

    @Data
    public static class Item {
        private String oem;
        private String name;
        private String brand;
        private String catalog;

        private String imageUrl;
        private BigDecimal price;
        private String currency;
        private Integer quantity;

        private List<Warehouse> warehouses;

        private Long unitId;     // чтобы «перейти к узлу» при желании
        private String ssd;
        private Long categoryId;

        private List<String> vehicleHints;
    }

    @Data
    public static class Warehouse {
        private String code;
        private String name;
        private String address;
        private Integer qty;
    }
}
