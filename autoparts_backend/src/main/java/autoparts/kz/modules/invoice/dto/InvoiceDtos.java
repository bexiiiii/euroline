package autoparts.kz.modules.invoice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class InvoiceDtos {
    public record Receiver(String id, String name, String phone) {}

    public record Item(
            Long itemId,
            Long productId,
            String article,
            String brand,
            String name,
            BigDecimal price,
            int quantity,
            BigDecimal total,
            int returned,
            String returnDeadline
    ) {}

    public record Details(
            Long id,
            String invoiceNumber,
            String invoiceDate,
            String createdAt,
            Receiver receiver,
            String address,
            String deliveryMethod,
            String receiptNumber,
            String paymentMethod,
            List<Item> items
    ) {}

    public record ReturnItem(Long productId, Integer quantity) {}
    public record CreateReturn(String reason, String description, String method, List<ReturnItem> items) {}
    public record ReturnResponse(Long id, BigDecimal amount, String status, Instant createdAt) {}
}

