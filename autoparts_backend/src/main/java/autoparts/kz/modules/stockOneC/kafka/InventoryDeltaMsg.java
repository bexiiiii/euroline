package autoparts.kz.modules.stockOneC.kafka;

import lombok.Data;

@Data
public class InventoryDeltaMsg {
    private String sku;           // "BRAND:OEM"
    private String warehouseCode; // "ALM_MAIN"
    private Integer delta;        // +5 / -3
    private String reason;        // SALE/RETURN/ADJUST
    private Long sequence;        // идемпотентность
    private String ts;
}
