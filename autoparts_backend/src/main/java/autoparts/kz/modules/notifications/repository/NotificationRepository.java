package autoparts.kz.modules.notifications.repository;

import autoparts.kz.modules.notifications.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long>, JpaSpecificationExecutor<Notification> {

    @Query("select n from Notification n where n.userId = :uid order by n.createdAt desc")
    Page<Notification> findByUserId(@Param("uid") Long userId, Pageable pageable);

    @Query("select count(n) from Notification n where n.userId = :uid and n.readFlag = false")
    long countUnread(@Param("uid") Long userId);
}