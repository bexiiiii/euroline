package autoparts.kz.modules.cml.service;

import autoparts.kz.modules.cml.domain.entity.CmlOrder;
import autoparts.kz.modules.cml.domain.entity.CmlOrderStatus;
import autoparts.kz.modules.cml.parser.CmlOrdersChangeParser.OrderChange;
import autoparts.kz.modules.cml.repo.CmlOrderRepository;
import autoparts.kz.modules.cml.util.IdempotencyGuard;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;

@Service
public class OrdersApplyService {

    private static final Logger log = LoggerFactory.getLogger(OrdersApplyService.class);

    private final CmlOrderRepository orderRepository;
    private final IdempotencyGuard idempotencyGuard;

    public OrdersApplyService(CmlOrderRepository orderRepository,
                              IdempotencyGuard idempotencyGuard) {
        this.orderRepository = orderRepository;
        this.idempotencyGuard = idempotencyGuard;
    }

    @Transactional
    public void applyChange(OrderChange change, String requestId) {
        String key = requestId + ":" + change.guid();
        if (!idempotencyGuard.tryAcquire(key, "orders.apply")) {
            log.info("Skipping already processed change {}", key);
            return;
        }
        Optional<CmlOrder> optional = orderRepository.findByGuid(change.guid());
        if (optional.isEmpty()) {
            optional = orderRepository.findByNumber(change.number());
        }
        optional.ifPresentOrElse(order -> {
            CmlOrderStatus newStatus = mapStatus(change.status(), change.paid());
            order.setStatus(newStatus);
            orderRepository.save(order);
            log.info("Updated order {} to status {}", order.getNumber(), newStatus);
        }, () -> log.warn("Order {} not found for change {}", change.number(), change.guid()));
    }

    private CmlOrderStatus mapStatus(String status, boolean paid) {
        if (paid) {
            return CmlOrderStatus.PAID;
        }
        if (status == null) {
            return CmlOrderStatus.CONFIRMED;
        }
        return switch (status.toLowerCase(Locale.ROOT)) {
            case "новый", "new" -> CmlOrderStatus.NEW;
            case "подтвержден", "confirmed" -> CmlOrderStatus.CONFIRMED;
            case "отгружен", "shipped" -> CmlOrderStatus.SHIPPED;
            case "завершен", "completed" -> CmlOrderStatus.COMPLETED;
            case "отменен", "cancelled" -> CmlOrderStatus.CANCELLED;
            case "возврат", "returned" -> CmlOrderStatus.RETURNED;
            default -> CmlOrderStatus.CONFIRMED;
        };
    }
}
