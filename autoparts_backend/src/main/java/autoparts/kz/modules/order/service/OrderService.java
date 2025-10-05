package autoparts.kz.modules.order.service;

import autoparts.kz.common.exception.CartNotFoundException;
import autoparts.kz.common.exception.DuplicateRequestException;
import autoparts.kz.common.exception.OrderNotFoundException;
import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.cart.entity.Cart;
import autoparts.kz.modules.cart.repository.CartRepository;
import autoparts.kz.modules.order.dto.CreateOrderRequest;
import autoparts.kz.modules.order.entity.Order;
import autoparts.kz.modules.order.entity.OrderItem;
import autoparts.kz.modules.order.orderStatus.OrderStatus;
import autoparts.kz.modules.order.repository.OrderRepository;
import autoparts.kz.modules.stockOneC.events.OrderCreatedEvent;
import autoparts.kz.modules.stockOneC.outbox.OutboxMessage;
import autoparts.kz.modules.stockOneC.outbox.OutboxRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import autoparts.kz.modules.notifications.service.NotificationService;
import autoparts.kz.modules.finance.service.FinanceService;
import autoparts.kz.modules.notifications.entity.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final OutboxRepository outboxRepository;
    private final NotificationService notifications;
    private final ObjectMapper objectMapper;
    private final FinanceService financeService;
    private final autoparts.kz.modules.telegram.service.TelegramNotificationService telegramNotificationService;

    @Transactional
    public Order createOrderFromCart(Long userId, CreateOrderRequest req) {
        // Проверка идемпотентности
        orderRepository.findByIdempotencyKey(req.getIdempotencyKey())
                .ifPresent(existing -> { 
                    throw new DuplicateRequestException(req.getIdempotencyKey()); 
                });

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new CartNotFoundException(userId));

        // Проверка что корзина не пустая
        if (cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cannot create order from empty cart");
        }

        // Создать заказ
        Order order = createOrder(userId, req, cart);
        order = orderRepository.save(order);

        // Сформировать событие и положить в outbox
        enqueueOrderCreated(order);

        // Отправить уведомление в Telegram
        try {
            telegramNotificationService.notifyNewOrder(order);
        } catch (Exception e) {
            log.error("Failed to send Telegram notification for order {}: {}", order.getId(), e.getMessage());
        }

        // Очистить корзину
        clearCart(cart);

        log.info("Order created successfully: orderId={}, userId={}", order.getId(), userId);
        return order;
    }
    
    private Order createOrder(Long userId, CreateOrderRequest req, Cart cart) {
        Order order = new Order();
        var user = new User(); 
        user.setId(userId);
        order.setUser(user);
        order.setDeliveryAddress(req.getDeliveryAddress());
        order.setStatus(OrderStatus.PENDING);
        order.setIdempotencyKey(req.getIdempotencyKey());
        order.setPublicCode(generateUniquePublicCode());

        List<OrderItem> orderItems = cart.getItems().stream()
                .map(cartItem -> createOrderItem(order, cartItem))
                .toList();
        order.setItems(orderItems);
        
        return order;
    }

    private String generateUniquePublicCode() {
        final String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        while (true) {
            StringBuilder sb = new StringBuilder(5);
            boolean hasLetter = false;
            boolean hasDigit = false;
            for (int i = 0; i < 5; i++) {
                int idx = (int) Math.floor(Math.random() * chars.length());
                char c = chars.charAt(idx);
                if (Character.isDigit(c)) hasDigit = true;
                else hasLetter = true;
                sb.append(c);
            }
            if (!(hasLetter && hasDigit)) continue;
            String code = sb.toString();
            if (orderRepository.findByPublicCode(code).isEmpty()) {
                return code;
            }
        }
    }
    
    private OrderItem createOrderItem(Order order, autoparts.kz.modules.cart.entity.CartItem cartItem) {
        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(order);
        orderItem.setProduct(cartItem.getProduct());
        orderItem.setSku(cartItem.getProduct().getSku());
        orderItem.setQuantity(cartItem.getQuantity());
        
        Integer priceInt = cartItem.getProduct().getPrice();
        orderItem.setPrice(priceInt == null ? BigDecimal.ZERO : BigDecimal.valueOf(priceInt.longValue()));
        
        return orderItem;
    }
    
    private void clearCart(Cart cart) {
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    private void enqueueOrderCreated(Order order) {
        try {
            OrderCreatedEvent event = createOrderCreatedEvent(order);
            
            OutboxMessage message = new OutboxMessage();
            message.setAggregateType("Order");
            message.setAggregateId(order.getId());
            message.setEventType("OrderCreated");
            message.setPayloadJson(objectMapper.writeValueAsString(event));

            outboxRepository.save(message);
            log.debug("Order created event enqueued: orderId={}", order.getId());
        } catch (Exception e) {
            log.error("Failed to serialize OrderCreatedEvent for order: {}", order.getId(), e);
            throw new RuntimeException("Cannot serialize OrderCreatedEvent", e);
        }
    }
    
    private OrderCreatedEvent createOrderCreatedEvent(Order order) {
        OrderCreatedEvent event = new OrderCreatedEvent();
        event.setExternalId(order.getExternalId());
        event.setInternalId(order.getId());
        event.setUserId(order.getUser().getId());
        event.setDeliveryAddress(order.getDeliveryAddress());
        event.setTotalAmount(order.getTotalAmount());
        
        var items = order.getItems().stream()
                .map(this::createOrderItemEvent)
                .toList();
        event.setItems(items);
        
        return event;
    }
    
    private OrderCreatedEvent.Item createOrderItemEvent(OrderItem orderItem) {
        OrderCreatedEvent.Item item = new OrderCreatedEvent.Item();
        item.setSku(orderItem.getSku());
        item.setQty(orderItem.getQuantity());
        item.setPrice(orderItem.getPrice());
        return item;
    }

    @Transactional
    public void confirmOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
        try {
            financeService.chargeOrder(order.getUser().getId(), order.getTotalAmount(), order.getId());
        } catch (Exception e) {
            log.warn("Failed to charge order to balance: orderId={}, err={}", orderId, e.toString());
        }
        try {
            notifications.createAndBroadcast(order.getUser().getId(),
                    "Заказ подтверждён",
                    "Заказ #"+order.getId()+" подтверждён.",
                    Notification.Type.ORDER,
                    Notification.Severity.SUCCESS);
        } catch (Exception ignored) {}
        log.info("Order confirmed: orderId={}", orderId);
    }

    @Transactional
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
        try {
            financeService.refundOrderIfCharged(order.getUser().getId(), order.getTotalAmount(), order.getId());
        } catch (Exception e) {
            log.warn("Failed to refund order on cancel: orderId={}, err={}", orderId, e.toString());
        }
        try {
            notifications.createAndBroadcast(order.getUser().getId(),
                    "Заказ отменён",
                    "Заказ #"+order.getId()+" отменён.",
                    Notification.Type.ORDER,
                    Notification.Severity.WARNING);
        } catch (Exception ignored) {}
        log.info("Order cancelled: orderId={}", orderId);
    }
}
