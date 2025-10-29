package autoparts.kz.modules.cml.repo;

import autoparts.kz.modules.cml.domain.entity.CmlPrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CmlPriceRepository extends JpaRepository<CmlPrice, Long> {
    Optional<CmlPrice> findByProductGuidAndPriceTypeGuid(String productGuid, String priceTypeGuid);

    List<CmlPrice> findAllByProductGuidIn(Collection<String> productGuids);
}
