package autoparts.kz.modules.stockOneC.repository;



import autoparts.kz.modules.stockOneC.entity.InventoryOffset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InventoryOffsetRepo extends JpaRepository<InventoryOffset, Long> {
    Optional<InventoryOffset> findBySkuAndWarehouseCode(String sku, String warehouseCode);
}
