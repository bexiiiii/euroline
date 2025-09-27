package autoparts.kz.modules.admin.utils;

import autoparts.kz.modules.admin.utils.dto.ChartDataPoint;
import autoparts.kz.modules.order.entity.Order;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class ChartUtils {



    public static Map<LocalDate, BigDecimal> groupRevenueByDay(List<Order> orders) {
        return orders.stream()
                .collect(Collectors.groupingBy(
                        order -> order.getCreatedAt().toLocalDate(),
                        Collectors.reducing(
                                BigDecimal.ZERO,
                                Order::getTotalPrice,
                                BigDecimal::add
                        )
                ));
    }

    public static List<ChartDataPoint> toChartDataPoints(Map<LocalDate, BigDecimal> grouped) {
        return grouped.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new ChartDataPoint(
                        entry.getKey().toString(),
                        entry.getValue().doubleValue() // для графиков
                ))
                .collect(Collectors.toList());
    }

}
