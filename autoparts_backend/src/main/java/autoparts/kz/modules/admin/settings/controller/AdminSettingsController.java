package autoparts.kz.modules.admin.settings.controller;

import autoparts.kz.modules.admin.settings.entity.AppSetting;
import autoparts.kz.modules.admin.settings.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/settings") @RequiredArgsConstructor
public class AdminSettingsController {
    private final AppSettingRepository repo;

    @GetMapping
    public List<AppSetting> all(){ return repo.findAll(); }
    @PutMapping
    public AppSetting upsert(@RequestBody AppSetting s){ return repo.save(s); }
    @GetMapping("/{key}") public AppSetting get(@PathVariable String key){ return repo.findById(key).orElseThrow(); }
    @PutMapping("/{key}") public AppSetting put(@PathVariable String key, @RequestBody Map<String,String> body){
        var s = repo.findById(key).orElseGet(()->{ AppSetting ns=new AppSetting(); ns.setKey(key); return ns; });
        s.setValue(body.get("value")); return repo.save(s);
    }
}
