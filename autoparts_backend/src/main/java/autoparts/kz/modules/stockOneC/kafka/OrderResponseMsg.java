package autoparts.kz.modules.stockOneC.kafka;


import lombok.Data;

@Data
public class OrderResponseMsg {
    private String orderId;
    private String status; // ACCEPTED/REJECTED
    private String reason;
    private String ts;
}