package autoparts.kz.modules.admin.controller;


import autoparts.kz.modules.admin.service.AdminAnalyticsService;
import autoparts.kz.modules.admin.utils.dto.ChartDataPoint;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {
    @Autowired
    private AdminAnalyticsService analyticsService;

    @GetMapping("/total-users")
    public long totalUsers() {
        return analyticsService.getTotalUsers();
    }

    /// буду исправлят когда реализую часть заказов
    @GetMapping("/total-orders")
    public long totalOrders() {
        return analyticsService.getTotalOrders();
    }

    @GetMapping("/total-revenue")
    public BigDecimal totalRevenue() {
        return analyticsService.getTotalRevenue();
    }

    @GetMapping("/top-products")
    public List<String> topProducts() {
        return analyticsService.getTopProducts();
    }
    @GetMapping("/revenue")
    public ResponseEntity<BigDecimal> getRevenueBetweenDates(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        BigDecimal revenue = analyticsService.getRevenueBetweenDates(from, to);
        return ResponseEntity.ok(revenue);
    }
    @GetMapping("/revenue-chart")
    public List<ChartDataPoint> getRevenueChart(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return analyticsService.getRevenueChart(from, to);
    }

}
