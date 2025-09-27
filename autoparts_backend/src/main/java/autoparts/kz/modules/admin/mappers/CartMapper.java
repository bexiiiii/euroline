package autoparts.kz.modules.admin.mappers;


import autoparts.kz.modules.cart.dto.CartResponse;
import autoparts.kz.modules.cart.entity.Cart;
import autoparts.kz.modules.cart.entity.CartItem;

import java.util.stream.Collectors;

public class CartMapper {

    public static CartResponse toResponse(Cart cart) {
        CartResponse response = new CartResponse();
        response.setUserId(cart.getUser().getId());
        response.setItems(
                cart.getItems().stream().map(CartMapper::toItemDTO).collect(Collectors.toList())
        );
        return response;
    }

    public static CartResponse.CartItemDTO toItemDTO(CartItem item) {
        CartResponse.CartItemDTO dto = new CartResponse.CartItemDTO();
        dto.setProductId(item.getProduct().getId());
        dto.setProductName(item.getProduct().getName());
        dto.setQuantity(item.getQuantity());
        dto.setPrice(item.getProduct().getPrice());
        return dto;
    }
}
