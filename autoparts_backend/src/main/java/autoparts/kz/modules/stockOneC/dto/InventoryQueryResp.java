package autoparts.kz.modules.stockOneC.dto;

import lombok.Data;
import java.util.List;

@Data
public class InventoryQueryResp {
    private List<SkuInventory> items;

    @Data
    public static class SkuInventory {
        private String sku;
        private List<WarehouseRow> warehouses; // полный срез по складам
    }

    @Data
    public static class WarehouseRow {
        private String warehouseCode;
        private Integer available;
        private String address;
    }
}
