package autoparts.kz.modules.admin.service;


import autoparts.kz.modules.admin.utils.ChartUtils;
import autoparts.kz.modules.admin.utils.dto.ChartDataPoint;
import autoparts.kz.modules.auth.repository.UserRepository;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.order.entity.Order;
import autoparts.kz.modules.order.repository.OrderRepository;
import autoparts.kz.modules.manualProducts.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminAnalyticsService {
    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository; // Kept for future use

    public long getTotalUsers() {
        return userRepository.count();
    }

    ///  буду исправлять когда реализую часть заказов
    public long getTotalOrders() {
        return orderRepository.count();
    }

    public BigDecimal getTotalRevenue() {
        return orderRepository.findAll().stream()
                .map(Order::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public List<String> getTopProducts() {
        return orderRepository.findAll().stream()
                .flatMap(order -> order.getProducts().stream())
                .collect(Collectors.groupingBy(
                        Product::getName,
                        Collectors.summingInt(p -> 1)
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    public BigDecimal getRevenueBetweenDates(LocalDate from, LocalDate to) {
        List<Order> orders = orderRepository.findByCreatedAtBetween(
                from.atStartOfDay(), to.plusDays(1).atStartOfDay()
        );

        return orders.stream()
                .map(Order::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public List<ChartDataPoint> getRevenueChart(LocalDate from, LocalDate to) {
        List<Order> orders = orderRepository.findByCreatedAtBetween(
                from.atStartOfDay(), to.plusDays(1).atStartOfDay()
        );
        Map<LocalDate, BigDecimal> grouped = ChartUtils.groupRevenueByDay(orders);
        return ChartUtils.toChartDataPoints(grouped);
    }
}

