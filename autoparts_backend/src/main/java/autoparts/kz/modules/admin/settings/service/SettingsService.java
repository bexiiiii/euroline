package autoparts.kz.modules.admin.settings.service;

import autoparts.kz.modules.admin.settings.entity.AppSetting;
import autoparts.kz.modules.admin.settings.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final AppSettingRepository repository;

    private static final String[][] DEFAULT_SETTINGS = {
            // General settings
            {"site.name", "AutoParts.kz"},
            {"site.description", "Интернет-магазин автозапчастей"},
            {"site.url", "https://autoparts.kz"},
            {"site.admin_email", "admin@autoparts.kz"},
            {"site.timezone", "Asia/Almaty"},
            {"site.language", "ru"},
            {"site.currency", "KZT"},

            // Appearance
            {"appearance.logo", "/images/logo.svg"},
            {"appearance.favicon", "/images/favicon.ico"},
            {"appearance.primary_color", "#3B82F6"},
            {"appearance.secondary_color", "#10B981"},
            {"appearance.theme", "light"},
            {"appearance.font_family", "Inter"},

            // SEO
            {"seo.meta_title", "AutoParts.kz - Автозапчасти онлайн"},
            {"seo.meta_description", "Купите качественные автозапчасти с доставкой по Казахстану"},
            {"seo.meta_keywords", "автозапчасти, запчасти, авто, казахстан"},
            {"seo.google_analytics", ""},
            {"seo.yandex_metrica", ""},
            {"seo.robots_txt", "User-agent: *\nDisallow: /admin/\nDisallow: /api/"},

            // Business
            {"business.company_name", "ТОО AutoParts Kazakhstan"},
            {"business.company_address", "г. Алматы, ул. Примерная, д. 123"},
            {"business.company_phone", "+7 (727) 123-45-67"},
            {"business.company_email", "info@autoparts.kz"},
            {"business.working_hours", "Пн-Пт: 9:00-18:00, Сб: 10:00-16:00"},
            {"business.inn", "123456789012"},
            {"business.kpp", "123456789"},
            {"business.ogrn", "1234567890123"},

            // Social
            {"social.facebook", ""},
            {"social.instagram", ""},
            {"social.vkontakte", ""},
            {"social.telegram", ""},
            {"social.whatsapp", "+7 (727) 123-45-67"},
            {"social.youtube", ""},

            // Integrations
            {"integrations.email_provider", "smtp"},
            {"integrations.sms_provider", "smsc"},
            {"integrations.payment_gateways", "[\"sberbank\",\"tinkoff\"]"},
            {"integrations.delivery_services", "[\"cdek\",\"post_kazakhstan\"]"},
            {"integrations.crm_system", "1c"},
            {"integrations.analytics_services", "[\"google_analytics\"]"}
    };

    @Transactional(readOnly = true)
    public String get(String key, String defaultValue) {
        return repository.findById(key)
                .map(AppSetting::getValue)
                .orElse(defaultValue);
    }

    @Transactional(readOnly = true)
    public List<AppSetting> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public AppSetting findByKey(String key) {
        return repository.findById(key)
                .orElseGet(() -> {
                    AppSetting setting = new AppSetting();
                    setting.setKey(key);
                    setting.setValue(null);
                    return setting;
                });
    }

    @Transactional
    public AppSetting save(String key, String value) {
        AppSetting setting = repository.findById(key)
                .orElseGet(() -> {
                    AppSetting created = new AppSetting();
                    created.setKey(key);
                    return created;
                });
        setting.setValue(value);
        setting.setUpdatedAt(Instant.now());
        return repository.save(setting);
    }

    @Transactional
    public List<AppSetting> saveAll(Map<String, String> values) {
        List<AppSetting> updated = new ArrayList<>();
        values.forEach((key, value) -> updated.add(save(key, value)));
        return updated;
    }

    @Transactional
    public void resetToDefaults() {
        repository.deleteAll();
        applyDefaults();
    }

    @Transactional
    public void ensureDefaults() {
        if (repository.count() == 0) {
            applyDefaults();
        }
    }

    private void applyDefaults() {
        for (String[] entry : DEFAULT_SETTINGS) {
            String key = entry[0];
            String value = entry[1];
            repository.findById(key).orElseGet(() -> {
                AppSetting setting = new AppSetting();
                setting.setKey(key);
                setting.setValue(value);
                return repository.save(setting);
            });
        }
    }
}
