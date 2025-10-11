package autoparts.kz.modules.stockOneC.service;

import autoparts.kz.modules.manualProducts.dto.ProductResponse;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.manualProducts.mapper.ProductMapper;
import autoparts.kz.modules.manualProducts.repository.ProductRepository;
import autoparts.kz.modules.stockOneC.dto.OneCStockResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OneCService {
    private final String BASE_URL = "https://https-1c-mock.free.beeceptor.com";
    private final RestTemplate restTemplate;
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public Optional<ProductResponse> enrichWithOneCData(ProductResponse product) {
        if (product.getExternalCode() == null || product.getExternalCode().isEmpty()) {
            product.setSyncedWith1C(true);
            return Optional.of(product);
        }

        try {
            String url = BASE_URL + "/" + product.getExternalCode();
            OneCStockResponse response = restTemplate.getForObject(url, OneCStockResponse.class);
            if (response == null) return Optional.of(product);

            product.setPrice(response.getPrice());
            product.setStock(response.getStock());

            List<ProductResponse.WarehouseDTO> warehouses = response.getWarehouses().stream().map(w -> {
                ProductResponse.WarehouseDTO dto = new ProductResponse.WarehouseDTO();
                dto.setName(w.getName());
                dto.setQuantity(w.getQuantity());
                return dto;
            }).collect(Collectors.toList());

            product.setWarehouses(warehouses);
            product.setSyncedWith1C(true);
            return Optional.of(product);
        } catch (Exception e) {
            product.setSyncedWith1C(false);
            return Optional.of(product);
        }
    }

    public Optional<OneCStockResponse> getStockByExternalCode(String externalCode) {
        try {
            String url = BASE_URL + "/" + externalCode;
            OneCStockResponse response = restTemplate.getForObject(url, OneCStockResponse.class);
            return Optional.ofNullable(response);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public void updateProductWithOneCData(Product product) {
        Optional<ProductResponse> enriched = enrichWithOneCData(productMapper.toResponse(product));
        enriched.ifPresent(res -> {
            product.setPrice(res.getPrice());
            product.setStock(res.getStock());
            productRepository.save(product);
        });
    }
}
