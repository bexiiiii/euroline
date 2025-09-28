package autoparts.kz.modules.admin.settings.controller;

import autoparts.kz.modules.admin.Events.service.EventLogService;
import autoparts.kz.modules.admin.settings.entity.AppSetting;
import autoparts.kz.modules.admin.settings.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
public class AdminSettingsController {
    private final AppSettingRepository repo;
    private final EventLogService eventLogService;

    @GetMapping
    public List<AppSetting> all(){ 
        List<AppSetting> settings = repo.findAll();
        if (settings.isEmpty()) {
            // Create default settings if none exist
            createDefaultSettings();
            settings = repo.findAll();
        }
        return settings;
    }
    
    @PostMapping("/init")
    public Map<String, Object> initializeDefaults(){
        createDefaultSettings();
        eventLogService.logAdminAction("Инициализация настроек", "Созданы настройки по умолчанию");
        return Map.of("message", "Default settings created", "count", repo.count());
    }
    
    private void createDefaultSettings() {
        String[][] defaultSettings = {
            // General settings
            {"site.name", "AutoParts.kz"},
            {"site.description", "Интернет-магазин автозапчастей"},
            {"site.url", "https://autoparts.kz"},
            {"site.admin_email", "admin@autoparts.kz"},
            {"site.timezone", "Asia/Almaty"},
            {"site.language", "ru"},
            {"site.currency", "KZT"},
            
            // Appearance settings
            {"appearance.logo", "/images/logo.svg"},
            {"appearance.favicon", "/images/favicon.ico"},
            {"appearance.primary_color", "#3B82F6"},
            {"appearance.secondary_color", "#10B981"},
            {"appearance.theme", "light"},
            {"appearance.font_family", "Inter"},
            
            // SEO settings
            {"seo.meta_title", "AutoParts.kz - Автозапчасти онлайн"},
            {"seo.meta_description", "Купите качественные автозапчасти с доставкой по Казахстану"},
            {"seo.meta_keywords", "автозапчасти, запчасти, авто, казахстан"},
            {"seo.google_analytics", ""},
            {"seo.yandex_metrica", ""},
            {"seo.robots_txt", "User-agent: *\nDisallow: /admin/\nDisallow: /api/"},
            
            // Business settings
            {"business.company_name", "ТОО AutoParts Kazakhstan"},
            {"business.company_address", "г. Алматы, ул. Примерная, д. 123"},
            {"business.company_phone", "+7 (727) 123-45-67"},
            {"business.company_email", "info@autoparts.kz"},
            {"business.working_hours", "Пн-Пт: 9:00-18:00, Сб: 10:00-16:00"},
            {"business.inn", "123456789012"},
            {"business.kpp", "123456789"},
            {"business.ogrn", "1234567890123"},
            
            // Social settings
            {"social.facebook", ""},
            {"social.instagram", ""},
            {"social.vkontakte", ""},
            {"social.telegram", ""},
            {"social.whatsapp", "+7 (727) 123-45-67"},
            {"social.youtube", ""},
            
            // Integrations settings
            {"integrations.email_provider", "smtp"},
            {"integrations.sms_provider", "smsc"},
            {"integrations.payment_gateways", "[\"sberbank\",\"tinkoff\"]"},
            {"integrations.delivery_services", "[\"cdek\",\"post_kazakhstan\"]"},
            {"integrations.crm_system", "1c"},
            {"integrations.analytics_services", "[\"google_analytics\"]"}
        };
        
        for (String[] setting : defaultSettings) {
            if (!repo.existsById(setting[0])) {
                AppSetting appSetting = new AppSetting();
                appSetting.setKey(setting[0]);
                appSetting.setValue(setting[1]);
                repo.save(appSetting);
            }
        }
    }
    
    @PutMapping
    public AppSetting upsert(@RequestBody AppSetting s){ return repo.save(s); }
    @GetMapping("/{key}") public AppSetting get(@PathVariable String key){ return repo.findById(key).orElseThrow(); }
    @PutMapping("/{key}") 
    public AppSetting put(@PathVariable String key, @RequestBody Map<String,String> body){
        var s = repo.findById(key).orElseGet(()->{ AppSetting ns=new AppSetting(); ns.setKey(key); return ns; });
        String oldValue = s.getValue();
        String newValue = body.get("value");
        s.setValue(newValue);
        AppSetting result = repo.save(s);
        
        // Log the settings change
        eventLogService.logSettingsUpdate(key, oldValue, newValue);
        
        return result;
    }
}
