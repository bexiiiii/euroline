package autoparts.kz.modules.cml.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO для отображения остатков товара на конкретном складе
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseStockDTO {
    
    /**
     * GUID склада в 1С
     */
    private String warehouseGuid;
    
    /**
     * Название склада (будет заполняться из справочника складов, если есть)
     */
    private String warehouseName;
    
    /**
     * Количество товара на складе
     */
    private BigDecimal quantity;
    
    /**
     * Код склада (короткий идентификатор)
     */
    private String warehouseCode;

    public WarehouseStockDTO(String warehouseGuid, BigDecimal quantity) {
        this.warehouseGuid = warehouseGuid;
        this.quantity = quantity;
        // По умолчанию используем GUID как код, если нет отдельного поля
        this.warehouseCode = warehouseGuid;
        // Название будет заполнено позже из справочника или останется null
        this.warehouseName = null;
    }
}
