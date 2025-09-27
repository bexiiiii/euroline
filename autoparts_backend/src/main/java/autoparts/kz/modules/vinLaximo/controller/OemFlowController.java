package autoparts.kz.modules.vinLaximo.controller;


import autoparts.kz.modules.vinLaximo.dto.ApplicableVehicleDto;
import autoparts.kz.modules.vinLaximo.dto.OemApplicabilityDto;
import autoparts.kz.modules.vinLaximo.service.CatService;
import autoparts.kz.modules.customers.service.CustomerService;
import lombok.RequiredArgsConstructor;
import autoparts.kz.common.security.SimplePrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search/oem")
@RequiredArgsConstructor
public class OemFlowController {
    private final CatService cat;
    private final CustomerService customerService;

    // Шаг 2: список «авто» для выбора (как у тебя на скрине)
    @GetMapping("/applicable-vehicles")
    public List<ApplicableVehicleDto> applicableVehicles(
            @AuthenticationPrincipal(errorOnInvalidType = false) SimplePrincipal principal,
            @RequestParam String catalog,
            @RequestParam String oem) {
        Long userId = principal != null ? principal.id() : null;
        if (userId != null) {
            try { customerService.saveSearch(userId, (catalog == null ? "" : catalog+" ") + oem); } catch (Exception ignored) {}
        }
        return cat.findApplicableVehiclesByOem(catalog, oem);
    }

    // Шаг 3: применимость (категории/юниты/детали) по выбранному ssd
    @GetMapping("/applicability")
    public OemApplicabilityDto applicability(
            @AuthenticationPrincipal(errorOnInvalidType = false) SimplePrincipal principal,
            @RequestParam String catalog,
            @RequestParam String ssd,
            @RequestParam String oem) {
        Long userId = principal != null ? principal.id() : null;
        if (userId != null) {
            try { customerService.saveSearch(userId, (catalog == null ? "" : catalog+" ") + oem); } catch (Exception ignored) {}
        }
        return cat.getOemPartApplicability(catalog, ssd, oem);
    }
}
