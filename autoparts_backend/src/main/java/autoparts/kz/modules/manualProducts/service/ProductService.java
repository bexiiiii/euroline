package autoparts.kz.modules.manualProducts.service;

import autoparts.kz.modules.manualProducts.dto.ProductQuery;
import autoparts.kz.modules.manualProducts.dto.ProductRequest;
import autoparts.kz.modules.manualProducts.dto.ProductResponse;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.manualProducts.entity.ProductProperty;
import autoparts.kz.modules.manualProducts.repository.ProductRepository;
import autoparts.kz.modules.manualProducts.spec.ProductSpecs;
import autoparts.kz.modules.order.orderStatus.OrderStatus;
import autoparts.kz.modules.order.repository.OrderItemRepository;
import autoparts.kz.modules.stockOneC.service.OneCService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final OneCService oneCService;
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

    public ProductResponse toResponsePublic(Product product) { return toResponse(product); }
    
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

    @Transactional(readOnly = true)
    @Deprecated // ⚠️ Не использовать! Загружает ВСЕ продукты в память. Используйте getAllPaginated()
    public List<ProductResponse> getAll() {
        log.warn("getAll() вызван - это неоптимально! Рекомендуется использовать getAllPaginated()");
        return productRepository.findAll(PageRequest.of(0, 1000)).stream() // Ограничиваем 1000 записями
                .map(this::toResponse)
                .map(p -> oneCService.enrichWithOneCData(p).orElse(p))
                .toList();
    }

    // ✅ ОПТИМИЗИРОВАННАЯ ВЕРСИЯ с пагинацией и кэшированием
    @Transactional(readOnly = true)
    // ⚠️ Кеширование Page объектов убрано - Jackson не может десериализовать PageImpl из Redis
    // Пагинированные запросы обычно быстрые благодаря индексам БД
    public Page<ProductResponse> getAllPaginated(int page, int size) {
        return productRepository.findAll(PageRequest.of(page, size))
                .map(this::toResponse)
                .map(p -> oneCService.enrichWithOneCData(p).orElse(p));
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
        return oneCService.enrichWithOneCData(response).orElse(response);
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
                    return oneCService.enrichWithOneCData(response).orElse(response);
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

    @Transactional(readOnly = true)
    public List<ProductResponse> search(String query) {
        List<Product> products = productRepository.searchByQuery(query);
        return products.stream()
                .map(this::toResponse)
                .map(p -> oneCService.enrichWithOneCData(p).orElse(p))
                .toList();
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

        return productRepository.findAll(spec, pageable)
                .map(this::toResponse)
                .map(p -> oneCService.enrichWithOneCData(p).orElse(p));
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> listWeekly(Pageable pageable) {
        return productRepository.findByIsWeeklyTrue(pageable)
                .map(this::toResponse)
                .map(p -> oneCService.enrichWithOneCData(p).orElse(p));
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

        return productRepository.findAll(spec, pageable)
                .map(this::toResponse)
                .map(p -> oneCService.enrichWithOneCData(p).orElse(p));
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

        var responses = products.stream()
                .map(this::toResponse)
                .map(p -> oneCService.enrichWithOneCData(p).orElse(p))
                .toList();

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
        var filler = productRepository.findAll(spec, org.springframework.data.domain.PageRequest.of(0, need))
                .map(this::toResponse)
                .map(p -> oneCService.enrichWithOneCData(p).orElse(p))
                .getContent();

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
