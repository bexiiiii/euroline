package autoparts.kz.modules.stockOneC.events;

import lombok.Data;

@Data
public class StockRejectedEvent {
    private String externalId;
    private String reason;
}
