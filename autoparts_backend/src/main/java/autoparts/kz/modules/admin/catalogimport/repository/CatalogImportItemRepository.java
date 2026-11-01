package autoparts.kz.modules.admin.catalogimport.repository;

import autoparts.kz.modules.admin.catalogimport.entity.CatalogImportItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CatalogImportItemRepository extends JpaRepository<CatalogImportItem, Long> {

    List<CatalogImportItem> findByJobIdOrderByPositionAsc(Long jobId);

    long countByJobId(Long jobId);

    void deleteByJobId(Long jobId);
}
