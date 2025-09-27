package autoparts.kz.modules.promotions.repository;

import autoparts.kz.modules.promotions.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface BannerRepository extends JpaRepository<Banner, Long>, JpaSpecificationExecutor<Banner> {}