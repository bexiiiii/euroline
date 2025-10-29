package autoparts.kz.modules.mainSearch.service;

import autoparts.kz.modules.cml.dto.WarehouseStockDTO;
import autoparts.kz.modules.cml.service.ProductEnrichmentService;
import autoparts.kz.modules.mainSearch.dto.SearchResponse;
import autoparts.kz.modules.stockOneC.dto.StockBulkResponse;
import autoparts.kz.modules.vinLaximo.dto.DetailDto;
import autoparts.kz.modules.vinLaximo.dto.VehicleDto;
import autoparts.kz.modules.vinLaximo.service.CatService;
import autoparts.kz.modules.vinLaximo.dto.OemPartReferenceDto;
import autoparts.kz.modules.stockOneC.client.OneCClient;
import autoparts.kz.integration.umapi.service.UmapiIntegrationService;
import autoparts.kz.integration.umapi.dto.BrandRefinementDto;
import autoparts.kz.common.util.ArticleNormalizationUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MainSearchService {

    private final CatService cat;
    private final OneCClient oneC;
    private final UmapiIntegrationService umapiService;
    private final ProductEnrichmentService productEnrichmentService;

    // VIN - точно 17 символов, без букв I, O, Q (расширенный паттерн)
    private static final Pattern VIN = Pattern.compile("^[A-HJ-NPR-Z0-9]{17}$", Pattern.CASE_INSENSITIVE);
    
    // Дополнительная проверка для потенциальных VIN (более мягкая)
    private static final Pattern POTENTIAL_VIN = Pattern.compile("^[A-Z0-9]{17}$", Pattern.CASE_INSENSITIVE);
    
    // FRAME - должен содержать дефис и быть в формате: 2-4 буквы, дефис, номер
    private static final Pattern FRAME = Pattern.compile("^[A-Z]{2,4}-[0-9A-Z]{6,}$", Pattern.CASE_INSENSITIVE);
    
    // Более строгий паттерн для OEM - без пробелов, минимум 5 символов
    private static final Pattern STRICT_OEM = Pattern.compile("^[A-Z0-9\\-\\.\\/]{5,25}$", Pattern.CASE_INSENSITIVE);

    public SearchResponse search(String q, String catalog) {
        String query = q.trim().toUpperCase();
        SearchResponse resp = new SearchResponse();
        resp.setQuery(query);

        // 1. VIN - точно 17 символов без пробелов (расширенная проверка)
        if (query.length() == 17) {
            boolean isStrictVin = VIN.matcher(query).matches();
            boolean isPotentialVin = POTENTIAL_VIN.matcher(query).matches();
            
            if (isStrictVin || isPotentialVin) {
                try {
                    VehicleDto v = cat.findByVin(query, catalog);
                    var sv = new SearchResponse.Vehicle();
                    sv.setVehicleId(v.getVehicleId());
                    sv.setSsd(v.getSsd());
                    sv.setCatalog(v.getCatalog());
                    sv.setBrand(v.getBrand());
                    sv.setName(v.getName());
                    resp.setVehicle(sv);
                    resp.setDetectedType(SearchResponse.DetectedType.VIN);
                    return resp;
                } catch (Exception e) {
                    // Если поиск по VIN не удался, продолжаем как обычный поиск
                    System.out.println("VIN search failed for: " + query + " - " + e.getMessage());
                }
            }
        }

        // 2. FRAME - должен содержать дефис в правильном формате
        if (FRAME.matcher(query).matches()) {
            try {
                String[] parts = query.split("-");
                String frame = parts[0];
                String frameNo = parts.length > 1 ? parts[1] : "";
                VehicleDto v = cat.findByFrame(frame, frameNo, catalog);
                var sv = new SearchResponse.Vehicle();
                sv.setVehicleId(v.getVehicleId());
                sv.setSsd(v.getSsd());
                sv.setCatalog(v.getCatalog());
                sv.setBrand(v.getBrand());
                sv.setName(v.getName());
                resp.setVehicle(sv);
                resp.setDetectedType(SearchResponse.DetectedType.FRAME);
                return resp;
            } catch (Exception e) {
                // Если поиск по FRAME не удался, продолжаем как обычный поиск
                resp.setDetectedType(SearchResponse.DetectedType.TEXT);
            }
        }

        

        boolean looksLikeOem = isLikelyOemNumber(query);
        resp.setDetectedType(looksLikeOem ? SearchResponse.DetectedType.OEM
                                          : SearchResponse.DetectedType.TEXT);

        if (looksLikeOem) {
            return searchByOem(query, resp);
        }

        List<DetailDto> found;
        try {
            found = cat.searchDetails(query, catalog);
        } catch (Exception e) {
            System.out.println("[SEARCH] fulltext failed: " + e.getMessage());
            resp.setResults(List.of());
            return resp;
        }

        // Собираем OEM для батча в 1С
        List<String> oems = found.stream()
                .map(DetailDto::getOem)
                .filter(Objects::nonNull)
                .distinct()
                .limit(200)
                .toList();

        StockBulkResponse stock = getStock(oems);

        Set<String> enrichmentCodes = new LinkedHashSet<>(oems);
        Map<String, ProductEnrichmentService.EnrichmentData> enrichmentMap = enrichmentCodes.isEmpty()
                ? Map.of()
                : productEnrichmentService.enrichByCodes(new ArrayList<>(enrichmentCodes));

        List<SearchResponse.Item> items = new ArrayList<>();
        for (DetailDto d : found) {
            SearchResponse.Item it = new SearchResponse.Item();
            it.setOem(d.getOem());
            it.setName(d.getName());
            it.setBrand(d.getBrand());
            it.setCatalog(d.getCatalog());
            it.setImageUrl(null);

            var s = stock.getByOem(d.getOem());
            if (s != null) {
                it.setPrice(s.getPrice());
                it.setCurrency(s.getCurrency());
                it.setQuantity(s.getTotalQty());
                it.setWarehouses(StockBulkResponse.toWarehouses(s));
            }

            it.setVehicleHints(Collections.emptyList());

            ProductEnrichmentService.EnrichmentData enrichment =
                    enrichmentMap.get(ArticleNormalizationUtil.normalize(d.getOem()));
            applyEnrichment(it, enrichment);

            items.add(it);
        }

        resp.setResults(items);
        return resp;
    }

    private void applyEnrichment(SearchResponse.Item item, ProductEnrichmentService.EnrichmentData enrichment) {
        if (enrichment == null) {
            return;
        }

        if ((item.getName() == null || item.getName().isBlank()) && enrichment.getName() != null) {
            item.setName(enrichment.getName());
        }
        if ((item.getBrand() == null || item.getBrand().isBlank()) && enrichment.getBrand() != null) {
            item.setBrand(enrichment.getBrand());
        }
        if (item.getImageUrl() == null && enrichment.getImageUrl() != null) {
            item.setImageUrl(enrichment.getImageUrl());
        }
        if (item.getPrice() == null && enrichment.getPrice() != null) {
            item.setPrice(BigDecimal.valueOf(enrichment.getPrice()));
        }
        if (item.getQuantity() == null && enrichment.getStock() != null) {
            item.setQuantity(enrichment.getStock());
        }
        if ((item.getWarehouses() == null || item.getWarehouses().isEmpty()) && enrichment.getWarehouses() != null) {
            item.setWarehouses(convertWarehouses(enrichment.getWarehouses()));
        }
    }

    private List<SearchResponse.Warehouse> convertWarehouses(List<WarehouseStockDTO> warehouses) {
        if (warehouses == null || warehouses.isEmpty()) {
            return List.of();
        }
        List<SearchResponse.Warehouse> result = new ArrayList<>(warehouses.size());
        for (WarehouseStockDTO warehouse : warehouses) {
            SearchResponse.Warehouse dto = new SearchResponse.Warehouse();
            dto.setCode(warehouse.getWarehouseCode() != null ? warehouse.getWarehouseCode() : warehouse.getWarehouseGuid());
            dto.setName(
                    warehouse.getWarehouseName() != null ? warehouse.getWarehouseName() : warehouse.getWarehouseGuid());
            dto.setAddress(null);
            dto.setQty(warehouse.getQuantity() != null ? warehouse.getQuantity().intValue() : null);
            result.add(dto);
        }
        return result;
    }

    private SearchResponse searchByOem(String query, SearchResponse resp) {
        List<BrandRefinementDto> brandMatches = Collections.emptyList();
        try {
            List<BrandRefinementDto> result = umapiService.searchByArticle(query);
            if (result != null) {
                brandMatches = result;
            }
        } catch (Exception e) {
            log.warn("UMAPI search failed for article {}: {}", query, e.getMessage());
        }

        List<String> codesForBatch = brandMatches.stream()
                .map(BrandRefinementDto::getArticle)
                .filter(code -> code != null && !code.isBlank())
                .map(String::trim)
                .distinct()
                .collect(Collectors.toCollection(ArrayList::new));

        boolean queryAlreadyIncluded = codesForBatch.stream()
                .anyMatch(code -> code.equalsIgnoreCase(query));
        if (!queryAlreadyIncluded) {
            codesForBatch.add(query);
        }

        StockBulkResponse stock = codesForBatch.isEmpty()
                ? new StockBulkResponse()
                : getStock(codesForBatch);

        Map<String, ProductEnrichmentService.EnrichmentData> enrichmentMap = codesForBatch.isEmpty()
                ? Map.of()
                : productEnrichmentService.enrichByCodes(codesForBatch);

        List<SearchResponse.Item> items = new ArrayList<>();
        for (BrandRefinementDto match : brandMatches) {
            String oem = (match.getArticle() != null && !match.getArticle().isBlank())
                    ? match.getArticle()
                    : query;

            SearchResponse.Item item = new SearchResponse.Item();
            item.setOem(oem);
            item.setCatalog("UMAPI");
            item.setName(match.getTitle() != null && !match.getTitle().isBlank() ? match.getTitle() : oem);
            item.setBrand(match.getBrand());
            item.setImageUrl(match.getImg());
            item.setVehicleHints(Collections.emptyList());

            StockBulkResponse.Item stockItem = stock.getByOem(oem);
            if (stockItem != null) {
                item.setPrice(stockItem.getPrice());
                item.setCurrency(stockItem.getCurrency());
                item.setQuantity(stockItem.getTotalQty());
                item.setWarehouses(StockBulkResponse.toWarehouses(stockItem));
            }

            SearchResponse.UmapiSupplier supplier = new SearchResponse.UmapiSupplier();
            supplier.setId(null);
            supplier.setName(match.getBrand());
            supplier.setMatchType(match.getType());
            supplier.setArticleCount(1);
            item.setUmapiSuppliers(List.of(supplier));
            if (match.getImg() != null && !match.getImg().isBlank()) {
                item.setUmapiImages(List.of(match.getImg()));
            }

            ProductEnrichmentService.EnrichmentData enrichment =
                    enrichmentMap.get(ArticleNormalizationUtil.normalize(oem));
            applyEnrichment(item, enrichment);

            if (stockItem != null) {
                if (item.getCurrency() == null) {
                    item.setCurrency(stockItem.getCurrency());
                }
                if (item.getWarehouses() == null || item.getWarehouses().isEmpty()) {
                    item.setWarehouses(StockBulkResponse.toWarehouses(stockItem));
                }
                if (item.getPrice() == null && stockItem.getPrice() != null) {
                    item.setPrice(stockItem.getPrice());
                }
                if (item.getQuantity() == null) {
                    item.setQuantity(stockItem.getTotalQty());
                }
            }

            items.add(item);
        }

        if (!items.isEmpty()) {
            resp.setResults(items);
            return resp;
        }

        String normalizedQuery = ArticleNormalizationUtil.normalize(query);
        ProductEnrichmentService.EnrichmentData enrichment = enrichmentMap.get(normalizedQuery);
        StockBulkResponse.Item stockItem = stock.getByOem(query);

        if (enrichment != null || stockItem != null) {
            SearchResponse.Item item = new SearchResponse.Item();
            item.setOem(query);
            item.setCatalog("1C");
            item.setVehicleHints(Collections.emptyList());

            if (enrichment != null) {
                item.setName(enrichment.getName() != null ? enrichment.getName() : query);
                item.setBrand(enrichment.getBrand());
                item.setImageUrl(enrichment.getImageUrl());
            } else {
                item.setName(query);
            }

            if (stockItem != null) {
                item.setPrice(stockItem.getPrice());
                item.setCurrency(stockItem.getCurrency());
                item.setQuantity(stockItem.getTotalQty());
                item.setWarehouses(StockBulkResponse.toWarehouses(stockItem));
            }

            applyEnrichment(item, enrichment);

            if (stockItem != null) {
                if (item.getCurrency() == null) {
                    item.setCurrency(stockItem.getCurrency());
                }
                if (item.getWarehouses() == null || item.getWarehouses().isEmpty()) {
                    item.setWarehouses(StockBulkResponse.toWarehouses(stockItem));
                }
                if (item.getPrice() == null && stockItem.getPrice() != null) {
                    item.setPrice(stockItem.getPrice());
                }
                if (item.getQuantity() == null) {
                    item.setQuantity(stockItem.getTotalQty());
                }
            }

            resp.setResults(List.of(item));
            return resp;
        }

        resp.setResults(List.of());
        return resp;
    }

    public Optional<OemPartReferenceDto> findPartReferences(String oem, String catalog, String locale) {
        return cat.findPartReferences(oem, catalog, locale);
    }

    /**
     * Определяет, похоже ли значение на OEM номер детали
     */
    private boolean isLikelyOemNumber(String query) {
        // Если содержит пробелы - скорее всего текстовый поиск
        if (query.contains(" ")) {
            return false;
        }
        
        // Если слишком короткий - скорее всего не OEM
        if (query.length() < 5) {
            return false;
        }
        
        // Если слишком длинный - скорее всего текст
        if (query.length() > 25) {
            return false;
        }
        
        // Если это потенциальный VIN - не OEM
        if (query.length() == 17) {
            return false;
        }
        
        // Проверяем строгий паттерн OEM
        if (STRICT_OEM.matcher(query).matches()) {
            return true;
        }
        
        // Дополнительные эвристики:
        // - содержит и буквы и цифры
        boolean hasLetters = query.matches(".*[A-Z].*");
        boolean hasNumbers = query.matches(".*[0-9].*");
        
        return hasLetters && hasNumbers;
    }

    private StockBulkResponse getStock(List<String> oems) {
        try {
            return oneC.getStockByOemBulk(oems);
        } catch (Exception e) {
            // Если запрос остатков не удался, возвращаем пустой ответ
            return new StockBulkResponse();
        }
    }
    
}
