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
    @Operation(summary = "Получить список модификаций по модели")
    public ResponseEntity<List<ModificationDto>> getModifications(
            @Parameter(description = "ID модели (MS_ID)", required = true)
            @RequestParam Long modelId,
            @Parameter(description = "Тип транспорта (P=Passenger, C=Commercial, M=Motorbike)")
            @RequestParam(defaultValue = "P") String vehicleType
    ) {
        log.info("GET /api/vehicle-catalog/modifications - modelId={}, vehicleType={}", modelId, vehicleType);
        List<ModificationDto> modifications = umapiService.getModifications(modelId, vehicleType);
        return ResponseEntity.ok(modifications);
    }

    @GetMapping("/categories")
    @Operation(summary = "Получить дерево категорий запчастей для модификации")
    public ResponseEntity<List<CategoryDto>> getCategories(
            @Parameter(description = "ID модификации", required = true)
            @RequestParam Long modificationId,
            @Parameter(description = "Тип транспорта (P=Passenger, C=Commercial, M=Motorbike)")
            @RequestParam(defaultValue = "P") String vehicleType
    ) {
        log.info("GET /api/vehicle-catalog/categories - modificationId={}, vehicleType={}", modificationId, vehicleType);
        List<CategoryDto> categories = umapiService.getCategories(modificationId, vehicleType);
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/products")
    @Operation(summary = "Получить список продуктов (с брендами) по категории и модификации")
    public ResponseEntity<List<ProductDto>> getProducts(
            @Parameter(description = "ID категории", required = true)
            @RequestParam Long categoryId,
            @Parameter(description = "ID модификации", required = true)
            @RequestParam Long modificationId,
            @Parameter(description = "Тип транспорта (P=Passenger, C=Commercial, M=Motorbike)")
            @RequestParam(defaultValue = "P") String vehicleType
    ) {
        log.info("GET /api/vehicle-catalog/products - categoryId={}, modificationId={}, vehicleType={}",
                categoryId, modificationId, vehicleType);
        List<ProductDto> products = umapiService.getProducts(categoryId, modificationId, vehicleType);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/articles")
    @Operation(summary = "Получить артикулы по продукту и модификации (постранично)")
    public ResponseEntity<ArticlesPageDto> getArticles(
            @Parameter(description = "ID продукта (PT_ID)", required = true)
            @RequestParam Long productId,
            @Parameter(description = "ID модификации", required = true)
            @RequestParam Long modificationId,
            @Parameter(description = "Тип транспорта (P=Passenger, C=Commercial, M=Motorbike)")
            @RequestParam(defaultValue = "P") String vehicleType,
            @Parameter(description = "ID бренда (SUP_ID), опционально")
            @RequestParam(required = false) Long supplierId,
            @Parameter(description = "Размер страницы, 1..100")
            @RequestParam(defaultValue = "20") int limit,
            @Parameter(description = "Смещение")
            @RequestParam(defaultValue = "0") long offset
    ) {
        log.info("GET /api/vehicle-catalog/articles - productId={}, modificationId={}, vehicleType={}, supplierId={}",
                productId, modificationId, vehicleType, supplierId);
        ArticlesPageDto articles = umapiService.getArticles(productId, modificationId, vehicleType, supplierId, limit, offset);
        return ResponseEntity.ok(articles);
    }
}
