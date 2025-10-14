package autoparts.kz.modules.admin.service;


import autoparts.kz.common.config.CacheConfig;
import autoparts.kz.modules.admin.utils.ChartUtils;
import autoparts.kz.modules.admin.utils.dto.ChartDataPoint;
import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.auth.repository.UserRepository;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.order.entity.Order;
import autoparts.kz.modules.order.entity.OrderItem;
import autoparts.kz.modules.order.orderStatus.OrderStatus;
import autoparts.kz.modules.order.repository.OrderRepository;
import autoparts.kz.modules.manualProducts.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
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
        BigDecimal total = orderRepository.totalRevenue();
        return total != null ? total : BigDecimal.ZERO;
    }

    public List<String> getTopProducts() {
        return orderRepository.findAllWithItems().stream()
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

    @Cacheable(value = CacheConfig.ADMIN_ANALYTICS_SUMMARY_CACHE, key = "'summary'")
    public Map<String, Object> getSummaryMetrics() {
        return Map.of(
                "totalUsers", getTotalUsers(),
                "totalOrders", getTotalOrders(),
                "totalRevenue", getTotalRevenue()
        );
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

    public List<ChartDataPoint> getMonthlySalesChart() {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusMonths(11).withDayOfMonth(1);
        
        List<Order> orders = orderRepository.findByCreatedAtBetween(
                startDate.atStartOfDay(), 
                endDate.plusDays(1).atStartOfDay()
        );
        
        Map<String, Long> monthlyOrders = orders.stream()
                .collect(Collectors.groupingBy(
                        order -> order.getCreatedAt().getYear() + "-" + 
                                String.format("%02d", order.getCreatedAt().getMonthValue()),
                        Collectors.counting()
                ));
        
        return monthlyOrders.entrySet().stream()
                .map(entry -> new ChartDataPoint(entry.getKey(), entry.getValue().doubleValue()))
                .sorted((a, b) -> a.getDate().compareTo(b.getDate()))
                .collect(Collectors.toList());
    }

    public List<ChartDataPoint> getMonthlyRevenueChart() {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusMonths(11).withDayOfMonth(1);

        List<Order> orders = orderRepository.findByCreatedAtBetween(
                startDate.atStartOfDay(), 
                endDate.plusDays(1).atStartOfDay()
        );
        
        Map<String, BigDecimal> monthlyRevenue = orders.stream()
                .collect(Collectors.groupingBy(
                        order -> order.getCreatedAt().getYear() + "-" + 
                                String.format("%02d", order.getCreatedAt().getMonthValue()),
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalPrice, BigDecimal::add)
                ));
        
        return monthlyRevenue.entrySet().stream()
                .map(entry -> new ChartDataPoint(entry.getKey(), entry.getValue().doubleValue()))
                .sorted((a, b) -> a.getDate().compareTo(b.getDate()))
                .collect(Collectors.toList());
    }

    public Map<String, Object> getOrdersSummary() {
        LocalDate today = LocalDate.now();
        LocalDate firstDayOfMonth = today.withDayOfMonth(1);
        LocalDate previousMonthStart = firstDayOfMonth.minusMonths(1);

        LocalDateTime currentStart = firstDayOfMonth.atStartOfDay();
        LocalDateTime currentEnd = today.plusDays(1).atStartOfDay();
        LocalDateTime previousStart = previousMonthStart.atStartOfDay();
        LocalDateTime previousEnd = firstDayOfMonth.atStartOfDay();

        long totalOrders = orderRepository.count();
        long currentNew = orderRepository.countCreatedBetween(currentStart, currentEnd);
        long previousNew = orderRepository.countCreatedBetween(previousStart, previousEnd);

        long processing = orderRepository.countByStatus(OrderStatus.PENDING);
        long previousProcessing = orderRepository.countByStatusAndCreatedBetween(OrderStatus.PENDING, previousStart, previousEnd);

        long completed = orderRepository.countByStatus(OrderStatus.CONFIRMED);
        long previousCompleted = orderRepository.countByStatusAndCreatedBetween(OrderStatus.CONFIRMED, previousStart, previousEnd);

        BigDecimal revenueCurrent = orderRepository.sumTotalBetween(currentStart, currentEnd);
        if (revenueCurrent == null) {
            revenueCurrent = BigDecimal.ZERO;
        }
        BigDecimal revenuePrevious = orderRepository.sumTotalBetween(previousStart, previousEnd);
        if (revenuePrevious == null) {
            revenuePrevious = BigDecimal.ZERO;
        }

        return Map.of(
                "total", Map.of(
                        "value", totalOrders,
                        "changePercent", roundPercent(percentChange(currentNew, previousNew))
                ),
                "newOrders", Map.of(
                        "value", currentNew,
                        "changePercent", roundPercent(percentChange(currentNew, previousNew))
                ),
                "processing", Map.of(
                        "value", processing,
                        "delta", processing - previousProcessing
                ),
                "completed", Map.of(
                        "value", completed,
                        "changePercent", roundPercent(percentChange(completed, previousCompleted))
                ),
                "revenue", Map.of(
                        "current", revenueCurrent,
                        "previous", revenuePrevious,
                        "changePercent", roundPercent(percentChange(revenueCurrent, revenuePrevious))
                )
        );
    }

    public Map<String, Object> getCustomerGrowthStats() {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusMonths(11).withDayOfMonth(1);
        
        long totalCustomers = userRepository.count();
        
        // Для демонстрации возвращаем базовую статистику
        return Map.of(
                "totalCustomers", totalCustomers,
                "newCustomersThisMonth", totalCustomers > 0 ? (long)(totalCustomers * 0.05) : 0,
                "growth", "+12.5%"
        );
    }
    
    public List<Map<String, Object>> getCustomerGrowthChart() {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusMonths(11).withDayOfMonth(1);
        
        List<Map<String, Object>> monthlyData = new ArrayList<>();
        
        // ✅ ОПТИМИЗИРОВАНО: Получаем пользователей только за нужный период
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay();
        
        List<User> users = userRepository.findByCreatedAtBetween(startDateTime, endDateTime);
        
        // Группируем пользователей по месяцам
        Map<String, Long> usersByMonth = users.stream()
                .filter(user -> user.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        user -> user.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        Collectors.counting()
                ));
        
        // Создаем данные для каждого месяца
        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            String monthKey = currentDate.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            long count = usersByMonth.getOrDefault(monthKey, 0L);
            
            monthlyData.add(Map.of(
                    "date", monthKey,
                    "value", count
            ));
            
            currentDate = currentDate.plusMonths(1);
        }
        
        return monthlyData;
    }
    
    // Finance Overview Methods
    public Map<String, Object> getFinanceOverview() {
        long totalOrders = orderRepository.count();
        BigDecimal totalRevenue = getTotalRevenue();
        
        // Рассчитываем средний чек
        BigDecimal averageOrderValue = totalOrders > 0 
            ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        
        // Для демонстрации генерируем статистику
        BigDecimal monthlyRevenue = totalRevenue.multiply(BigDecimal.valueOf(0.15)); // ~15% за текущий месяц
        BigDecimal monthlyExpenses = monthlyRevenue.multiply(BigDecimal.valueOf(0.3)); // 30% расходы
        BigDecimal monthlyProfit = monthlyRevenue.subtract(monthlyExpenses);
        
        return Map.of(
            "totalRevenue", totalRevenue,
            "monthlyRevenue", monthlyRevenue,
            "monthlyExpenses", monthlyExpenses,
            "monthlyProfit", monthlyProfit,
            "averageOrderValue", averageOrderValue,
            "totalOrders", totalOrders,
            "profitMargin", monthlyRevenue.compareTo(BigDecimal.ZERO) > 0 
                ? monthlyProfit.divide(monthlyRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO
        );
    }
    
    // Top Products Methods
    public List<Map<String, Object>> getTopProductsDetailed(int limit) {
        List<Order> allOrders = orderRepository.findAllWithItems();
        
        // Группируем заказы по продуктам и считаем статистику
        Map<Long, Map<String, Object>> productStats = new HashMap<>();
        
        for (Order order : allOrders) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                Long productId = product.getId();
                
                productStats.putIfAbsent(productId, new HashMap<>());
                Map<String, Object> stats = productStats.get(productId);
                
                // Инициализируем данные если их еще нет
                if (!stats.containsKey("id")) {
                    stats.put("id", productId);
                    stats.put("name", product.getName() != null ? product.getName() : "Unknown Product");
                    stats.put("category", product.getCategory() != null ? product.getCategory().getName() : "Uncategorized");
                    stats.put("sales", 0L);
                    stats.put("revenue", BigDecimal.ZERO);
                    stats.put("stock", product.getStock() != null ? product.getStock() : 0);
                }
                
                // Увеличиваем количество продаж
                stats.put("sales", (Long)stats.get("sales") + item.getQuantity());
                
                // Добавляем выручку
                BigDecimal itemRevenue = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                stats.put("revenue", ((BigDecimal)stats.get("revenue")).add(itemRevenue));
            }
        }
        
        // Для определения тренда нужно сравнить продажи за последний месяц с предыдущим
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate startOfLastMonth = startOfMonth.minusMonths(1);
        
        Map<Long, Long> currentMonthSales = new HashMap<>();
        Map<Long, Long> lastMonthSales = new HashMap<>();
        
        for (Order order : allOrders) {
            boolean isCurrentMonth = order.getCreatedAt().isAfter(startOfMonth.atStartOfDay()) 
                && order.getCreatedAt().isBefore(now.plusDays(1).atStartOfDay());
            boolean isLastMonth = order.getCreatedAt().isAfter(startOfLastMonth.atStartOfDay())
                && order.getCreatedAt().isBefore(startOfMonth.atStartOfDay());
            
            for (OrderItem item : order.getItems()) {
                Long productId = item.getProduct().getId();
                
                if (isCurrentMonth) {
                    currentMonthSales.put(productId, 
                        currentMonthSales.getOrDefault(productId, 0L) + item.getQuantity());
                }
                
                if (isLastMonth) {
                    lastMonthSales.put(productId, 
                        lastMonthSales.getOrDefault(productId, 0L) + item.getQuantity());
                }
            }
        }
        
        // Добавляем информацию о тренде
        for (Map.Entry<Long, Map<String, Object>> entry : productStats.entrySet()) {
            Long productId = entry.getKey();
            Map<String, Object> stats = entry.getValue();
            
            Long currentSales = currentMonthSales.getOrDefault(productId, 0L);
            Long lastSales = lastMonthSales.getOrDefault(productId, 0L);
            
            // Определяем тренд
            String trend = "up"; // По умолчанию рост
            if (lastSales > 0) {
                if (currentSales < lastSales) {
                    trend = "down";
                }
            }
            stats.put("trend", trend);
        }
        
        // Сортируем по выручке и берем топ
        List<Map<String, Object>> result = new ArrayList<>(productStats.values());
        result.sort((a, b) -> ((BigDecimal)b.get("revenue")).compareTo((BigDecimal)a.get("revenue")));
        
        return result.stream()
            .limit(limit)
            .collect(Collectors.toList());
    }
    
    // Category Distribution Methods
    public List<Map<String, Object>> getCategoryDistribution() {
        // ✅ ОПТИМИЗИРОВАНО: Используем агрегирующий запрос на уровне БД
        List<Object[]> categoryStats = productRepository.countProductsByCategory();
        long total = productRepository.count();
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : categoryStats) {
            String categoryName = (String) row[0];
            Long count = (Long) row[1];
            
            Map<String, Object> categoryData = new HashMap<>();
            categoryData.put("category", categoryName != null ? categoryName : "Без категории");
            categoryData.put("count", count);
            categoryData.put("percentage", total > 0 ? (count * 100.0 / total) : 0.0);
            result.add(categoryData);
        }
        
        // Уже отсортировано в запросе по убыванию количества
        return result;
    }
    
    // Sales Heatmap Methods
    public List<Map<String, Object>> getSalesHeatmap() {
        // Получаем заказы за последние 7 дней
        LocalDate now = LocalDate.now();
        LocalDate weekAgo = now.minusDays(6); // 7 дней включая сегодня
        
        List<Order> orders = orderRepository.findByCreatedAtBetween(
            weekAgo.atStartOfDay(),
            now.plusDays(1).atStartOfDay()
        );
        
        // Создаем структуру для хранения данных: день недели -> час -> количество заказов
        Map<String, Map<Integer, Integer>> salesByDayAndHour = new HashMap<>();
        
        String[] days = {"Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"};
        for (String day : days) {
            salesByDayAndHour.put(day, new HashMap<>());
            for (int hour = 0; hour < 24; hour++) {
                salesByDayAndHour.get(day).put(hour, 0);
            }
        }
        
        // Заполняем реальными данными
        for (Order order : orders) {
            int dayOfWeek = order.getCreatedAt().getDayOfWeek().getValue(); // 1 = Пн, 7 = Вс
            int hour = order.getCreatedAt().getHour();
            
            String dayName = days[dayOfWeek - 1];
            Map<Integer, Integer> hourMap = salesByDayAndHour.get(dayName);
            hourMap.put(hour, hourMap.get(hour) + 1);
        }
        
        // Преобразуем в список для отправки клиенту
        List<Map<String, Object>> heatmapData = new ArrayList<>();
        
        for (String day : days) {
            Map<Integer, Integer> hourMap = salesByDayAndHour.get(day);
            for (int hour = 0; hour < 24; hour++) {
                Map<String, Object> point = new HashMap<>();
                point.put("day", day);
                point.put("hour", hour);
                point.put("sales", hourMap.get(hour));
                
                heatmapData.add(point);
            }
        }
        
        return heatmapData;
    }
    
    // Recent Orders - последние 5 заказов
    public List<Map<String, Object>> getRecentOrders(int limit) {
        List<Order> orders = orderRepository.findAllWithItems().stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .limit(limit)
            .collect(Collectors.toList());
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Order order : orders) {
            Map<String, Object> orderData = new HashMap<>();
            orderData.put("id", order.getId());
            orderData.put("publicCode", order.getPublicCode());
            orderData.put("status", order.getStatus().toString());
            orderData.put("totalPrice", order.getTotalPrice());
            orderData.put("createdAt", order.getCreatedAt());
            orderData.put("customerEmail", order.getCustomerEmail());
            
            // Добавляем информацию о товарах
            List<Map<String, Object>> items = new ArrayList<>();
            for (OrderItem item : order.getItems()) {
                Map<String, Object> itemData = new HashMap<>();
                itemData.put("productName", item.getProduct().getName());
                itemData.put("quantity", item.getQuantity());
                itemData.put("price", item.getPrice());
                itemData.put("category", item.getProduct().getCategory() != null ? 
                    item.getProduct().getCategory().getName() : "Без категории");
                items.add(itemData);
            }
            orderData.put("items", items);
            
            result.add(orderData);
        }
        
        return result;
    }
    
    // Monthly Target - целевые показатели за месяц
    public Map<String, Object> getMonthlyTarget() {
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate startOfLastMonth = startOfMonth.minusMonths(1);
        
        // Доход за текущий месяц
        BigDecimal currentMonthRevenue = orderRepository.findByCreatedAtBetween(
            startOfMonth.atStartOfDay(),
            now.plusDays(1).atStartOfDay()
        ).stream()
            .map(Order::getTotalPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Доход за прошлый месяц
        BigDecimal lastMonthRevenue = orderRepository.findByCreatedAtBetween(
            startOfLastMonth.atStartOfDay(),
            startOfMonth.atStartOfDay()
        ).stream()
            .map(Order::getTotalPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Доход за сегодня
        BigDecimal todayRevenue = orderRepository.findByCreatedAtBetween(
            now.atStartOfDay(),
            now.plusDays(1).atStartOfDay()
        ).stream()
            .map(Order::getTotalPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Целевая сумма (можно сделать настраиваемой)
        BigDecimal target = new BigDecimal("5000000"); // 5 млн тенге
        
        // Процент выполнения
        double progressPercent = target.compareTo(BigDecimal.ZERO) > 0 
            ? currentMonthRevenue.divide(target, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100")).doubleValue()
            : 0.0;
        
        // Рост по сравнению с прошлым месяцем
        double growthPercent = lastMonthRevenue.compareTo(BigDecimal.ZERO) > 0
            ? currentMonthRevenue.subtract(lastMonthRevenue)
                .divide(lastMonthRevenue, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100")).doubleValue()
            : 0.0;
        
        Map<String, Object> result = new HashMap<>();
        result.put("target", target);
        result.put("currentRevenue", currentMonthRevenue);
        result.put("todayRevenue", todayRevenue);
        result.put("progressPercent", Math.min(progressPercent, 100.0));
        result.put("growthPercent", growthPercent);
        result.put("isGrowthPositive", growthPercent >= 0);
        
        return result;
    }
    
    // Customer Demographics - демография клиентов
    public List<Map<String, Object>> getCustomerDemographics() {
        // Пока используем моковые данные, так как у User нет поля country
        // В будущем нужно добавить поле country в таблицу users
        List<Map<String, Object>> demographics = new ArrayList<>();
        
        long totalCustomers = userRepository.count();
        
        // Казахстан
        Map<String, Object> kz = new HashMap<>();
        kz.put("country", "Kazakhstan");
        kz.put("countryCode", "KZ");
        kz.put("customers", (long)(totalCustomers * 0.85));
        kz.put("percentage", 85.0);
        demographics.add(kz);
        
        // Россия
        Map<String, Object> ru = new HashMap<>();
        ru.put("country", "Russia");
        ru.put("countryCode", "RU");
        ru.put("customers", (long)(totalCustomers * 0.15));
        ru.put("percentage", 15.0);
        demographics.add(ru);
        
        return demographics;
    }

    private double percentChange(long current, long previous) {
        if (previous == 0) {
            return current > 0 ? 100.0 : 0.0;
        }
        return ((double) current - previous) / previous * 100.0;
    }

    private double percentChange(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current != null && current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        if (current == null) {
            current = BigDecimal.ZERO;
        }
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    private double roundPercent(double value) {
        return BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}
