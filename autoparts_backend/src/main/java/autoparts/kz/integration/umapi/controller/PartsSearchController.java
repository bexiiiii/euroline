package autoparts.kz.integration.umapi.controller;

import autoparts.kz.integration.umapi.dto.AnalogDto;
import autoparts.kz.integration.umapi.dto.BrandRefinementDto;
import autoparts.kz.integration.umapi.service.UmapiIntegrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST API для поиска запчастей и аналогов через UMAPI
 */
@Slf4j
@RestController
@RequestMapping("/api/parts-search")
@RequiredArgsConstructor
@Tag(name = "Parts Search", description = "API для поиска запчастей по артикулу и аналогов")
public class PartsSearchController {

    private final UmapiIntegrationService umapiService;

    @GetMapping("/by-article")
    @Operation(
            summary = "Поиск запчастей по артикулу",
            description = "Возвращает список производителей (брендов), у которых есть данный артикул. " +
                    "Используйте для уточнения бренда перед поиском аналогов."
    )
    public ResponseEntity<BrandRefinementDto> searchByArticle(
            @Parameter(description = "Артикул запчасти (номер детали)", required = true, example = "0986452041")
            @RequestParam String article
    ) {
        log.info("GET /api/parts-search/by-article - article={}", article);
        BrandRefinementDto result = umapiService.searchByArticle(article);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/analogs")
    @Operation(
            summary = "Получить аналоги запчасти",
            description = "Возвращает список аналогов для указанного артикула и бренда. " +
                    "Включает оригинальные (OE), OEM и aftermarket аналоги."
    )
    public ResponseEntity<AnalogDto> getAnalogs(
            @Parameter(description = "Артикул запчасти", required = true, example = "0986452041")
            @RequestParam String article,
            @Parameter(description = "Бренд производителя", required = true, example = "BOSCH")
            @RequestParam String brand
    ) {
        log.info("GET /api/parts-search/analogs - article={}, brand={}", article, brand);
        AnalogDto analogs = umapiService.getAnalogs(article, brand);
        return ResponseEntity.ok(analogs);
    }
}
