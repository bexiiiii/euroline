package autoparts.kz.modules.admin.repository;

import autoparts.kz.modules.admin.entity.NotificationCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationCampaignRepository extends JpaRepository<NotificationCampaign, Long> {
    List<NotificationCampaign> findTop50ByOrderByCreatedAtDesc();
}

