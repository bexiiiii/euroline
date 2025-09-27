package autoparts.kz.modules.admin.UserActivity.repository;

import autoparts.kz.modules.admin.UserActivity.entity.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long>, JpaSpecificationExecutor<UserActivity> {}
