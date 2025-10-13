package autoparts.kz.modules.admin.repository;

import autoparts.kz.modules.admin.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository("adminNotificationRepository")
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long userId);

    long countByCampaignId(Long campaignId);

    @Query("""
            select n.campaign.id as campaignId, count(n) as count
            from AdminNotification n
            where n.campaign.id in :campaignIds
            group by n.campaign.id
            """)
    List<CampaignCount> countByCampaignIds(@Param("campaignIds") Collection<Long> campaignIds);

    interface CampaignCount {
        Long getCampaignId();
        long getCount();
    }
}
