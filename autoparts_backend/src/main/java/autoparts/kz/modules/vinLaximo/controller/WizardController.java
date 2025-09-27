package autoparts.kz.modules.vinLaximo.controller;

import autoparts.kz.modules.vinLaximo.dto.*;
import autoparts.kz.modules.vinLaximo.service.CatService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Validated
@RestController
@RequestMapping("/api/v1/wizard")
public class WizardController {

    private final CatService catService;

    public WizardController(CatService catService) {
        this.catService = catService;
    }

    // POST /api/v1/wizard/start
    @PostMapping("/start")
    public ResponseEntity<WizardStepDto> start(@RequestBody WizardStartRequest req) {
        if (req == null || req.getCatalog() == null || req.getCatalog().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        WizardStepDto step = catService.wizardStart(req.getCatalog(), req.getVin(), req.getLocale());
        // Не логируем ssd, просто возвращаем шаг
        return ResponseEntity.ok(step);
    }

    // POST /api/v1/wizard/next
    @PostMapping("/next")
    public ResponseEntity<WizardStepDto> next(@RequestBody WizardNextRequest req) {
        if (req == null || req.getCatalog() == null || req.getCatalog().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (req.getSsd() == null || req.getSsd().isBlank()) {
            // Требуем ssd для шага next согласно бизнес-требованию
            return ResponseEntity.badRequest().body(null);
        }
        if (req.getSelection() == null || req.getSelection().getKey() == null) {
            return ResponseEntity.badRequest().build();
        }
        WizardStepDto step = catService.wizardNext(
                req.getCatalog(),
                req.getSsd(),
                req.getSelection().getKey(),
                req.getSelection().getValue(),
                null
        );
        return ResponseEntity.ok(step);
    }

    // POST /api/v1/wizard/finish
    @PostMapping("/finish")
    public ResponseEntity<VehicleDto> finish(@RequestBody WizardFinishRequest req) {
        if (req == null || req.getCatalog() == null || req.getCatalog().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (req.getSsd() == null || req.getSsd().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        VehicleDto vehicle = catService.wizardFinish(req.getCatalog(), req.getSsd(), req.getLocale());
        // Возвращаем объект с vehicleId, catalog, name, brand, ssd (VehicleDto содержит эти поля)
        return ResponseEntity.ok(vehicle);
    }
}

