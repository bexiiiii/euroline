package autoparts.kz.modules.mainSearch.service;

import autoparts.kz.modules.cml.dto.WarehouseStockDTO;
import autoparts.kz.modules.cml.service.ProductEnrichmentService;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.manualProducts.repository.ProductRepository;
import autoparts.kz.modules.mainSearch.dto.SearchResponse;
import autoparts.kz.modules.stockOneC.dto.StockBulkResponse;
import autoparts.kz.modules.vinLaximo.dto.DetailDto;
import autoparts.kz.modules.vinLaximo.dto.VehicleDto;
import autoparts.kz.modules.vinLaximo.service.CatService;
import autoparts.kz.modules.vinLaximo.dto.OemPartReferenceDto;
import autoparts.kz.modules.stockOneC.client.OneCClient;
import autoparts.kz.integration.umapi.dto.BrandRefinementDto;
import autoparts.kz.integration.umapi.dto.AnalogDto;
import autoparts.kz.integration.umapi.service.UmapiIntegrationService;
import autoparts.kz.integration.umapi.service.AutomaticAnalogService;
import autoparts.kz.common.util.ArticleNormalizationUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;

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
    private final ProductRepository productRepository;
    private final JdbcTemplate jdbcTemplate;
    private final AutomaticAnalogService automaticAnalogs;

    // VIN - точно 17 символов, без букв I, O, Q (расширенный паттерн)
    private static final Pattern VIN = Pattern.compile("^[A-HJ-NPR-Z0-9]{17}$", Pattern.CASE_INSENSITIVE);
    
    // VIN, которых нет в Laximo: не повторяем платный запрос в течение TTL
    private static final long VIN_MISS_TTL_MS = 6 * 60 * 60 * 1000L;
    private final java.util.concurrent.ConcurrentHashMap<String, Long> vinMisses = new java.util.concurrent.ConcurrentHashMap<>();

    // Дополнительная проверка для потенциальных VIN (более мягкая)
    private static final Pattern POTENTIAL_VIN = Pattern.compile("^[A-Z0-9]{17}$", Pattern.CASE_INSENSITIVE);
    
    // FRAME - должен содержать дефис и быть в формате: 2-4 буквы, дефис, номер
private static final Pattern FRAME = Pattern.compile("^[A-Z]{2,4}-[0-9A-Z]{6,}$", Pattern.CASE_INSENSITIVE);

