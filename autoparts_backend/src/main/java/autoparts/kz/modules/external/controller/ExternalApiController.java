package autoparts.kz.modules.external.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/external")
@RequiredArgsConstructor
public class ExternalApiController {

    @GetMapping("/products")
    public Map<String, Object> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search
    ) {
        // Mock product data for external API
        return Map.of(
            "success", true,
            "data", Map.of(
                "products", List.of(
                    Map.of(
                        "id", 1,
                        "name", "Тормозные колодки передние",
                        "price", 4500.00,
                        "currency", "KZT",
                        "brand", "Brembo",
                        "category", "Тормозная система",
                        "inStock", true,
                        "quantity", 15
                    ),
                    Map.of(
                        "id", 2,
                        "name", "Масло моторное 5W-30",
                        "price", 8200.00,
                        "currency", "KZT",
                        "brand", "Castrol",
                        "category", "Масла и жидкости",
                        "inStock", true,
                        "quantity", 42
                    )
                ),
                "totalElements", 1247,
                "totalPages", 63,
                "currentPage", page,
                "pageSize", size
            ),
            "message", "Товары получены успешно"
        );
    }

    @GetMapping("/products/{id}")
    public Map<String, Object> getProduct(@PathVariable Long id) {
        Map<String, Object> product = new java.util.HashMap<>();
        product.put("id", id);
        product.put("name", "Тормозные колодки передние");
        product.put("description", "Высококачественные керамические тормозные колодки");
        product.put("price", 4500.00);
        product.put("currency", "KZT");
        product.put("brand", "Brembo");
        product.put("category", "Тормозная система");
        product.put("partNumber", "P23154");
        product.put("compatibility", List.of("Toyota Camry 2018-2023", "Lexus ES 2019-2023"));
        product.put("images", List.of("/images/brake-pads-1.jpg", "/images/brake-pads-2.jpg"));
        product.put("specifications", Map.of(
            "material", "Керамика",
            "thickness", "12.5mm",
            "width", "142mm",
            "height", "54mm"
        ));
        product.put("inStock", true);
        product.put("quantity", 15);
        product.put("warehouse", "Алматы");
        
        return Map.of(
            "success", true,
            "data", product,
            "message", "Информация о товаре получена"
        );
    }

    @PostMapping("/orders")
    public Map<String, Object> createOrder(@RequestBody Map<String, Object> orderData) {
        Long orderId = System.currentTimeMillis() % 100000;
        
        return Map.of(
            "success", true,
            "data", Map.of(
                "orderId", orderId,
                "status", "PENDING",
                "totalAmount", 12700.00,
                "currency", "KZT",
                "createdAt", Instant.now().toString(),
                "estimatedDelivery", "2024-01-15",
                "trackingNumber", "AP" + orderId
            ),
            "message", "Заказ создан успешно"
        );
    }

    @GetMapping("/orders/{id}/status")
    public Map<String, Object> getOrderStatus(@PathVariable Long id) {
        String[] statuses = {"PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"};
        String status = statuses[(int) (id % statuses.length)];
        
        return Map.of(
            "success", true,
            "data", Map.of(
                "orderId", id,
                "status", status,
                "statusDescription", getStatusDescription(status),
                "lastUpdated", Instant.now().toString(),
                "trackingNumber", "AP" + id,
                "estimatedDelivery", "2024-01-15"
            ),
            "message", "Статус заказа получен"
        );
    }

    @GetMapping("/categories")
    public Map<String, Object> getCategories() {
        return Map.of(
            "success", true,
            "data", List.of(
                Map.of("id", 1, "name", "Двигатель", "productCount", 2847),
                Map.of("id", 2, "name", "Тормозная система", "productCount", 1523),
                Map.of("id", 3, "name", "Подвеска", "productCount", 1891),
                Map.of("id", 4, "name", "Масла и жидкости", "productCount", 674),
                Map.of("id", 5, "name", "Электрика", "productCount", 1256)
            ),
            "message", "Категории получены"
        );
    }

    @GetMapping("/health")
    public Map<String, Object> healthCheck() {
        return Map.of(
            "success", true,
            "data", Map.of(
                "status", "healthy",
                "timestamp", Instant.now().toString(),
                "version", "1.0.0",
                "uptime", "24 days, 14 hours, 32 minutes"
            ),
            "message", "API работает нормально"
        );
    }

    private String getStatusDescription(String status) {
        return switch (status) {
            case "PENDING" -> "Заказ ожидает подтверждения";
            case "CONFIRMED" -> "Заказ подтвержден";
            case "PROCESSING" -> "Заказ в обработке";
            case "SHIPPED" -> "Заказ отправлен";
            case "DELIVERED" -> "Заказ доставлен";
            default -> "Неизвестный статус";
        };
    }
}