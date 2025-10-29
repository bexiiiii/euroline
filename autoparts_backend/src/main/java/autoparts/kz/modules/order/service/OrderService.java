package autoparts.kz.modules.order.service;

import autoparts.kz.common.exception.CartNotFoundException;
import autoparts.kz.common.exception.DuplicateRequestException;
import autoparts.kz.common.exception.OrderNotFoundException;
import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.auth.repository.UserRepository;
import autoparts.kz.modules.cart.entity.Cart;
import autoparts.kz.modules.cart.repository.CartItemRepository;
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
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final OutboxRepository outboxRepository;
    private final NotificationService notifications;
    private final ObjectMapper objectMapper;
    private final FinanceService financeService;
    private final autoparts.kz.modules.telegram.service.TelegramNotificationService telegramNotificationService;
    private final autoparts.kz.modules.cml.service.OneCBridgePublisher oneCBridgePublisher;
    private final UserRepository userRepository;
    
    // ✅ НОВОЕ: Конвертер для CommerceML интеграции
    private final autoparts.kz.modules.cml.service.OrderToCmlConverter orderToCmlConverter;
    private final autoparts.kz.modules.cml.repo.CmlOrderRepository cmlOrderRepository;

    @Transactional
    public Order createOrderFromCart(Long userId, CreateOrderRequest req) {
        // Проверка идемпотентности
        orderRepository.findByIdempotencyKey(req.getIdempotencyKey())
                .ifPresent(existing -> { 
                    throw new DuplicateRequestException(req.getIdempotencyKey()); 
                });

        Cart cart = cartRepository.findByUserIdFetch(userId)
                .orElseGet(() -> cartRepository.findByUserId(userId)
                        .orElseThrow(() -> new CartNotFoundException(userId)));

        // Проверка что корзина не пустая
        if (cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cannot create order from empty cart");
        }

        // ✅ НОВОЕ: Проверить достаточность средств (баланс + кредит) ДО создания заказа
        BigDecimal orderTotal = cart.getItems().stream()
                .filter(item -> {
                    // Используем цену из CartItem или из Product
                    BigDecimal itemPrice = item.getPrice();
                    if (itemPrice == null && item.getProduct() != null && item.getProduct().getPrice() != null) {
                        itemPrice = BigDecimal.valueOf(item.getProduct().getPrice());
                    }
                    return itemPrice != null;
                })
                .map(item -> {
                    BigDecimal itemPrice = item.getPrice();
                    if (itemPrice == null) {
                        itemPrice = BigDecimal.valueOf(item.getProduct().getPrice());
                    }
                    return itemPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Проверка что все товары имеют цену
        boolean hasItemsWithoutPrice = cart.getItems().stream()
                .anyMatch(item -> {
                    BigDecimal itemPrice = item.getPrice();
                    if (itemPrice == null && item.getProduct() != null) {
                        Integer productPrice = item.getProduct().getPrice();
                        itemPrice = productPrice != null ? BigDecimal.valueOf(productPrice) : null;
                    }
                    return itemPrice == null;
                });
        if (hasItemsWithoutPrice) {
            throw new IllegalStateException("В корзине есть товары без цены. Пожалуйста, обновите корзину.");
        }
        
        financeService.validateSufficientFunds(userId, orderTotal);

        // Создать заказ
        Order order = createOrder(userId, req, cart);
        order = orderRepository.save(order);

        // ✅ НОВОЕ: Списать сумму заказа с баланса/кредита клиента
        try {
            financeService.chargeForOrder(userId, orderTotal);
            log.info("Charged {} ₸ for order {}", orderTotal, order.getId());
        } catch (Exception e) {
            log.error("Failed to charge for order {}: {}", order.getId(), e.getMessage(), e);
            throw new IllegalStateException("Не удалось списать средства за заказ: " + e.getMessage(), e);
        }

        // ✅ НОВОЕ: Создать CmlOrder для автоматической интеграции с 1С через CommerceML
        try {
            autoparts.kz.modules.cml.domain.entity.CmlOrder cmlOrder = orderToCmlConverter.convert(order);
            cmlOrderRepository.save(cmlOrder);
            log.info("CmlOrder created for order {}, will be exported to 1C", order.getId());
        } catch (Exception e) {
            log.error("Failed to create CmlOrder for order {}: {}", order.getId(), e.getMessage(), e);
            // Не бросаем исключение - заказ уже создан, интеграцию попробуем позже
        }

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
        User user = cart.getUser();
        if (user == null || user.getEmail() == null) {
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalStateException("Пользователь не найден: " + userId));
        }
        if (user.getId() == null) {
            user.setId(userId);
        }
        order.applyCustomerSnapshot(user);
        order.setDeliveryAddress(req.getDeliveryAddress());
        order.setStatus(OrderStatus.PENDING);
        order.setIdempotencyKey(req.getIdempotencyKey());
        order.setPublicCode(generateUniquePublicCode());

        List<OrderItem> orderItems = cart.getItems().stream()
                .map(cartItem -> createOrderItem(order, cartItem))
                .toList();
        order.setItems(orderItems);
        order.setTotalAmount(order.getTotalPrice());
        
        return order;
    }

    private String generateUniquePublicCode() {
        final String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        ThreadLocalRandom random = ThreadLocalRandom.current();

        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder builder = new StringBuilder(5);
            boolean hasLetter = false;
            boolean hasDigit = false;
            for (int i = 0; i < 5; i++) {
                char c = chars.charAt(random.nextInt(chars.length()));
                if (Character.isDigit(c)) {
                    hasDigit = true;
                } else {
                    hasLetter = true;
                }
                builder.append(c);
            }
            if (!hasLetter || !hasDigit) {
                continue;
            }
            String code = builder.toString();
            if (!orderRepository.existsByPublicCode(code)) {
                return code;
            }
        }

        String fallback = UUID.randomUUID().toString().replace("-", "").toUpperCase();
        fallback = fallback.substring(0, Math.min(8, fallback.length()));
        return orderRepository.existsByPublicCode(fallback) ? generateUniquePublicCode() : fallback;
    }
    
    private OrderItem createOrderItem(Order order, autoparts.kz.modules.cart.entity.CartItem cartItem) {
        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(order);
        orderItem.setProduct(cartItem.getProduct());
        orderItem.setSku(cartItem.getProduct().getSku());
        orderItem.setQuantity(cartItem.getQuantity());
        
        // ✅ ИСПРАВЛЕНИЕ: Используем цену из CartItem (она может быть зафиксирована при добавлении)
        // Если в CartItem цена null, берем из Product
        BigDecimal price = cartItem.getPrice();
        if (price == null) {
            Integer priceInt = cartItem.getProduct().getPrice();
            price = priceInt == null ? BigDecimal.ZERO : BigDecimal.valueOf(priceInt.longValue());
        }
        orderItem.setPrice(price);
        
        return orderItem;
    }
    
    private void clearCart(Cart cart) {
        // Используем явное удаление через репозиторий
        // Это безопаснее, чем cart.getItems().clear() + save, 
        // т.к. избегает проблем с detached entities в текущей транзакции
        if (cart.getId() != null) {
            cartItemRepository.deleteByCartId(cart.getId());
        }
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
        OrderStatus previousStatus = order.getStatus();
        try {
            financeService.chargeOrder(order.getUser().getId(), order.getTotalAmount(), order.getId());
        } catch (IllegalStateException e) {
            log.warn("Insufficient balance/credit for order confirmation: orderId={}, err={}", orderId, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.warn("Failed to charge order to balance: orderId={}, err={}", orderId, e.toString());
        }
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
        try {
            notifications.createAndBroadcast(order.getUser().getId(),
                    "Заказ подтверждён",
                    "Заказ #"+order.getId()+" подтверждён.",
                    Notification.Type.ORDER,
                    Notification.Severity.SUCCESS);
        } catch (Exception ignored) {}
        if (previousStatus != OrderStatus.CONFIRMED) {
            oneCBridgePublisher.publishOrderAfterCommit(order);
        }
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
