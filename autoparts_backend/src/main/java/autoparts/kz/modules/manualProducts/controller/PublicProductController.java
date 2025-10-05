package autoparts.kz.modules.manualProducts.controller;

import autoparts.kz.modules.manualProducts.dto.ProductResponse;
import autoparts.kz.modules.manualProducts.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class PublicProductController {

    private final ProductService productService;
    private final autoparts.kz.modules.admin.categories.service.AdminCategoryService categoryService;

    @GetMapping
    public Page<ProductResponse> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) java.util.Set<Long> categoryIds,
            @RequestParam(required = false) java.util.Set<String> brands,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) java.math.BigDecimal priceFrom,
            @RequestParam(required = false) java.math.BigDecimal priceTo,
            @RequestParam(required = false, defaultValue = "id,desc") String sort
    ) {
        String[] sortParts = sort.split(",");
        var sortProp = sortParts.length > 0 ? sortParts[0] : "id";
        var sortDir = (sortParts.length > 1 ? sortParts[1] : "desc").equalsIgnoreCase("asc")
                ? org.springframework.data.domain.Sort.Direction.ASC
                : org.springframework.data.domain.Sort.Direction.DESC;

        var pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by(sortDir, sortProp));
        
        var query = new autoparts.kz.modules.manualProducts.dto.ProductQuery(
                q, categoryIds, brands, null, priceFrom, priceTo, inStock
        );
        
        return productService.list(query, pageable);
    }

    @GetMapping("/weekly")
    public Page<ProductResponse> weekly(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) java.util.Set<String> brands,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) Integer priceFrom,
            @RequestParam(required = false) Integer priceTo,
            @RequestParam(required = false, defaultValue = "id,desc") String sort,
            @RequestParam(required = false, defaultValue = "hybrid") String mode
    ) {
        String[] sortParts = sort.split(",");
        var sortProp = sortParts.length > 0 ? sortParts[0] : "id";
        var sortDir = (sortParts.length > 1 ? sortParts[1] : "desc").equalsIgnoreCase("asc")
                ? org.springframework.data.domain.Sort.Direction.ASC
                : org.springframework.data.domain.Sort.Direction.DESC;

        var pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by(sortDir, sortProp));

        return switch (mode.toLowerCase()) {
            case "auto" -> productService.listWeeklyAuto(brands, inStock, priceFrom, priceTo, pageable);
            case "curated" -> productService.listWeeklyFiltered(q, brands, inStock, priceFrom, priceTo, pageable);
            default -> productService.listWeeklyHybrid(q, brands, inStock, priceFrom, priceTo, pageable);
        };
    }

    @GetMapping("/by-category/{categoryId}")
    public Page<ProductResponse> getProductsByCategory(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) java.util.Set<String> brands,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) java.math.BigDecimal priceFrom,
            @RequestParam(required = false) java.math.BigDecimal priceTo,
            @RequestParam(required = false, defaultValue = "id,desc") String sort
    ) {
        String[] sortParts = sort.split(",");
        var sortProp = sortParts.length > 0 ? sortParts[0] : "id";
        var sortDir = (sortParts.length > 1 ? sortParts[1] : "desc").equalsIgnoreCase("asc")
                ? org.springframework.data.domain.Sort.Direction.ASC
                : org.springframework.data.domain.Sort.Direction.DESC;

        var pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by(sortDir, sortProp));
        
        // Get all category IDs (main category + all its subcategories)
        java.util.Set<Long> allCategoryIds = new java.util.HashSet<>();
        allCategoryIds.add(categoryId);
        
        try {
            // Get category tree and collect all subcategory IDs
            var categoryTree = categoryService.tree();
            collectSubcategoryIds(categoryTree, categoryId, allCategoryIds);
        } catch (Exception e) {
            // If category service fails, just use the main category ID
        }
        
        var query = new autoparts.kz.modules.manualProducts.dto.ProductQuery(
                q, allCategoryIds, brands, null, priceFrom, priceTo, inStock
        );
        
        return productService.list(query, pageable);
    }

    @GetMapping("/{identifier}")
    public ProductResponse getProduct(@PathVariable String identifier) {
        try {
            long id = Long.parseLong(identifier);
            return productService.getById(id);
        } catch (NumberFormatException ex) {
            return productService.getByCode(identifier);
        }
    }
    
    private void collectSubcategoryIds(java.util.List<autoparts.kz.modules.admin.categories.dto.AdminCategoryDto> categories, 
                                      Long targetCategoryId, 
                                      java.util.Set<Long> allCategoryIds) {
        for (var category : categories) {
            if (category.getId().equals(targetCategoryId)) {
                // Found target category, collect all its subcategory IDs
                collectAllSubcategoryIds(category, allCategoryIds);
                return;
            }
            // Recursively search in subcategories
            if (category.getSubcategories() != null && !category.getSubcategories().isEmpty()) {
                collectSubcategoryIds(category.getSubcategories(), targetCategoryId, allCategoryIds);
            }
        }
    }
    
    private void collectAllSubcategoryIds(autoparts.kz.modules.admin.categories.dto.AdminCategoryDto category, 
                                         java.util.Set<Long> allCategoryIds) {
        if (category.getSubcategories() != null) {
            for (var subcategory : category.getSubcategories()) {
                allCategoryIds.add(subcategory.getId());
                // Recursively add all nested subcategories
                collectAllSubcategoryIds(subcategory, allCategoryIds);
            }
        }
    }
}
