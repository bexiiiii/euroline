package autoparts.kz.modules.admin.settings.service;



import autoparts.kz.modules.admin.settings.entity.AppSetting;
import autoparts.kz.modules.admin.settings.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SettingsService {
    private final AppSettingRepository repo;

    public String get(String key, String defVal) {
        return repo.findById(key).map(AppSetting::getValue).orElse(defVal);
    }
}