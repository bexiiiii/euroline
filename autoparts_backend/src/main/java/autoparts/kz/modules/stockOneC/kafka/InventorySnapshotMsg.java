package autoparts.kz.modules.stockOneC.kafka;

import lombok.Data;

@Data
public class InventorySnapshotMsg {
    private String sku;
    private String warehouseCode;
    private Integer available;
    private String ts;
}