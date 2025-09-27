package autoparts.kz.modules.stockOneC.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OneCStockResponse {
    private String externalCode;
    private Integer price;
    private Integer stock;
    private List<Warehouse> warehouses;

    @Getter
    @Setter
    public static class Warehouse {
        private String name;
        private Integer quantity;
    }
}