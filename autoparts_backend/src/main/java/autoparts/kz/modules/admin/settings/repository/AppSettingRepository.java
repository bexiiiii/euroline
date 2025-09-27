package autoparts.kz.modules.admin.settings.repository;

import autoparts.kz.modules.admin.settings.entity.AppSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppSettingRepository extends JpaRepository<AppSetting, String> {}
