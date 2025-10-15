package autoparts.kz.integration.umapi.controller;

import autoparts.kz.integration.umapi.dto.*;
import autoparts.kz.integration.umapi.service.UmapiIntegrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API для работы с каталогом автомобилей через UMAPI
 */
@Slf4j
@RestController
@RequestMapping("/api/vehicle-catalog")
@RequiredArgsConstructor
@Tag(name = "Vehicle Catalog", description = "API для подбора запчастей по автомобилю")
public class VehicleCatalogController {

    private final UmapiIntegrationService umapiService;

    @GetMapping("/manufacturers")
    @Operation(summary = "Получить список производителей легковых автомобилей")
    public ResponseEntity<List<ManufacturerDto>> getPassengerManufacturers() {
        log.info("GET /api/vehicle-catalog/manufacturers - fetching passenger manufacturers");
        List<ManufacturerDto> manufacturers = umapiService.getPassengerManufacturers();
        return ResponseEntity.ok(manufacturers);
    }

    @GetMapping("/manufacturers/commercial")
    @Operation(summary = "Получить список производителей коммерческих автомобилей")
    public ResponseEntity<List<ManufacturerDto>> getCommercialManufacturers() {
        log.info("GET /api/vehicle-catalog/manufacturers/commercial - fetching commercial manufacturers");
        List<ManufacturerDto> manufacturers = umapiService.getCommercialManufacturers();
        return ResponseEntity.ok(manufacturers);
    }

    @GetMapping("/manufacturers/motorbikes")
    @Operation(summary = "Получить список производителей мотоциклов")
    public ResponseEntity<List<ManufacturerDto>> getMotorbikeManufacturers() {
        log.info("GET /api/vehicle-catalog/manufacturers/motorbikes - fetching motorbike manufacturers");
        List<ManufacturerDto> manufacturers = umapiService.getMotorbikeManufacturers();
        return ResponseEntity.ok(manufacturers);
    }

    @GetMapping("/models")
    @Operation(summary = "Получить список моделей по производителю")
    public ResponseEntity<List<ModelSeriesDto>> getModels(
            @Parameter(description = "ID производителя", required = true)
            @RequestParam Long manufacturerId,
            @Parameter(description = "Тип транспорта (P=Passenger, C=Commercial, M=Motorbike)", required = true)
            @RequestParam String vehicleType
    ) {
        log.info("GET /api/vehicle-catalog/models - manufacturerId={}, vehicleType={}", manufacturerId, vehicleType);
        List<ModelSeriesDto> models = umapiService.getModels(manufacturerId, vehicleType);
        return ResponseEntity.ok(models);
    }

    @GetMapping("/modifications")
    @Operation(summary = "Получить список модификаций по модели (только легковые)")
    public ResponseEntity<List<ModificationDto>> getPassengerModifications(
            @Parameter(description = "ID модели", required = true)
            @RequestParam Long modelId
    ) {
        log.info("GET /api/vehicle-catalog/modifications - modelId={}", modelId);
        List<ModificationDto> modifications = umapiService.getPassengerModifications(modelId);
        return ResponseEntity.ok(modifications);
    }

    @GetMapping("/categories")
    @Operation(summary = "Получить список категорий запчастей для модификации")
    public ResponseEntity<List<CategoryDto>> getCategories(
            @Parameter(description = "ID модификации", required = true)
            @RequestParam Long modificationId
    ) {
        log.info("GET /api/vehicle-catalog/categories - modificationId={}", modificationId);
        List<CategoryDto> categories = umapiService.getCategories(modificationId);
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/products")
    @Operation(summary = "Получить список продуктовых групп по категории и модификации")
    public ResponseEntity<List<ProductDto>> getProducts(
            @Parameter(description = "ID категории", required = true)
            @RequestParam Long categoryId,
            @Parameter(description = "ID модификации", required = true)
            @RequestParam Long modificationId
    ) {
        log.info("GET /api/vehicle-catalog/products - categoryId={}, modificationId={}", categoryId, modificationId);
        List<ProductDto> products = umapiService.getProducts(categoryId, modificationId);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/articles")
    @Operation(summary = "Получить список артикулов по продукту и модификации")
    public ResponseEntity<List<ArticleDto>> getArticles(
            @Parameter(description = "ID продукта", required = true)
            @RequestParam Long productId,
            @Parameter(description = "ID модификации", required = true)
            @RequestParam Long modificationId
    ) {
        log.info("GET /api/vehicle-catalog/articles - productId={}, modificationId={}", productId, modificationId);
        List<ArticleDto> articles = umapiService.getArticles(productId, modificationId);
        return ResponseEntity.ok(articles);
    }
}
