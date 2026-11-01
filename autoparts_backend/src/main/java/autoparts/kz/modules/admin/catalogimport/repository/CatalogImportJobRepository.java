package autoparts.kz.modules.admin.catalogimport.repository;

import autoparts.kz.modules.admin.catalogimport.entity.CatalogImportJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CatalogImportJobRepository extends JpaRepository<CatalogImportJob, Long> {

    List<CatalogImportJob> findTop50ByOrderByIdDesc();

    @Modifying
    @Query("UPDATE CatalogImportJob j SET j.pagesDone = :done, j.pages = :total WHERE j.id = :id")
    void updateProgress(@Param("id") Long id, @Param("done") int done, @Param("total") int total);
}
