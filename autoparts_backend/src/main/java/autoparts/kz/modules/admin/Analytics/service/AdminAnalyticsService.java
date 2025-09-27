package autoparts.kz.modules.admin.Analytics.service;

import autoparts.kz.modules.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;

@RequiredArgsConstructor
public class AdminAnalyticsService {

    private final OrderRepository orderRepository;

    public long getTotalOrders() {
        return orderRepository.count();
    }

    public BigDecimal getTotalRevenue() {
        return orderRepository.totalRevenue();
    }

    public double getTotalRevenueAsDouble() {
        return getTotalRevenue().doubleValue();
    }
}
