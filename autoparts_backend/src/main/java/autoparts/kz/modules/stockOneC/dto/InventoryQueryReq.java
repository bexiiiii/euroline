package autoparts.kz.modules.stockOneC.dto;



import lombok.Data;
import java.util.List;

@Data
public class InventoryQueryReq {
    private List<String> skus; // список SKU (brand:oem), которые надо освежить
}