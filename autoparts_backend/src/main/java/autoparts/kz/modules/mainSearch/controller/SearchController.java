package autoparts.kz.modules.mainSearch.controller;




import autoparts.kz.modules.mainSearch.dto.SearchResponse;
import autoparts.kz.modules.mainSearch.service.MainSearchService;
import autoparts.kz.modules.customers.service.CustomerService;
import lombok.RequiredArgsConstructor;
import autoparts.kz.common.security.SimplePrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final MainSearchService searchService;
    private final CustomerService customerService;
    private final autoparts.kz.modules.mainSearch.service.GuestSearchLimiter guestSearchLimiter;

    /** Главный поиск: VIN/FRAME/PLATE/OEM/Текст */
    @GetMapping
    public org.springframework.http.ResponseEntity<?> search(@AuthenticationPrincipal(errorOnInvalidType = false) SimplePrincipal principal,
                                 @RequestParam("q") String q,
                                 @RequestParam(value = "catalog", required = false) String catalog,
                                 @RequestParam(value = "brand", required = false) String brand,
                                 @RequestParam(value = "refresh", defaultValue = "false") boolean refresh,
                                 jakarta.servlet.http.HttpServletRequest request) {
        Long userId = principal != null ? principal.id() : null;
        if (userId == null && !guestSearchLimiter.allowGuest(request, q)) {
            return guestSearchLimiter.limitResponse();
        }
        if (userId != null && !refresh) {
            try { customerService.saveSearch(userId, q); } catch (Exception ignored) {}
        }
        return org.springframework.http.ResponseEntity.ok(searchService.search(q, catalog, brand));
    }
}
