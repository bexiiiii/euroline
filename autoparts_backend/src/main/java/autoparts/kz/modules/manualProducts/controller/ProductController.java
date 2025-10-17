package autoparts.kz.modules.manualProducts.controller;

import autoparts.kz.modules.manualProducts.dto.ProductRequest;
import autoparts.kz.modules.manualProducts.dto.ProductResponse;
import autoparts.kz.modules.manualProducts.dto.ProductWeeklyRequest;
import autoparts.kz.modules.manualProducts.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    //  Создание товара
    @PostMapping("/create")
    public ResponseEntity<ProductResponse> create(@RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.create(request));
    }

    // ✅ ОПТИМИЗИРОВАННАЯ ВЕРСИЯ: Получить все товары с пагинацией
    @GetMapping("/all")
    public ResponseEntity<Page<ProductResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        // Ограничиваем максимальный размер страницы для безопасности
        if (size > 100) {
            size = 100;
        }
        return ResponseEntity.ok(productService.getAllPaginated(page, size));
    }

    // ⚠️ DEPRECATED: Старый endpoint без пагинации (оставлен для совместимости)
    @Deprecated
    @GetMapping("/all-legacy")
    public ResponseEntity<List<ProductResponse>> getAllLegacy() {
        return ResponseEntity.ok(productService.getAll());
    }

    //  Получить товар по ID
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    //  Обновить товар по ID
    @PutMapping("/update/{id}")
    public ResponseEntity<ProductResponse> update(@PathVariable Long id, @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.update(id, request));
    }

    //  Удалить товар по ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/search")
    public ResponseEntity<List<ProductResponse>> searchProducts(@RequestParam String q) {
        return ResponseEntity.ok(productService.search(q));
    }

    //  Управление флагом/периодом weekly
    @PatchMapping("/{id}/weekly")
    public ResponseEntity<ProductResponse> setWeekly(@PathVariable Long id, @RequestBody ProductWeeklyRequest body) {
        var product = productService.getEntityById(id); // добавим метод доступа к сущности

        boolean enable = body.getValue() != null ? body.getValue() : Boolean.TRUE;

        java.time.Instant start = null;
        java.time.Instant end = null;

        if (enable) {
            // если заданы даты — парсим; иначе при autoRange=true или null — текущая неделя
            if (body.getStartAt() != null && body.getEndAt() != null) {
                start = java.time.Instant.parse(body.getStartAt());
                end = java.time.Instant.parse(body.getEndAt());
            } else if (body.getAutoRange() == null || Boolean.TRUE.equals(body.getAutoRange())) {
                var zone = java.time.ZoneId.of("Asia/Almaty");
                var now = java.time.ZonedDateTime.now(zone);
                var startOfWeek = now.with(java.time.DayOfWeek.MONDAY).toLocalDate().atStartOfDay(zone);
                var endOfWeek = startOfWeek.plusDays(6).with(java.time.LocalTime.MAX);
                start = startOfWeek.toInstant();
                end = endOfWeek.toInstant();
            }
        }

        product.setIsWeekly(enable);
        product.setWeeklyStartAt(start);
        product.setWeeklyEndAt(end);

        var saved = productService.save(product);
        return ResponseEntity.ok(productService.toResponsePublic(saved));
    }
}
