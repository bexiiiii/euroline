package autoparts.kz.modules.cml.repo;

import autoparts.kz.modules.cml.domain.entity.CmlProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CmlProductRepository extends JpaRepository<CmlProduct, Long> {
    Optional<CmlProduct> findByGuid(String guid);

    List<CmlProduct> findByGuidIn(Collection<String> guids);
    
    Optional<CmlProduct> findBySku(String sku);
}
