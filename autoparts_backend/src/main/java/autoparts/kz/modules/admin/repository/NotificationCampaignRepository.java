package autoparts.kz.modules.admin.repository;

import autoparts.kz.modules.admin.entity.NotificationCampaign;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationCampaignRepository extends JpaRepository<NotificationCampaign, Long> {
    @EntityGraph(attributePaths = "sender")
    List<NotificationCampaign> findTop50ByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "sender")
    Page<NotificationCampaign> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
