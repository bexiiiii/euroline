package autoparts.kz.modules.manualProducts.service;

import autoparts.kz.common.config.CacheConfig;
import autoparts.kz.modules.cml.service.ProductEnrichmentService;
import autoparts.kz.modules.manualProducts.dto.ProductQuery;
import autoparts.kz.modules.manualProducts.dto.ProductRequest;
import autoparts.kz.modules.manualProducts.dto.ProductResponse;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.manualProducts.entity.ProductProperty;
import autoparts.kz.modules.manualProducts.repository.ProductRepository;
import autoparts.kz.modules.manualProducts.spec.ProductSpecs;
import autoparts.kz.modules.order.orderStatus.OrderStatus;
import autoparts.kz.modules.order.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductEnrichmentService enrichmentService; // ✅ НОВЫЙ сервис для обогащения данными 1С
    private final OrderItemRepository orderItemRepository;

    public ProductResponse create(ProductRequest request) {
        Product product = new Product();
        product.setName(request.getName());
        product.setCode(request.getCode());
        product.setDescription(request.getDescription());
        product.setBrand(request.getBrand());
        product.setExternalCode(request.getExternalCode());
        product.setImageUrl(request.getImageUrl());

        List<ProductProperty> props = request.getProperties().stream().map(p -> {
            ProductProperty prop = new ProductProperty();
            prop.setPropertyName(p.getPropertyName());
            prop.setPropertyValue(p.getPropertyValue());
            prop.setProduct(product);
            return prop;
        }).toList();

        product.setProperties(props);
        Product saved = productRepository.save(product);
        return toResponse(saved);
    }

    public ProductResponse toResponsePublic(Product product) { return toResponseEnriched(product); }
    
    /**
     * Конвертирует Product в ProductResponse БЕЗ обогащения данными 1С.
     * Используется для внутренних операций.
     */
    private ProductResponse toResponse(Product product) {
        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        response.setName(product.getName());
        response.setCode(product.getCode());
        response.setDescription(product.getDescription());
        response.setBrand(product.getBrand());
        response.setExternalCode(product.getExternalCode());
        response.setImageUrl(product.getImageUrl());
        response.setWeekly(product.getIsWeekly());
        response.setWeeklyStartAt(product.getWeeklyStartAt());
        response.setWeeklyEndAt(product.getWeeklyEndAt());

        List<ProductResponse.PropertyDTO> props = product.getProperties().stream().map(p -> {
            ProductResponse.PropertyDTO dto = new ProductResponse.PropertyDTO();
            dto.setPropertyName(p.getPropertyName());
            dto.setPropertyValue(p.getPropertyValue());
            return dto;
        }).toList();

        response.setProperties(props);
        return response;
    }
    
    /**
     * ✅ НОВЫЙ МЕТОД: Конвертирует Product в ProductResponse С обогащением данными 1С.
     * Обогащает цены, остатки и склады из таблиц cml_products, cml_prices, cml_stocks.
     */
    private ProductResponse toResponseEnriched(Product product) {
        ProductResponse response = toResponse(product);
        
        // Обогащаем данными из 1С по артикулу
        try {
            enrichmentService.enrichByArticle(product.getCode()).ifPresent(enrichmentData -> {
                // Обновляем цену из cml_prices
                if (enrichmentData.getPrice() != null) {
                    response.setPrice(enrichmentData.getPrice().intValue());
                }
                
                // Обновляем остатки из cml_stocks  
                if (enrichmentData.getStock() != null) {
                    response.setStock(enrichmentData.getStock().intValue());
                }
                
                // ✅ НОВОЕ: Добавляем информацию о складах
                if (enrichmentData.getWarehouses() != null && !enrichmentData.getWarehouses().isEmpty()) {
                    List<ProductResponse.WarehouseDTO> warehouseDTOs = 
                        enrichmentData.getWarehouses().stream()
                            .map(w -> {
                                ProductResponse.WarehouseDTO dto = new ProductResponse.WarehouseDTO();
                                dto.setName(w.getWarehouseName());
                                dto.setQuantity(w.getQuantity().intValue());
                                return dto;
                            })
                            .toList();
                    response.setWarehouses(warehouseDTOs);
                }
                
                response.setSyncedWith1C(enrichmentData.isFoundInLocalDb());
                
                log.debug("✅ Enriched product {}: price={}, stock={}, warehouses={}", 
                    product.getCode(), enrichmentData.getPrice(), enrichmentData.getStock(), 
                    enrichmentData.getWarehouses() != null ? enrichmentData.getWarehouses().size() : 0);
            });
        } catch (Exception e) {
            log.error("❌ Failed to enrich product {}: {}", product.getCode(), e.getMessage());
            // Возвращаем базовый response без обогащения
        }
        
        return response;
    }
    
    /**
     * 🚀 OPTIMIZED: Массовое обогащение списка товаров данными из 1С.
     * Делает 2 запроса для всех товаров вместо N×3 запросов.
     * Используется для оптимизации списков и результатов поиска.
     */
    private List<ProductResponse> toResponseEnrichedBatch(List<Product> products) {
        if (products == null || products.isEmpty()) {
            return List.of();
        }
        
        // Шаг 1: Собираем все артикулы для batch enrichment
        List<String> articleNumbers = products.stream()
                .map(Product::getCode)
                .filter(code -> code != null && !code.trim().isEmpty())
                .toList();
        
        if (articleNumbers.isEmpty()) {
            // Если артикулов нет, возвращаем базовые responses
            return products.stream()
                    .map(this::toResponse)
                    .toList();
        }
        
        // Шаг 2: ⚡ Получаем данные обогащения ОДНИМ запросом (2 SQL queries вместо N×3)
        java.util.Map<String, ProductEnrichmentService.EnrichmentData> enrichmentMap = 
                enrichmentService.enrichBatch(articleNumbers);
        
        log.debug("🚀 Batch enriched {} products in 2 queries (instead of {}×3)", 
                  products.size(), products.size());
        
        // Шаг 3: Обогащаем каждый product данными из мапы
        return products.stream()
                .map(product -> {
                    ProductResponse response = toResponse(product);
                    
                    // Достаем enrichment data из мапы (O(1) вместо N запросов)
                    String articleKey = product.getCode() != null 
                            ? product.getCode().toLowerCase().trim() 
                            : null;
                    
                    if (articleKey != null) {
                        ProductEnrichmentService.EnrichmentData enrichmentData = 
                                enrichmentMap.get(articleKey);
                        
                        if (enrichmentData != null) {
                            // Обновляем цену
                            if (enrichmentData.getPrice() != null) {
                                response.setPrice(enrichmentData.getPrice().intValue());
                            }
                            
                            // Обновляем остатки
                            if (enrichmentData.getStock() != null) {
                                response.setStock(enrichmentData.getStock().intValue());
                            }
                            
                            // Добавляем информацию о складах
                            if (enrichmentData.getWarehouses() != null && !enrichmentData.getWarehouses().isEmpty()) {
                                List<ProductResponse.WarehouseDTO> warehouseDTOs = 
                                    enrichmentData.getWarehouses().stream()
                                        .map(w -> {
                                            ProductResponse.WarehouseDTO dto = new ProductResponse.WarehouseDTO();
                                            dto.setName(w.getWarehouseName());
                                            dto.setQuantity(w.getQuantity().intValue());
                                            return dto;
                                        })
                                        .toList();
                                response.setWarehouses(warehouseDTOs);
                            }
                            
                            response.setSyncedWith1C(enrichmentData.isFoundInLocalDb());
                        }
                    }
                    
                    return response;
                })
                .toList();
    }
    
    /**
     * 🚀 Helper: Конвертирует Page<Product> в Page<ProductResponse> с batch enrichment
     */
    private Page<ProductResponse> toPageEnrichedBatch(Page<Product> productPage) {
        if (productPage.isEmpty()) {
            return Page.empty(productPage.getPageable());
        }
        
        // Используем batch enrichment для всех товаров на странице
        List<ProductResponse> enrichedResponses = toResponseEnrichedBatch(productPage.getContent());
        
        // Создаем новую Page с обогащенными данными
        return new org.springframework.data.domain.PageImpl<>(
                enrichedResponses,
                productPage.getPageable(),
                productPage.getTotalElements()
        );
    }

    @Transactional(readOnly = true)
    @Deprecated // ⚠️ Не использовать! Загружает ВСЕ продукты в память. Используйте getAllPaginated()
    public List<ProductResponse> getAll() {
        log.warn("getAll() вызван - это неоптимально! Рекомендуется использовать getAllPaginated()");
        return productRepository.findAll(PageRequest.of(0, 1000)).stream() // Ограничиваем 1000 записями
                .map(this::toResponseEnriched) // ✅ Используем обогащенную версию
                .toList();
    }

    // ✅ ОПТИМИЗИРОВАННАЯ ВЕРСИЯ с пагинацией и кэшированием
    @Transactional(readOnly = true)
    // ⚠️ Кеширование Page объектов убрано - Jackson не может десериализовать PageImpl из Redis
    // Пагинированные запросы обычно быстрые благодаря индексам БД
    public Page<ProductResponse> getAllPaginated(int page, int size) {
        Page<Product> productPage = productRepository.findAll(PageRequest.of(page, size));
        
        // 🚀 OPTIMIZED: используем batch enrichment
        return toPageEnrichedBatch(productPage);
    }

    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(
        cacheNames = "products", 
        key = "'id_' + #id"
    )
    public ProductResponse getById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        ProductResponse response = toResponse(product);
        return toResponseEnriched(product);
    }

    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(
        cacheNames = "products", 
        key = "'code_' + #code"
    )
    public ProductResponse getByCode(String code) {
        return productRepository.findFirstByCodeIgnoreCase(code)
                .map(product -> {
                    ProductResponse response = toResponse(product);
                    return toResponseEnriched(product);
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    @org.springframework.cache.annotation.CacheEvict(cacheNames = "products", allEntries = true)
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        product.setName(request.getName());
        product.setCode(request.getCode());
        product.setDescription(request.getDescription());
        product.setBrand(request.getBrand());
        product.setExternalCode(request.getExternalCode());
        product.setImageUrl(request.getImageUrl());

        product.getProperties().clear();
        List<ProductProperty> props = request.getProperties().stream().map(p -> {
            ProductProperty prop = new ProductProperty();
            prop.setPropertyName(p.getPropertyName());
            prop.setPropertyValue(p.getPropertyValue());
            prop.setProduct(product);
            return prop;
        }).toList();
        product.getProperties().addAll(props);

        return toResponse(productRepository.save(product));
    }

    @org.springframework.cache.annotation.CacheEvict(cacheNames = "products", allEntries = true)
    public void delete(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        productRepository.delete(product);
    }

    public Product getEntityById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public Product save(Product p) { return productRepository.save(p); }

    @Cacheable(value = CacheConfig.PRODUCT_SEARCH_CACHE, key = "#query")
    @Transactional(readOnly = true)
    public List<ProductResponse> search(String query) {
        log.debug("🔍 Searching products with query: {} (cache miss)", query);
        List<Product> products = productRepository.searchByQuery(query);
        
        // 🚀 OPTIMIZED: используем batch enrichment (2 SQL queries вместо N×3)
        return toResponseEnrichedBatch(products);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> list(ProductQuery q, Pageable pageable) {
        // Create a new Specification instance instead of using the deprecated where() method
        Specification<Product> spec = Specification.allOf(
                ProductSpecs.search(q.q()),
                ProductSpecs.categories(q.categoryIds()),
                ProductSpecs.brands(q.brands()),
                ProductSpecs.statuses(q.statuses()),
                ProductSpecs.priceFrom(q.priceFrom()),
                ProductSpecs.priceTo(q.priceTo()),
                ProductSpecs.inStock(q.inStock())
        );

        Page<Product> productPage = productRepository.findAll(spec, pageable);
        
        // 🚀 OPTIMIZED: используем batch enrichment для всей страницы (2 queries вместо N×3)
        return toPageEnrichedBatch(productPage);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> listWeekly(Pageable pageable) {
        Page<Product> productPage = productRepository.findByIsWeeklyTrue(pageable);
        
        // 🚀 OPTIMIZED: используем batch enrichment
        return toPageEnrichedBatch(productPage);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> listWeeklyFiltered(
            String q,
            java.util.Set<String> brands,
            Boolean inStock,
            Integer priceFrom,
            Integer priceTo,
            Pageable pageable
    ) {
        java.time.Instant now = java.time.Instant.now();
        Specification<Product> weeklySpec = (root, query, cb) -> cb.or(
                cb.isTrue(root.get("isWeekly")),
                cb.and(
                        cb.isNotNull(root.get("weeklyStartAt")),
                        cb.isNotNull(root.get("weeklyEndAt")),
                        cb.lessThanOrEqualTo(root.get("weeklyStartAt"), now),
                        cb.greaterThanOrEqualTo(root.get("weeklyEndAt"), now)
                )
        );

        Specification<Product> spec = Specification.allOf(
                weeklySpec,
                ProductSpecs.search(q),
                ProductSpecs.brands(brands),
                ProductSpecs.inStock(inStock),
                // Локальные фильтры цены для Integer price
                (root, query, cb) -> {
                    if (priceFrom == null) return cb.conjunction();
                    return cb.greaterThanOrEqualTo(root.get("price"), priceFrom);
                },
                (root, query, cb) -> {
                    if (priceTo == null) return cb.conjunction();
                    return cb.lessThanOrEqualTo(root.get("price"), priceTo);
                }
        );

        Page<Product> productPage = productRepository.findAll(spec, pageable);
        
        // 🚀 OPTIMIZED: используем batch enrichment
        return toPageEnrichedBatch(productPage);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> listWeeklyAuto(
            java.util.Set<String> brands,
            Boolean inStock,
            Integer priceFrom,
            Integer priceTo,
            Pageable pageable
    ) {
        var zone = java.time.ZoneId.of("Asia/Almaty");
        var now = java.time.ZonedDateTime.now(zone);
        var startOfWeek = now.with(java.time.DayOfWeek.MONDAY).toLocalDate().atStartOfDay(zone).toLocalDateTime();
        var endExclusive = startOfWeek.plusDays(7); // next Monday start

        var statuses = java.util.List.of(OrderStatus.CONFIRMED.name());
        boolean brandsEmpty = brands == null || brands.isEmpty();

        var unsorted = org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        var top = orderItemRepository.findTopProductsForPeriod(
                startOfWeek, endExclusive, statuses,
                brands == null ? java.util.Set.of() : brands,
                brandsEmpty, inStock, priceFrom, priceTo,
                unsorted
        );

        long total = orderItemRepository.countTopProductsForPeriod(
                startOfWeek, endExclusive, statuses,
                brands == null ? java.util.Set.of() : brands,
                brandsEmpty, inStock, priceFrom, priceTo
        );

        java.util.List<Long> ids = top.stream().map(OrderItemRepository.TopProductProjection::getProductId).toList();
        java.util.Map<Long, Integer> orderMap = new java.util.HashMap<>();
        for (int i = 0; i < ids.size(); i++) orderMap.put(ids.get(i), i);

        java.util.List<Product> products = new java.util.ArrayList<>();
        if (!ids.isEmpty()) {
            var found = productRepository.findAllByIdWithProperties(ids);
            var prodMap = new java.util.HashMap<Long, Product>();
            for (var p : found) prodMap.put(p.getId(), p);
            // rebuild list in ranking order without sorting immutables
            for (Long id : ids) {
                var p = prodMap.get(id);
                if (p != null) products.add(p);
            }
        }

        // 🚀 OPTIMIZED: используем batch enrichment
        var responses = toResponseEnrichedBatch(products);

        return new org.springframework.data.domain.PageImpl<>(responses, unsorted, total);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> listWeeklyHybrid(
            String q,
            java.util.Set<String> brands,
            Boolean inStock,
            Integer priceFrom,
            Integer priceTo,
            Pageable pageable
    ) {
        // 1) Основной — авто топ за неделю
        Page<ProductResponse> auto = listWeeklyAuto(brands, inStock, priceFrom, priceTo, pageable);
        if (auto.getContent().size() >= pageable.getPageSize()) return auto;

        // 2) Добрать ручными weekly (активными сейчас), исключая уже попавшие
        java.util.Set<Long> excludeIds = new java.util.HashSet<>();
        auto.getContent().forEach(p -> excludeIds.add(p.getId()));

        java.time.Instant now = java.time.Instant.now();
        Specification<Product> weeklySpec = (root, query, cb) -> cb.or(
                cb.isTrue(root.get("isWeekly")),
                cb.and(
                        cb.isNotNull(root.get("weeklyStartAt")),
                        cb.isNotNull(root.get("weeklyEndAt")),
                        cb.lessThanOrEqualTo(root.get("weeklyStartAt"), now),
                        cb.greaterThanOrEqualTo(root.get("weeklyEndAt"), now)
                )
        );
        Specification<Product> exclude = (root, query, cb) -> excludeIds.isEmpty()
                ? cb.conjunction()
                : cb.not(root.get("id").in(excludeIds));
        Specification<Product> spec = Specification.allOf(
                weeklySpec,
                exclude,
                ProductSpecs.search(q),
                ProductSpecs.brands(brands),
                ProductSpecs.inStock(inStock),
                (root, query, cb) -> priceFrom == null ? cb.conjunction() : cb.greaterThanOrEqualTo(root.get("price"), priceFrom),
                (root, query, cb) -> priceTo == null ? cb.conjunction() : cb.lessThanOrEqualTo(root.get("price"), priceTo)
        );

        int need = pageable.getPageSize() - auto.getContent().size();
        Page<Product> fillerPage = productRepository.findAll(spec, org.springframework.data.domain.PageRequest.of(0, need));
        
        // 🚀 OPTIMIZED: используем batch enrichment
        Page<ProductResponse> fillerPageEnriched = toPageEnrichedBatch(fillerPage);
        var filler = fillerPageEnriched.getContent();

        var merged = new java.util.ArrayList<ProductResponse>(auto.getContent());
        merged.addAll(filler);

        // total оставим равным авто-топу (для простой и предсказуемой пагинации)
        return new org.springframework.data.domain.PageImpl<>(merged, pageable, auto.getTotalElements());
    }

    /**
     * 🚀 Быстрая статистика по товарам через SQL-агрегацию
     */
    @Transactional(readOnly = true)
    public autoparts.kz.modules.manualProducts.dto.ProductStatsResponse getStats() {
        long totalProducts = productRepository.count();
        long inStock = productRepository.countByStockGreaterThan(0);
        long outOfStock = totalProducts - inStock;
        long syncedWith1C = productRepository.countByExternalCodeIsNotNull();
        
        return new autoparts.kz.modules.manualProducts.dto.ProductStatsResponse(
            totalProducts,
            inStock,
            outOfStock,
            syncedWith1C
        );
    }
}
