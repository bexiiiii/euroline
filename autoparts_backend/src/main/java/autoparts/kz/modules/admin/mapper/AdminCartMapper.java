package autoparts.kz.modules.admin.mapper;

import autoparts.kz.modules.admin.dto.cart.AdminCartResponse;
import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.cart.entity.Cart;
import autoparts.kz.modules.cart.entity.CartItem;
import autoparts.kz.modules.manualProducts.entity.Product;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public final class AdminCartMapper {

    private AdminCartMapper() {
    }

    public static AdminCartResponse toResponse(Cart cart) {
        AdminCartResponse response = new AdminCartResponse();
        response.setId(cart.getId());

        User user = cart.getUser();
        if (user != null) {
            response.setCustomerId(user.getId());
            response.setCustomerEmail(user.getEmail());
            response.setCustomerPhone(user.getPhone());
            response.setCustomerName(resolveCustomerName(user));
        }

        List<CartItem> items = cart.getItems() != null ? cart.getItems() : Collections.emptyList();
        List<AdminCartResponse.CartItem> itemDtos = items.stream()
                .map(AdminCartMapper::toItem)
                .collect(Collectors.toList());
        response.setItems(itemDtos);

        int totalItems = itemDtos.stream().mapToInt(AdminCartResponse.CartItem::getQuantity).sum();
        response.setTotalItems(totalItems);

        BigDecimal totalAmount = itemDtos.stream()
                .map(AdminCartResponse.CartItem::getTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        response.setTotalAmount(totalAmount);

        boolean abandoned = itemDtos.isEmpty();
        response.setAbandoned(abandoned);

        Instant referenceTime = Instant.now();
        response.setCreatedAt(referenceTime);
        response.setLastUpdated(referenceTime);
        response.setAbandonedAt(abandoned ? referenceTime : null);

        return response;
    }

    private static AdminCartResponse.CartItem toItem(CartItem item) {
        AdminCartResponse.CartItem dto = new AdminCartResponse.CartItem();
        dto.setId(item.getId());
        dto.setQuantity(item.getQuantity());
        dto.setAddedAt(Instant.now());

        Product product = item.getProduct();
        if (product != null) {
            dto.setProductId(product.getId());
            dto.setProductName(product.getName());
            dto.setProductSku(product.getSku());
        }

        BigDecimal price = item.getPrice();
        if (price == null && product != null && product.getPrice() != null) {
            price = BigDecimal.valueOf(product.getPrice());
        }
        if (price == null) {
            price = BigDecimal.ZERO;
        }
        dto.setPrice(price);
        dto.setTotal(price.multiply(BigDecimal.valueOf(item.getQuantity())));

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
        if (builder.length() == 0) {
            return user.getEmail();
        }
        return builder.toString();
    }
}
