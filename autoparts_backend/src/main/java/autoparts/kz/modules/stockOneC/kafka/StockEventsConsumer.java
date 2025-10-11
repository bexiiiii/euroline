package autoparts.kz.modules.stockOneC.kafka;


import autoparts.kz.modules.order.entity.Order;
import autoparts.kz.modules.order.orderStatus.OrderStatus;
import autoparts.kz.modules.order.repository.OrderRepository;
import autoparts.kz.modules.stockOneC.events.StockRejectedEvent;
import autoparts.kz.modules.stockOneC.events.StockReservedEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "integration.kafka", name = "enabled", havingValue = "true")
public class StockEventsConsumer {

    private final ObjectMapper om;
    private final OrderRepository orderRepository;

    @KafkaListener(topics = "${kafka.topics.stock-reserved}", groupId = "${kafka.group:autoparts}")
    public void onStockReserved(String message) {
        try {
            StockReservedEvent evt = om.readValue(message, StockReservedEvent.class);
            Optional<Order> opt = orderRepository.findByExternalId(evt.getExternalId());
            if (opt.isEmpty()) { log.warn("Order not found by externalId={}", evt.getExternalId()); return; }
            Order order = opt.get();
            order.setStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);
            log.info("Order {} confirmed by stock reservation {}", order.getId(), evt.getReservationId());
        } catch (Exception e) {
            log.error("StockReserved parse/process error: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "${kafka.topics.stock-rejected}", groupId = "${kafka.group:autoparts}")
    public void onStockRejected(String message) {
        try {
            StockRejectedEvent evt = om.readValue(message, StockRejectedEvent.class);
            Optional<Order> opt = orderRepository.findByExternalId(evt.getExternalId());
            if (opt.isEmpty()) { log.warn("Order not found by externalId={}", evt.getExternalId()); return; }
            Order order = opt.get();
            order.setStatus(OrderStatus.CANCELLED);
            orderRepository.save(order);
            log.info("Order {} cancelled by stock rejection: {}", order.getId(), evt.getReason());
        } catch (Exception e) {
            log.error("StockRejected parse/process error: {}", e.getMessage(), e);
        }
    }
}