// Более строгий паттерн для OEM - без пробелов, минимум 5 символов
private static final Pattern STRICT_OEM = Pattern.compile("^[A-Z0-9\\-\\.\\/]{5,25}$", Pattern.CASE_INSENSITIVE);
// Cross-references are requested only after identifying a single article + brand.
    public SearchResponse search(String q, String catalog) {
        return search(q, catalog, null);
    }

    public SearchResponse search(String q, String catalog, String brand) {
        if (q == null || q.isBlank() || q.length() > 200) {
            throw new IllegalArgumentException("Введите запрос длиной от 1 до 200 символов");
        }
        String query = q.trim().toUpperCase(Locale.ROOT);
        SearchResponse resp = new SearchResponse();
        resp.setQuery(query);

        if (brand != null && !brand.isBlank()) {
            if (brand.length() > 100) throw new IllegalArgumentException("Слишком длинное название бренда");
            resp.setDetectedType(SearchResponse.DetectedType.OEM);
            return searchByOem(ArticleNormalizationUtil.normalize(query), resp, brand.trim(), query);
        }

        // 1. VIN - точно 17 символов без пробелов (расширенная проверка)
        if (query.length() == 17) {
            boolean isStrictVin = VIN.matcher(query).matches();
            boolean isPotentialVin = POTENTIAL_VIN.matcher(query).matches();
            
            if (isStrictVin || isPotentialVin) {
                // VIN-запрос не должен уходить в полнотекстовый поиск Laximo (10 команд на запрос),
                // а повторный поиск ненайденного VIN не должен снова тратить лимит.
                resp.setDetectedType(SearchResponse.DetectedType.VIN);
                resp.setResults(List.of());
                Long missUntil = vinMisses.get(query + "::" + catalog);
                if (missUntil != null && missUntil > System.currentTimeMillis()) {
                    return resp;
                }
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
                    System.out.println("VIN search failed for: " + query + " - " + e.getMessage());
                    if (e instanceof jakarta.persistence.EntityNotFoundException) {
                        vinMisses.put(query + "::" + catalog, System.currentTimeMillis() + VIN_MISS_TTL_MS);
                    }
                    return resp;
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

        

        // A spaced numeric article is still an article, not a full-text query.
        if (query.matches("[0-9][0-9 .-]+") && query.replaceAll("[^0-9]", "").length() >= 5) {
            resp.setDetectedType(SearchResponse.DetectedType.OEM);
            return searchByOem(ArticleNormalizationUtil.normalize(query), resp, null, query);
        }
        boolean looksLikeOem = isLikelyOemNumber(query);
        resp.setDetectedType(looksLikeOem ? SearchResponse.DetectedType.OEM
                                          : SearchResponse.DetectedType.TEXT);

        if (looksLikeOem) {
            return searchByOem(query, resp, null, null);
        }

        // "WABCO 4410329212", "4410329212 WABCO", "WABCO 441 032 92 12": бренд + артикул.
        // Explicit brand selects a part; it must never just reorder unrelated matches.
        BrandArticle brandArticle = splitBrandAndArticle(query);
        if (brandArticle != null) {
            resp.setDetectedType(SearchResponse.DetectedType.OEM);
            return searchByOem(brandArticle.article(), resp, brandArticle.brand(), query);
        }

        // Без выбранного каталога полнотекст Laximo уходит пачкой команд по всем каталогам
        // (каждая списывается с лимита) и отвечает E_INVALIDPARAMETER — ищем только по своей базе.
        if (catalog == null || catalog.isBlank()) {
            resp.setResults(localProductResults(query));
            return resp;
        }

        List<DetailDto> found;
        try {
            found = cat.searchDetails(query, catalog);
        } catch (Exception e) {
            System.out.println("[SEARCH] fulltext failed: " + e.getMessage());
            // The local 1C catalogue must remain searchable when Laximo has no
            // full-text match or is temporarily unavailable.
            resp.setResults(localProductResults(query));
            return resp;
        }
        if (found == null || found.isEmpty()) {
            resp.setResults(localProductResults(query));
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

        if (enrichment.isOneCProduct()) {
            preferLocalName(item, enrichment.getName());
        } else if ((item.getName() == null || item.getName().isBlank()) && enrichment.getName() != null) {
            item.setName(enrichment.getName());
        }
        if ((item.getBrand() == null || item.getBrand().isBlank()) && enrichment.getBrand() != null) {
            item.setBrand(enrichment.getBrand());
        }
        if (item.getImageUrl() == null && enrichment.getImageUrl() != null) {
            item.setImageUrl(enrichment.getImageUrl());
        }
        // Данные из вебхука 1С (onec_prices / onec_stocks) приоритетнее ответа bridge-запроса остатков.
        boolean preferEnrichment = enrichment.isFromOneCEvents();
        if ((preferEnrichment || item.getPrice() == null) && enrichment.getPrice() != null) {
            item.setPrice(BigDecimal.valueOf(enrichment.getPrice()));
            if (item.getCurrency() == null) {
                item.setCurrency("KZT");
            }
        }
        if ((preferEnrichment || item.getQuantity() == null) && enrichment.getStock() != null) {
            item.setQuantity(enrichment.getStock());
        }
        if ((preferEnrichment || item.getWarehouses() == null || item.getWarehouses().isEmpty())
                && enrichment.getWarehouses() != null && !enrichment.getWarehouses().isEmpty()) {
            item.setWarehouses(convertWarehouses(enrichment.getWarehouses()));
        }
    }

    /**
     * Товар из 1С показываем под нашим названием; название каталога (UMAPI) остаётся в catalogName,
     * если оно есть и отличается.
     */
    static void preferLocalName(SearchResponse.Item item, String localName) {
        if (localName == null || localName.isBlank()) return;
        String external = item.getName();
        String local = localName.trim();
        if (external != null && !external.isBlank() && !external.trim().equalsIgnoreCase(local)
                && !external.trim().equalsIgnoreCase(item.getOem())) {
            item.setCatalogName(external.trim());
        }
        item.setName(local);
    }

    private List<SearchResponse.Warehouse> convertWarehouses(List<WarehouseStockDTO> warehouses) {
        if (warehouses == null || warehouses.isEmpty()) {
            return List.of();
        }
        List<SearchResponse.Warehouse> result = new ArrayList<>(warehouses.size());
        for (WarehouseStockDTO warehouse : warehouses) {
            SearchResponse.Warehouse dto = new SearchResponse.Warehouse();
            dto.setRefKey(warehouse.getWarehouseGuid());
            dto.setCode(warehouse.getWarehouseCode() != null ? warehouse.getWarehouseCode() : warehouse.getWarehouseGuid());
            dto.setName(
                    warehouse.getWarehouseName() != null ? warehouse.getWarehouseName() : warehouse.getWarehouseGuid());
            dto.setAddress(null);
            dto.setQty(warehouse.getQuantity() != null ? warehouse.getQuantity().intValue() : null);
            result.add(dto);
        }
        return result;
    }

    /**
     * @param brandHint     бренд из запроса "БРЕНД АРТИКУЛ" (null для чистого артикула)
     * @param originalQuery полный запрос пользователя, для поиска по своей базе, если по артикулу ничего нет
     */
    private SearchResponse searchByOem(String query, SearchResponse resp, String brandHint, String originalQuery) {
        String article = ArticleNormalizationUtil.normalize(query);
        Map<String, SearchResponse.Item> candidates = new LinkedHashMap<>();
        try {
            List<BrandRefinementDto> matches = umapiService.searchByArticle(article);
            if (matches != null) for (BrandRefinementDto match : matches) {
                if (match.getBrand() == null || match.getBrand().isBlank()) continue;
                String number = match.getArticle() == null ? match.getArticleSearch() : match.getArticle();
                if (!article.equals(ArticleNormalizationUtil.normalize(number))) continue;
                SearchResponse.Item item = catalogItem(number, match.getBrand(), match.getTitle(), match.getImg(), "UMAPI");
                candidates.putIfAbsent(partKey(number, match.getBrand()), item);
            }
        } catch (Exception e) {
            log.warn("Article catalogue unavailable for {}", article);
            resp.getWarnings().add("Каталог временно недоступен. Показаны только доступные локальные данные.");
        }

        // Match normalized SKU/code AND brand. Never borrow availability from another manufacturer.
        List<Product> local = productRepository.findAllByNormalizedArticleIn(List.of(article.toLowerCase(Locale.ROOT)));
        for (Product product : local) {
            if (!matchesLocalArticle(product, article)) continue;
            String productBrand = localProductBrand(product);
            if (productBrand == null || productBrand.isBlank()) continue;
            candidates.putIfAbsent(partKey(article, productBrand),
                    catalogItem(article, productBrand, product.getName(), product.getImageUrl(), "LOCAL_1C"));
        }

        List<SearchResponse.Item> selected = candidates.values().stream()
                .filter(item -> brandHint == null || brandMatchesHint(item.getBrand(), brandHint))
                .toList();
        if (selected.size() != 1) {
            resp.setSelectionRequired(!candidates.isEmpty());
            if (brandHint != null && selected.isEmpty()) {
                resp.getWarnings().add("Указанный бренд не найден. Выберите деталь из доступных вариантов.");
            }
            List<SearchResponse.Item> choices = new ArrayList<>(
                    selected.isEmpty() ? candidates.values() : selected);
            enrichIdentifiedParts(choices, local, resp);
            resp.setResults(choices);
            return resp;
        }

        SearchResponse.Item primary = selected.get(0);
        resp.setSelectedArticle(primary.getOem());
        resp.setSelectedBrand(primary.getBrand());
        Map<String, SearchResponse.Item> items = new LinkedHashMap<>();
        items.put(partKey(primary.getOem(), primary.getBrand()), primary);
        var automatic = automaticAnalogs.lookup(article, primary.getBrand());
        if (automatic != null) {
            resp.setAnalogsLoading(automatic.loading());
            if (automatic.partial()) resp.getWarnings().add("Часть замен по OE пока недоступна. Повторите поиск позже.");
            for (var match : automatic.matches()) {
                SearchResponse.Item item = catalogItem(match.article(), match.brand(), match.name(), match.imageUrl(), "UMAPI_ANALOG");
                item.setAnalogSource("UMAPI_SHARED_OE");
                item.setCompatibilityStatus("UNVERIFIED");
                item.setOeNumbers(match.oeReferences());
                items.putIfAbsent(partKey(match.article(), match.brand()), item);
            }
        }
        try {
            List<AnalogDto> analogs = umapiService.getAnalogs(article, primary.getBrand());
            if (analogs != null) for (AnalogDto analog : analogs) {
                String number = analog.getArticle() == null ? analog.getArticleSearch() : analog.getArticle();
                if (number == null || number.isBlank() || analog.getBrand() == null || analog.getBrand().isBlank()) continue;
                SearchResponse.Item item = catalogItem(number, analog.getBrand(), analog.getTitle(), analog.getImg(), "UMAPI_ANALOG");
                // Supplier cross-reference is not a technical guarantee of interchangeability.
                item.setAnalogSource("UMAPI");
                item.setCompatibilityStatus("UNVERIFIED");
                items.putIfAbsent(partKey(number, analog.getBrand()), item);
            }
        } catch (Exception e) {
            log.warn("Analog catalogue unavailable for {} / {}", primary.getBrand(), article);
            resp.getWarnings().add("Не удалось загрузить возможные замены. Повторите поиск позже.");
        }

        List<String> codes = items.values().stream().map(SearchResponse.Item::getOem)
                .map(ArticleNormalizationUtil::normalize).map(s -> s.toLowerCase(Locale.ROOT)).distinct().toList();
        List<Product> products = productRepository.findAllByNormalizedArticleIn(codes);
        List<SearchResponse.Item> results = new ArrayList<>(items.values());
        enrichIdentifiedParts(results, products, resp);
        resp.setResults(results);
        return resp;
    }

    static String partKey(String article, String brand) {
        return ArticleNormalizationUtil.normalize(article) + "|" + brandKey(brand);
    }

    private static String brandKey(String brand) {
        // Deliberately conservative: punctuation is not proof that brands are aliases.
        return brand == null ? "" : brand.trim().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT);
    }

    private SearchResponse.Item catalogItem(String article, String brand, String name, String image, String catalog) {
        SearchResponse.Item item = new SearchResponse.Item();
        item.setOem(article);
        item.setBrand(brand);
        item.setName(name == null || name.isBlank() ? article : name);
        item.setImageUrl(image);
        item.setCatalog(catalog);
        item.setVehicleHints(List.of());
        return item;
    }

    private void enrichIdentifiedParts(List<SearchResponse.Item> items, List<Product> products, SearchResponse resp) {
        Map<Long, ProductEnrichmentService.EnrichmentData> enriched = productEnrichmentService.enrichProducts(products);
        List<SearchResponse.Warehouse> knownWarehouses = products.isEmpty() ? List.of() : knownWarehouses();
        for (SearchResponse.Item item : items) {
            String article = ArticleNormalizationUtil.normalize(item.getOem());
            List<Product> matches = products.stream().filter(p -> matchesLocalArticle(p, article))
                    .filter(p -> brandMatchesHint(localProductBrand(p), item.getBrand()))
                    .toList();
            // A legacy cart placeholder must not shadow the authoritative 1C product.
            List<Product> onec = matches.stream().filter(p -> p.getOneCRefKey() != null && !p.getOneCRefKey().isBlank()).toList();
            if (!onec.isEmpty()) matches = onec;
            if (matches.size() == 1) {
                Product product = matches.get(0);
                item.setProductId(product.getId());
                item.setOnecRefKey(product.getOneCRefKey());
                applyEnrichment(item, enriched.get(product.getId()));
                if (item.getWarehouses() == null || item.getWarehouses().isEmpty()) {
                    item.setWarehouses(copyWarehousesWithUnknownQuantity(knownWarehouses));
                }
            } else if (matches.size() > 1) {
                String warning = "Для части товаров найдено несколько локальных соответствий. Цена и остаток требуют уточнения.";
                if (!resp.getWarnings().contains(warning)) resp.getWarnings().add(warning);
            }
        }
    }

    record BrandArticle(String brand, String article) {}

    // Compatibility for existing 1C imports: only a leading "BRAND ARTICLE" pair,
    // never arbitrary numbers in the description. Explicit SKU always takes precedence.
    static String legacyNameArticle(Product product) {
        if (product.getSku() != null && !product.getSku().isBlank()) return "";
        if (!"1C".equalsIgnoreCase(product.getBrand()) || product.getName() == null) return "";
        String[] words = product.getName().trim().split("\\s+", 3);
        if (words.length < 2 || !words[0].matches("[A-Za-z][A-Za-z0-9-]*")
                || !words[1].matches("[A-Za-z0-9./-]{5,25}")
                || words[1].chars().noneMatch(Character::isDigit)) return "";
        return ArticleNormalizationUtil.normalize(words[1]);
    }

    private boolean matchesLocalArticle(Product product, String article) {
        return article.equals(ArticleNormalizationUtil.normalize(product.getSku()))
                || article.equals(ArticleNormalizationUtil.normalize(product.getCode()))
                || article.equals(legacyNameArticle(product));
    }

    /**
     * Разбирает запрос "бренд + артикул". Слова без цифр — бренд (до 3 слов), слова с цифрами
     * склеиваются в артикул. Null, если запрос на это не похож.
     */
    static BrandArticle splitBrandAndArticle(String query) {
        String[] tokens = query.trim().split("\\s+");
        if (tokens.length < 2) {
            return null;
        }
        List<String> brandTokens = new ArrayList<>();
        StringBuilder article = new StringBuilder();
        for (String token : tokens) {
            if (token.chars().anyMatch(Character::isDigit)) {
                article.append(token);
            } else {
                brandTokens.add(token);
            }
        }
        if (brandTokens.isEmpty() || brandTokens.size() > 3 || article.length() == 0) {
            return null;
        }
        String articleValue = article.toString();
        if (!STRICT_OEM.matcher(articleValue).matches() || articleValue.length() == 17) {
            return null;
        }
        return new BrandArticle(String.join(" ", brandTokens), articleValue);
    }

    static boolean brandMatchesHint(String brand, String hint) {
        if (brand == null || hint == null) {
            return false;
        }
        return brandKey(brand).equals(brandKey(hint));
    }

    private List<SearchResponse.Item> localProductResults(String query) {
        List<SearchResponse.Warehouse> knownWarehouses = knownWarehouses();
        List<Product> products = productRepository.searchByQuery(query);
        Map<Long, ProductEnrichmentService.EnrichmentData> enrichments = productEnrichmentService.enrichProducts(products);
        return products.stream()
                .limit(20)
                .map(product -> toLocalProductItem(product, enrichments.get(product.getId()), knownWarehouses))
                .toList();
    }

    private SearchResponse.Item toLocalProductItem(
            Product product,
            ProductEnrichmentService.EnrichmentData enrichment,
            List<SearchResponse.Warehouse> knownWarehouses
    ) {
        SearchResponse.Item item = new SearchResponse.Item();
        item.setProductId(product.getId());
        item.setOnecRefKey(product.getOneCRefKey());
        item.setOem(product.getSku() == null || product.getSku().isBlank() ? product.getCode() : product.getSku());
        item.setName(product.getName());
        item.setBrand(localProductBrand(product));
        item.setCatalog("LOCAL_1C");
        item.setImageUrl(product.getImageUrl());
        item.setPrice(product.getPrice() == null ? null : BigDecimal.valueOf(product.getPrice()));
        item.setCurrency(product.getPrice() == null ? null : "KZT");
        item.setQuantity(product.getStock());
        applyEnrichment(item, enrichment);
        // Витрина должна показывать, на каких складах товар может находиться,
        // даже если для него ещё не пришёл stock.updated или остаток равен нулю.
        if (item.getWarehouses() == null || item.getWarehouses().isEmpty()) {
            item.setWarehouses(copyWarehousesWithUnknownQuantity(knownWarehouses));
        }
        item.setVehicleHints(Collections.emptyList());
        return item;
    }

    private String localProductBrand(Product product) {
        if (product.getBrand() != null && !product.getBrand().isBlank()
                && !"1C".equalsIgnoreCase(product.getBrand())) {
            return product.getBrand().trim();
        }
        if (product.getName() == null || product.getName().isBlank()) {
            return null;
        }
        String[] words = product.getName().trim().split("\\s+", 2);
        return words.length == 0 || words[0].isBlank() ? null : words[0];
    }

    private List<SearchResponse.Warehouse> knownWarehouses() {
        try {
            return jdbcTemplate.query(
                    "SELECT ref_key, name, code FROM onec_warehouses " +
                            "WHERE deletion_mark = false ORDER BY name, ref_key",
                    (rs, rowNum) -> {
                        SearchResponse.Warehouse warehouse = new SearchResponse.Warehouse();
                        warehouse.setRefKey(rs.getString("ref_key"));
                        warehouse.setCode(rs.getString("code") != null ? rs.getString("code") : rs.getString("ref_key"));
                        warehouse.setName(rs.getString("name"));
                        warehouse.setQty(null);
                        return warehouse;
                    }
            );
        } catch (Exception exception) {
            log.warn("Cannot load 1C warehouses for local search results: {}", exception.getMessage());
            return List.of();
        }
    }

    private List<SearchResponse.Warehouse> copyWarehousesWithUnknownQuantity(List<SearchResponse.Warehouse> warehouses) {
        if (warehouses == null || warehouses.isEmpty()) {
            return List.of();
        }
        return warehouses.stream().map(source -> {
            SearchResponse.Warehouse warehouse = new SearchResponse.Warehouse();
            warehouse.setRefKey(source.getRefKey());
            warehouse.setCode(source.getCode());
            warehouse.setName(source.getName());
            warehouse.setAddress(source.getAddress());
            warehouse.setQty(null);
            return warehouse;
        }).toList();
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
