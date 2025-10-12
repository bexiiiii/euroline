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
import java.util.Map;

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

    @GetMapping("/monthly-sales")
    public List<ChartDataPoint> getMonthlySales() {
        return analyticsService.getMonthlySalesChart();
    }

    @GetMapping("/monthly-revenue")
    public List<ChartDataPoint> getMonthlyRevenue() {
        return analyticsService.getMonthlyRevenueChart();
    }

    @GetMapping("/orders-summary")
    public ResponseEntity<Map<String, Object>> getOrdersSummary() {
        return ResponseEntity.ok(analyticsService.getOrdersSummary());
    }

    @GetMapping("/customer-growth")
    public ResponseEntity<Map<String, Object>> getCustomerGrowth() {
        return ResponseEntity.ok(analyticsService.getCustomerGrowthStats());
    }
    
    @GetMapping("/customer-growth-chart")
    public ResponseEntity<List<Map<String, Object>>> getCustomerGrowthChart() {
        return ResponseEntity.ok(analyticsService.getCustomerGrowthChart());
    }
    
    @GetMapping("/finance-overview")
    public ResponseEntity<Map<String, Object>> getFinanceOverview() {
        return ResponseEntity.ok(analyticsService.getFinanceOverview());
    }
    
    @GetMapping("/top-products-detailed")
    public ResponseEntity<List<Map<String, Object>>> getTopProductsDetailed(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(analyticsService.getTopProductsDetailed(limit));
    }
    
    @GetMapping("/category-distribution")
    public ResponseEntity<List<Map<String, Object>>> getCategoryDistribution() {
        return ResponseEntity.ok(analyticsService.getCategoryDistribution());
    }
    
    @GetMapping("/sales-heatmap")
    public ResponseEntity<List<Map<String, Object>>> getSalesHeatmap() {
        return ResponseEntity.ok(analyticsService.getSalesHeatmap());
    }
    
    @GetMapping("/recent-orders")
    public ResponseEntity<List<Map<String, Object>>> getRecentOrders(
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(analyticsService.getRecentOrders(limit));
    }
    
    @GetMapping("/monthly-target")
    public ResponseEntity<Map<String, Object>> getMonthlyTarget() {
        return ResponseEntity.ok(analyticsService.getMonthlyTarget());
    }
    
    @GetMapping("/customer-demographics")
    public ResponseEntity<List<Map<String, Object>>> getCustomerDemographics() {
        return ResponseEntity.ok(analyticsService.getCustomerDemographics());
    }

}
