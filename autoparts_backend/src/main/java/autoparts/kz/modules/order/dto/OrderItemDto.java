package autoparts.kz.modules.order.dto;


import lombok.Data;

@Data
public class OrderItemDto {
    private String sku;
    private int qty;
}