package autoparts.kz.modules.cml.service;

import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.auth.repository.UserRepository;
import autoparts.kz.modules.cml.config.CommerceMlProperties;
import autoparts.kz.modules.cml.domain.dto.OneCOrderMessage;
import autoparts.kz.modules.cml.domain.dto.OneCReturnMessage;
import autoparts.kz.modules.order.entity.Order;
import autoparts.kz.modules.order.entity.OrderItem;
import autoparts.kz.modules.order.repository.OrderRepository;
import autoparts.kz.modules.returns.entity.ReturnRequest;
import autoparts.kz.modules.returns.status.ReturnStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OneCBridgePublisher {

    private static final String DEFAULT_CURRENCY = "KZT";

    private final RabbitTemplate rabbitTemplate;
    private final CommerceMlProperties properties;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    @Value("${integration.push.enabled:false}")
    private boolean pushEnabled;

    public void publishOrderAfterCommit(Order order) {
        if (!pushEnabled) {
            log.debug("Push integration disabled, skip order {}", order.getId());
            return;
        }
        OneCOrderMessage payload = mapOrder(order);
        String routingKey = properties.getQueue().getOrdersIntegrationRoutingKey();
        sendAfterCommit(routingKey, payload,
                () -> log.info("Order {} scheduled for publishing to 1C queue {}", order.getId(), routingKey));
    }

    public void publishReturnAfterCommit(ReturnRequest request) {
        if (!pushEnabled) {
            log.debug("Push integration disabled, skip return {}", request.getId());
            return;
        }
        OneCReturnMessage payload = mapReturn(request);
        String routingKey = properties.getQueue().getReturnsIntegrationRoutingKey();
        sendAfterCommit(routingKey, payload,
                () -> log.info("Return {} scheduled for publishing to 1C queue {}", request.getId(), routingKey));
    }

    private void sendAfterCommit(String routingKey, Object payload, Runnable beforeSendLog) {
        Runnable action = () -> {
            beforeSendLog.run();
            rabbitTemplate.convertAndSend(properties.getQueue().getExchange(), routingKey, payload);
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }

    private OneCOrderMessage mapOrder(Order order) {
        OneCOrderMessage message = new OneCOrderMessage();
        message.setOrderId(order.getId());
        message.setExternalId(order.getExternalId());
        message.setPublicCode(order.getPublicCode());
        message.setCreatedAt(order.getCreatedAt());
        message.setConfirmedAt(LocalDateTime.now());
        message.setStatus(order.getStatus().name());
        message.setTotalAmount(order.getTotalAmount());
        message.setCurrency(DEFAULT_CURRENCY);
        message.setDeliveryAddress(order.getDeliveryAddress());

        OneCOrderMessage.Payment payment = new OneCOrderMessage.Payment();
        payment.setStatus(Optional.ofNullable(order.getPaymentStatus()).map(Enum::name).orElse("UNKNOWN"));
        payment.setAmount(order.getTotalAmount());
        message.setPayment(payment);

        message.setCustomer(mapOrderCustomer(order.getUser()));

        List<OneCOrderMessage.Item> items = Optional.ofNullable(order.getItems())
                .orElse(List.of())
                .stream()
                .map(this::mapOrderItem)
                .collect(Collectors.toList());
        message.setItems(items);
        return message;
    }

    private OneCOrderMessage.Item mapOrderItem(OrderItem orderItem) {
        OneCOrderMessage.Item item = new OneCOrderMessage.Item();
        item.setProductId(orderItem.getProduct() != null ? orderItem.getProduct().getId() : null);
        item.setProductExternalCode(orderItem.getProduct() != null ? orderItem.getProduct().getExternalCode() : null);
        item.setProductCode(orderItem.getProduct() != null ? orderItem.getProduct().getCode() : null);
        item.setProductName(orderItem.getProduct() != null ? orderItem.getProduct().getName() : null);
        item.setSku(orderItem.getSku());
        item.setQuantity(orderItem.getQuantity());
        item.setPrice(Optional.ofNullable(orderItem.getPrice()).orElse(BigDecimal.ZERO));
        return item;
    }

    private OneCReturnMessage mapReturn(ReturnRequest request) {
        OneCReturnMessage message = new OneCReturnMessage();
        message.setReturnId(request.getId());
        message.setOrderId(request.getOrderId());
        message.setCustomerId(request.getCustomerId());
        message.setStatus(Optional.ofNullable(request.getStatus()).map(ReturnStatus::name).orElse("UNKNOWN"));
        message.setAmount(Optional.ofNullable(request.getAmount()).orElse(BigDecimal.ZERO));
        message.setCurrency(DEFAULT_CURRENCY);
        message.setReason(request.getReason());
        message.setDetailsJson(request.getDetailsJson());
        message.setCreatedAt(request.getCreatedAt());
        message.setUpdatedAt(request.getUpdatedAt());

        orderRepository.findById(request.getOrderId()).ifPresent(order -> {
            message.setOrderExternalId(order.getExternalId());
            message.setOrderPublicCode(order.getPublicCode());
        });

        if (request.getCustomerId() != null) {
            userRepository.findById(request.getCustomerId())
                    .map(this::mapReturnCustomer)
                    .ifPresent(message::setCustomer);
        }
        return message;
    }

    private OneCOrderMessage.Customer mapOrderCustomer(User user) {
        if (user == null) {
            return null;
        }
        OneCOrderMessage.Customer customer = new OneCOrderMessage.Customer();
        customer.setId(user.getId());
        customer.setEmail(user.getEmail());
        customer.setPhone(user.getPhone());
        customer.setClientName(user.getClientName());
        customer.setSurname(user.getSurname());
        customer.setName(user.getName());
        customer.setFathername(user.getFathername());
        customer.setCompanyType(user.getType());
        customer.setCountry(user.getCountry());
        customer.setState(user.getState());
        customer.setCity(user.getCity());
        customer.setOfficeAddress(user.getOfficeAddress());
        return customer;
    }

    private OneCReturnMessage.Customer mapReturnCustomer(User user) {
        if (user == null) {
            return null;
        }
        OneCReturnMessage.Customer customer = new OneCReturnMessage.Customer();
        customer.setId(user.getId());
        customer.setEmail(user.getEmail());
        customer.setPhone(user.getPhone());
        customer.setClientName(user.getClientName());
        customer.setSurname(user.getSurname());
        customer.setName(user.getName());
        customer.setFathername(user.getFathername());
        return customer;
    }
}
