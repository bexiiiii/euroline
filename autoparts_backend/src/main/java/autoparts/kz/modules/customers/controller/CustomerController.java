package autoparts.kz.modules.customers.controller;

import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.customers.dto.CustomerSearchHistoryResponse;
import autoparts.kz.modules.customers.entity.CustomerSearchQuery;
import autoparts.kz.modules.customers.service.CustomerService;
import autoparts.kz.modules.manualProducts.dto.ProductQuery;
import autoparts.kz.modules.manualProducts.dto.ProductResponse;
import autoparts.kz.modules.manualProducts.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import autoparts.kz.common.security.SimplePrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Objects;

// controller/CustomerController.java
@RestController @RequestMapping("/api/customers") @RequiredArgsConstructor
public class CustomerController {
    private final CustomerService svc;
    private final ProductService productService;

    @GetMapping @PreAuthorize("hasRole('ADMIN')")
    public Page<User> list(@RequestParam(required=false) String q,
                           @RequestParam(required=false) String status,
                           @RequestParam(defaultValue="0") int page,
                           @RequestParam(defaultValue="20") int size){
        return svc.list(q, status, PageRequest.of(page,size, Sort.by("id").descending()));
    }

    @PostMapping @PreAuthorize("hasRole('ADMIN')")
    public User create(@RequestBody User u){ return svc.create(u); }

    @GetMapping("/{id}") @PreAuthorize("hasRole('ADMIN')")
    public User get(@PathVariable Long id){ return svc.get(id); }

    @PutMapping("/{id}") @PreAuthorize("hasRole('ADMIN')")
    public User update(@PathVariable Long id, @RequestBody User u){ return svc.update(id, u); }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id){ svc.delete(id); }

    @PatchMapping("/{id}/status") @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> patchStatus(@PathVariable Long id, @RequestParam String status){ return svc.patchStatus(id, status); }

    // Поиск товаров пользователем + запись истории
    @GetMapping("/search")
    public Page<ProductResponse> search(@AuthenticationPrincipal(errorOnInvalidType = false) SimplePrincipal principal,
                                        @RequestParam String q,
                                        @RequestParam(defaultValue="0") int page,
                                        @RequestParam(defaultValue="20") int size) {
        Long userId = principal != null ? principal.id() : null;
        if (userId != null) {
            svc.saveSearch(userId, q);
        }

        // pageable
        Pageable pageable = PageRequest.of(
                page, size, Sort.by(Sort.Direction.DESC, "createdAt")
        );

        // единый DTO фильтра (остальные поля null)
        ProductQuery query = new ProductQuery(q, null, null, null, null, null, null);

        return productService.list(query, pageable);
    }

    @PostMapping("/newsletter") @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> newsletter(@RequestBody Map<String,Object> body) {
        String subject = Objects.toString(body != null ? body.get("subject") : null, "Newsletter");
        String message = Objects.toString(body != null ? body.get("message") : null, "");
        int recipients = svc.broadcastNewsletter(subject, message);
        return Map.of(
                "sent", recipients > 0,
                "recipients", recipients,
                "subject", subject,
                "message", message
        );
    }

    @GetMapping("/search-history") @PreAuthorize("hasRole('ADMIN')")
    public Page<CustomerSearchHistoryResponse> history(@RequestParam(required=false) Long customerId,
                                             @RequestParam(defaultValue="0") int page,
                                             @RequestParam(defaultValue="50") int size){
        return svc.searchHistory(customerId, PageRequest.of(page,size, Sort.by("createdAt").descending()));
    }

    // История поиска текущего пользователя (USER/ADMIN)
    @GetMapping("/my/search-history")
    public Page<CustomerSearchHistoryResponse> myHistory(@AuthenticationPrincipal(errorOnInvalidType = false) SimplePrincipal principal,
                                               @RequestParam(defaultValue="0") int page,
                                               @RequestParam(defaultValue="50") int size) {
        Long userId = principal != null ? principal.id() : null;
        return svc.searchHistory(userId, PageRequest.of(page,size, Sort.by("createdAt").descending()));
    }

    @PostMapping("/search-history")
    public Map<String,Object> record(@AuthenticationPrincipal(errorOnInvalidType = false) SimplePrincipal principal,
                                     @RequestBody Map<String,String> r){
        Long userId = principal != null ? principal.id() : null;
        if (userId != null) {
            svc.saveSearch(userId, r.get("q"));
        }
        return Map.of("ok", true);
    }

    @GetMapping("/search-analytics") @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> analytics(){ return svc.searchAnalytics(); }

    @GetMapping("/stats") @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> stats(){ return svc.stats(); }
}
