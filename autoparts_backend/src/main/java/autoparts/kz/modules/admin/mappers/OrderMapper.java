package autoparts.kz.modules.admin.mappers;

import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.order.dto.OrderResponse;
import autoparts.kz.modules.order.entity.Order;
import autoparts.kz.modules.order.entity.OrderItem;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

public class OrderMapper {



    private static Date convertToDate(LocalDateTime localDateTime) {
        return Date.from(localDateTime.atZone(ZoneId.systemDefault()).toInstant());
    }

    public static OrderResponse toResponse(Order order) {
        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        response.setCustomerEmail(order.getCustomerEmail());
        User user = order.getUser();
        if (user != null) {
            response.setUserId(user.getId());
            response.setCustomerName(resolveCustomerName(user));
            response.setCustomerPhone(user.getPhone());
        }
        response.setStatus(order.getStatus().name());
        response.setPaymentStatus(order.getPaymentStatus().name());
        response.setCreatedAt(convertToDate(order.getCreatedAt()));
        response.setCode(order.getPublicCode());
        response.setDeliveryAddress(order.getDeliveryAddress());
        response.setTotalAmount(order.getTotalAmount());

        response.setItems(order.getItems() == null
                ? List.of()
                : order.getItems().stream().map(OrderMapper::toItemDTO).collect(Collectors.toList()));
        return response;
    }

    public static OrderResponse.OrderItemDTO toItemDTO(OrderItem item) {
        OrderResponse.OrderItemDTO dto = new OrderResponse.OrderItemDTO();
        dto.setId(item.getId());
        if (item.getProduct() != null) {
            dto.setProductId(item.getProduct().getId());
            dto.setProductName(item.getProduct().getName());
            dto.setProductCode(item.getProduct().getCode());
        }
        dto.setSku(item.getSku());
        dto.setQuantity(item.getQuantity());
        BigDecimal price = item.getPrice();
        dto.setPrice(price);
        dto.setTotal(price != null ? price.multiply(BigDecimal.valueOf(item.getQuantity())) : BigDecimal.ZERO);
        return dto;
    }

    private static String resolveCustomerName(User user) {
        if (user.getClientName() != null && !user.getClientName().isBlank()) {
            return user.getClientName();
        }
        StringBuilder builder = new StringBuilder();
        if (user.getSurname() != null && !user.getSurname().isBlank()) {
            builder.append(user.getSurname());
        }
        if (user.getName() != null && !user.getName().isBlank()) {
            if (builder.length() > 0) {
                builder.append(' ');
            }
            builder.append(user.getName());
        }
        if (user.getFathername() != null && !user.getFathername().isBlank()) {
            if (builder.length() > 0) {
                builder.append(' ');
            }
            builder.append(user.getFathername());
        }
        if (builder.length() > 0) {
            return builder.toString();
        }
        return user.getEmail();
    }
}
