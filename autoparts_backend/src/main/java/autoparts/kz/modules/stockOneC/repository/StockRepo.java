package autoparts.kz.modules.stockOneC.repository;



import autoparts.kz.modules.stockOneC.entity.Stock;
import autoparts.kz.modules.stockOneC.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockRepo extends JpaRepository<Stock, Long> {
    List<Stock> findBySku(String sku);
    Optional<Stock> findBySkuAndWarehouse(String sku, Warehouse wh);
}