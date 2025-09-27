package autoparts.kz.modules.stockOneC.events;


import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderCreatedEvent {
    private String externalId;       // UUID заказа
    private Long internalId;         // ID из БД
    private Long userId;
    private String deliveryAddress;
    private BigDecimal totalAmount;
    private List<Item> items;

    @Data
    public static class Item {
        private String sku;
        private int qty;
        private BigDecimal price;
    }
}