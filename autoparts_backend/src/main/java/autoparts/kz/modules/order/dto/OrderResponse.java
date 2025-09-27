package autoparts.kz.modules.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OrderResponse {
    private Long id;
    private Long userId;
    private String status;
    private String paymentStatus;
    private Date createdAt;
    private String code;
    private String deliveryAddress;
    private BigDecimal totalAmount;
    private String customerEmail;
    private String customerName;
    private String customerPhone;
    private List<OrderItemDTO> items;

    @Getter
    @Setter
    public static class OrderItemDTO {
        private Long id;
        private Long productId;
        private String productName;
        private String productCode;
        private String sku;
        private int quantity;
        private BigDecimal price;
        private BigDecimal total;
    }
}
