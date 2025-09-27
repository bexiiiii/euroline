package autoparts.kz.modules.admin.Analytics.controller;

import autoparts.kz.modules.customers.repository.CustomerRepository;
import autoparts.kz.modules.finance.service.FinanceService;
import autoparts.kz.modules.manualProducts.repository.ProductRepository;
import autoparts.kz.modules.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics") @RequiredArgsConstructor
public class AnalyticsController {
    private final OrderRepository orders; private final ProductRepository products; private final CustomerRepository customers; private final FinanceService finance;

    @GetMapping("/dashboard") @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> dashboard(){
        return Map.of(
                "orders", orders.count(),
                "products", products.count(),
                "customers", customers.count(),
                "finance", finance.stats()
        );
    }
    @GetMapping("/sales") @PreAuthorize("hasRole('ADMIN')") public Object sales(){ return orders.findAll(PageRequest.of(0,50)); }
    @GetMapping("/customers") @PreAuthorize("hasRole('ADMIN')") public Object cust(){ return customers.count(); }
    @GetMapping("/products") @PreAuthorize("hasRole('ADMIN')") public Object prods(){ return products.count(); }
    @GetMapping("/finance") @PreAuthorize("hasRole('ADMIN')") public Object fin(){ return finance.stats(); }
}