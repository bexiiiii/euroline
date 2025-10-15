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
        
        // UMAPI enrichment fields
        private List<UmapiSupplier> umapiSuppliers;  // список брендов из UMAPI
        private Integer analogsCount;                // количество доступных аналогов
        private List<String> oeNumbers;              // OE коды
        private List<String> tradeNumbers;           // торговые номера
        private List<String> eanNumbers;             // EAN штрихкоды
        private List<TechnicalCriteria> criteria;    // технические характеристики
        private List<String> umapiImages;            // изображения из UMAPI
    }
    
    @Data
    public static class UmapiSupplier {
        private Long id;
        private String name;
        private String matchType;    // EXACT, OE, SIMILAR
        private Integer articleCount;
    }
    
    @Data
    public static class TechnicalCriteria {
        private Long id;
        private String name;
        private String value;
        private String unit;
    }

    @Data
    public static class Warehouse {
        private String code;
        private String name;
        private String address;
        private Integer qty;
    }
}
