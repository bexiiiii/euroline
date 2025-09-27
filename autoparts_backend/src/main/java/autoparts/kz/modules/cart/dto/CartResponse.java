package autoparts.kz.modules.cart.dto;

import lombok.Data;

import java.util.List;





@Data
public class CartResponse {
    private Long userId;
    private List<CartItemDTO> items;

    @Data
    public static class CartItemDTO {
        private Long productId;
        private String productName;
        private int quantity;
        private Integer price; // цена с 1С
    }
}
