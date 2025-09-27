package autoparts.kz.modules.mainSearch.controller;




import autoparts.kz.modules.mainSearch.dto.SearchResponse;
import autoparts.kz.modules.mainSearch.service.MainSearchService;
import autoparts.kz.modules.customers.service.CustomerService;
import lombok.RequiredArgsConstructor;
import autoparts.kz.common.security.SimplePrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import autoparts.kz.modules.vinLaximo.dto.OemPartReferenceDto;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class MainSearchController {

    private final MainSearchService searchService;
    private final CustomerService customerService;

    /** Главный поиск: VIN/FRAME/PLATE/OEM/Текст */
    @GetMapping
    public SearchResponse search(@AuthenticationPrincipal(errorOnInvalidType = false) SimplePrincipal principal,
                                 @RequestParam("q") String q,
                                 @RequestParam(value = "catalog", required = false) String catalog) {
        Long userId = principal != null ? principal.id() : null;
        if (userId != null) {
            try { customerService.saveSearch(userId, q); } catch (Exception ignored) {}
        }
        return searchService.search(q, catalog);
    }

    @GetMapping("/oem/find")
    public ResponseEntity<OemPartReferenceDto> findPartReferences(@RequestParam("oem") String oem,
                                                                  @RequestParam(value = "catalog", required = false) String catalog,
                                                                  @RequestParam(value = "locale", required = false) String locale) {
        return searchService.findPartReferences(oem, catalog, locale)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
