package autoparts.kz.modules.order.dto.order;


import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.Instant;

@Data
public class OrderFilter {
    private String q; // по номеру/почте клиента/комментарию
    private String status;       // NEW, CONFIRMED, COMPLETED, CANCELLED ...
    private String paymentStatus;// PAID, UNPAID, REFUNDED ...
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private Instant from;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private Instant to;
}

