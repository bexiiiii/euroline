package autoparts.kz.modules.admin.settings.repository;

import autoparts.kz.modules.admin.settings.entity.ErrorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ErrorLogRepository extends JpaRepository<ErrorLog, Long>, JpaSpecificationExecutor<ErrorLog> {}
