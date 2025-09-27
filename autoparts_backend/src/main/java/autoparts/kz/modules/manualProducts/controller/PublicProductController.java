package autoparts.kz.modules.manualProducts.controller;

import autoparts.kz.modules.manualProducts.dto.ProductResponse;
import autoparts.kz.modules.manualProducts.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class PublicProductController {

    private final ProductService productService;

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
}
