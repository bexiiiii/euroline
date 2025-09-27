package autoparts.kz.modules.stockOneC.events;


import lombok.Data;

@Data
public class StockReservedEvent {
    private String externalId;  // тот же UUID заказа
    private String reservationId; // ID резерва в 1С
}