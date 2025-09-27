package autoparts.kz.modules.manualProducts.mapper;

import autoparts.kz.modules.manualProducts.dto.ProductResponse;
import autoparts.kz.modules.manualProducts.entity.Product;
import org.mapstruct.Mapper;

import java.util.List;
import java.util.stream.Collectors;



@Mapper(componentModel = "spring")
public class ProductMapper {
    public static ProductResponse toResponse(Product product) {
        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        response.setName(product.getName());
        response.setCode(product.getCode());
        response.setDescription(product.getDescription());
        response.setBrand(product.getBrand());
        response.setExternalCode(product.getExternalCode());
        response.setImageUrl(product.getImageUrl());

        List<ProductResponse.PropertyDTO> props = product.getProperties().stream().map(p -> {
            ProductResponse.PropertyDTO dto = new ProductResponse.PropertyDTO();
            dto.setPropertyName(p.getPropertyName());
            dto.setPropertyValue(p.getPropertyValue());
            return dto;
        }).collect(Collectors.toList());

        response.setProperties(props);
        return response;
    }
}