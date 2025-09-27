package autoparts.kz.modules.stockOneC.kafka;


import lombok.Data;
import java.util.List;

@Data
public class OrderRequestMsg {
    private String orderId;
    private String customerId;
    private String address;
    private List<Item> items;

    @Data public static class Item { private String sku; private int qty; }
}
