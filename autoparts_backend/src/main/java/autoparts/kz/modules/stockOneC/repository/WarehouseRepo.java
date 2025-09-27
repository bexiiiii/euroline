package autoparts.kz.modules.stockOneC.repository;



import autoparts.kz.modules.stockOneC.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WarehouseRepo extends JpaRepository<Warehouse, Long> {
    Optional<Warehouse> findByCode(String code);
}

