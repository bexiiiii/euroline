package autoparts.kz.modules.search.controller;

import autoparts.kz.modules.search.service.SearchService;
import autoparts.kz.modules.customers.service.CustomerService;
import lombok.RequiredArgsConstructor;
import autoparts.kz.common.security.SimplePrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class OemSearchController {

    private final SearchService search;
    private final CustomerService customerService;

    @GetMapping("/oem")
    public SearchService.SearchResult byBrandOem(@AuthenticationPrincipal(errorOnInvalidType = false) SimplePrincipal principal,
                                                 @RequestParam String brand,
                                                 @RequestParam String oem,
                                                 @RequestParam(required=false) String catalog){
        Long userId = principal != null ? principal.id() : null;
        if (userId != null) {
            try { customerService.saveSearch(userId, (brand == null ? "" : brand) + " " + oem); } catch (Exception ignored) {}
        }
        return search.searchByBrandOem(brand, oem, catalog);
    }
}
