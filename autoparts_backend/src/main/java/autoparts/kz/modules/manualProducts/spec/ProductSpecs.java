package autoparts.kz.modules.manualProducts.spec;



import autoparts.kz.modules.manualProducts.entity.Product;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.Collection;

/**
 * Набор спецификаций для фильтрации Product.
 * Поля ориентированы на твою модель: name, description, brand, status, price, stock, category, inStock.
 * Если каких-то полей у тебя нет — см. комментарии ниже «Варианты под твою модель».
 */
public final class ProductSpecs {

    private ProductSpecs() {}

    /** Поиск по name/description/code/brand/externalCode */
    public static Specification<Product> search(String q) {
        return (root, query, cb) -> {
            if (q == null || q.isBlank()) return cb.conjunction();
            String like = "%" + q.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), like),
                    cb.like(cb.lower(root.get("description")), like),
                    cb.like(cb.lower(root.get("code")), like),
                    cb.like(cb.lower(root.get("brand")), like),
                    cb.like(cb.lower(root.get("externalCode")), like)
            );
        };
    }

    /** Фильтр по категориям (ManyToOne category -> id) */
    public static Specification<Product> categories(Collection<Long> categoryIds) {
        return (root, query, cb) -> {
            if (categoryIds == null || categoryIds.isEmpty()) return cb.conjunction();
            
            // Check direct category relationship
            var directCategory = root.get("category").get("id").in(categoryIds);
            
            // Also check for category information stored in properties
            // Join with properties and check if any property has subcategoryId matching our categoryIds
            var propertiesJoin = root.join("properties", jakarta.persistence.criteria.JoinType.LEFT);
            var propertyCategory = cb.and(
                propertiesJoin.get("propertyName").in("subcategoryId", "categoryId"),
                propertiesJoin.get("propertyValue").in(categoryIds.stream().map(String::valueOf).toArray(String[]::new))
            );
            
            // Return products that match either direct category or property-based category
            return cb.or(directCategory, propertyCategory);
        };
    }

    /** Фильтр по брендам */
    public static Specification<Product> brands(Collection<String> brands) {
        return (root, query, cb) -> {
            if (brands == null || brands.isEmpty()) return cb.conjunction();
            return root.get("brand").in(brands);
        };
    }

    /** Фильтр по статусам (String или Enum -> .name()) */
    public static Specification<Product> statuses(Collection<String> statuses) {
        return (root, query, cb) -> {
            if (statuses == null || statuses.isEmpty()) return cb.conjunction();
            return root.get("status").in(statuses);
        };
    }

    /** Цена от */
    public static Specification<Product> priceFrom(BigDecimal priceFrom) {
        return (root, query, cb) -> {
            if (priceFrom == null) return cb.conjunction();
            return cb.greaterThanOrEqualTo(root.get("price"), priceFrom);
        };
    }

    /** Цена до */
    public static Specification<Product> priceTo(BigDecimal priceTo) {
        return (root, query, cb) -> {
            if (priceTo == null) return cb.conjunction();
            return cb.lessThanOrEqualTo(root.get("price"), priceTo);
        };
    }

    /**
     * В наличии (если у тебя поле stock (Integer) — используем >0;
     * если есть булево поле inStock (Boolean) — см. альтернативу ниже)
     */
    public static Specification<Product> inStock(Boolean inStock) {
        return (root, query, cb) -> {
            if (inStock == null) return cb.conjunction();
            // Вариант А (через stock):
            // true  -> stock > 0
            // false -> stock = 0
            return inStock
                    ? cb.greaterThan(root.get("stock"), 0)
                    : cb.equal(root.get("stock"), 0);

            // Вариант Б (если у тебя есть поле Boolean inStock):
            // return cb.equal(root.get("inStock"), inStock);
        };
    }
}
