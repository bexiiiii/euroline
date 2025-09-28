package autoparts.kz.modules.admin.UserActivity.repository;

import autoparts.kz.modules.admin.UserActivity.entity.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long>, JpaSpecificationExecutor<UserActivity> {
    
    @Query("SELECT DISTINCT ua.module FROM UserActivity ua WHERE ua.module IS NOT NULL ORDER BY ua.module")
    List<String> findDistinctModules();
}
