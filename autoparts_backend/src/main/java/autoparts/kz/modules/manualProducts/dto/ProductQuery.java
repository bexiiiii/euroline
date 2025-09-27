package autoparts.kz.modules.manualProducts.dto;


import java.math.BigDecimal;
import java.util.Set;

public record ProductQuery(
        String q,
        Set<Long> categoryIds,
        Set<String> brands,
        Set<String> statuses,
        BigDecimal priceFrom,
        BigDecimal priceTo,
        Boolean inStock
) {}
