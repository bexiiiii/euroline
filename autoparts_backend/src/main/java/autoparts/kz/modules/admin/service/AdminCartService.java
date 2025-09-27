package autoparts.kz.modules.admin.service;

import autoparts.kz.common.exception.CartNotFoundException;
import autoparts.kz.modules.admin.dto.cart.AdminCartResponse;
import autoparts.kz.modules.admin.dto.cart.AdminCartStatsResponse;
import autoparts.kz.modules.admin.dto.cart.AdminCartStatsResponse.PopularProduct;
import autoparts.kz.modules.admin.mapper.AdminCartMapper;
import autoparts.kz.modules.cart.entity.Cart;
import autoparts.kz.modules.cart.repository.CartItemRepository;
import autoparts.kz.modules.cart.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminCartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    @Transactional(readOnly = true)
    public Page<AdminCartResponse> getCarts(int page, int size, String sort, String status) {
        List<AdminCartResponse> carts = loadAllCarts();

        if (status != null && !status.isBlank()) {
            String normalized = status.trim().toUpperCase(Locale.ROOT);
            carts = carts.stream()
                    .filter(cart -> switch (normalized) {
                        case "ABANDONED" -> cart.isAbandoned();
                        case "ACTIVE" -> !cart.isAbandoned();
                        default -> true;
                    })
                    .collect(Collectors.toList());
        }

        sortCarts(carts, sort);

        PageRequest pageRequest = PageRequest.of(page, size);
        int from = Math.min((int) pageRequest.getOffset(), carts.size());
        int to = Math.min(from + pageRequest.getPageSize(), carts.size());
        List<AdminCartResponse> content = carts.subList(from, to);

        return new PageImpl<>(content, pageRequest, carts.size());
    }

    @Transactional(readOnly = true)
    public AdminCartResponse getCart(Long cartId) {
        Cart cart = cartRepository.findByIdWithItems(cartId)
                .orElseThrow(() -> new CartNotFoundException(cartId));
        return AdminCartMapper.toResponse(cart);
    }

    @Transactional
    public void clearCart(Long cartId) {
        Cart cart = cartRepository.findByIdWithItems(cartId)
                .orElseThrow(() -> new CartNotFoundException(cartId));
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    @Transactional
    public AdminCartResponse removeItem(Long cartId, Long itemId) {
        Cart cart = cartRepository.findByIdWithItems(cartId)
                .orElseThrow(() -> new CartNotFoundException(cartId));
        cart.getItems().removeIf(item -> item.getId().equals(itemId));
        cartRepository.save(cart);
        cartItemRepository.deleteById(itemId);
        return AdminCartMapper.toResponse(cart);
    }

    @Transactional
    public void sendReminder(Long cartId) {
        // Placeholder: integration with email/notification can be added later
        cartRepository.findById(cartId).orElseThrow(() -> new CartNotFoundException(cartId));
    }

    @Transactional
    public Long convertToOrder(Long cartId) {
        cartRepository.findById(cartId).orElseThrow(() -> new CartNotFoundException(cartId));
        // Placeholder: integrate with order creation workflow
        return cartId;
    }

    @Transactional(readOnly = true)
    public AdminCartStatsResponse getStats(int days) {
        List<AdminCartResponse> carts = loadAllCarts();
        AdminCartStatsResponse stats = new AdminCartStatsResponse();

        long abandoned = carts.stream().filter(AdminCartResponse::isAbandoned).count();
        long active = carts.size() - abandoned;

        stats.setTotalActiveCarts(active);
        stats.setTotalAbandonedCarts(abandoned);

        BigDecimal totalValue = carts.stream()
                .map(AdminCartResponse::getTotalAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.setTotalCartValue(totalValue);

        BigDecimal average = carts.isEmpty() ? BigDecimal.ZERO :
                totalValue.divide(BigDecimal.valueOf(carts.size()), 2, java.math.RoundingMode.HALF_UP);
        stats.setAverageCartValue(average);

        stats.setCartConversionRate(0.0); // Conversion tracking not implemented yet
        stats.setMostAddedProducts(calculatePopularProducts(carts));
        return stats;
    }

    private List<AdminCartResponse> loadAllCarts() {
        List<Cart> carts = cartRepository.findAllWithItems();
        return carts.stream()
                .map(AdminCartMapper::toResponse)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private void sortCarts(List<AdminCartResponse> carts, String sort) {
        if (sort == null || sort.isBlank()) {
            carts.sort(Comparator.comparing(AdminCartResponse::getLastUpdated).reversed());
            return;
        }
        String[] parts = sort.split(",");
        String field = parts[0];
        boolean desc = parts.length > 1 && parts[1].equalsIgnoreCase("desc");

        Comparator<AdminCartResponse> comparator = switch (field) {
            case "totalAmount" -> Comparator.comparing(AdminCartResponse::getTotalAmount, Comparator.nullsFirst(Comparator.naturalOrder()));
            case "totalItems" -> Comparator.comparingInt(AdminCartResponse::getTotalItems);
            default -> Comparator.comparing(AdminCartResponse::getLastUpdated, Comparator.nullsLast(Comparator.naturalOrder()));
        };

        if (desc) {
            comparator = comparator.reversed();
        }
        carts.sort(comparator);
    }

    private List<PopularProduct> calculatePopularProducts(List<AdminCartResponse> carts) {
        Map<Long, PopularProduct> agg = carts.stream()
                .flatMap(cart -> cart.getItems().stream())
                .filter(item -> item.getProductId() != null)
                .collect(Collectors.toMap(
                        AdminCartResponse.CartItem::getProductId,
                        item -> {
                            PopularProduct product = new PopularProduct();
                            product.setProductId(item.getProductId());
                            product.setProductName(item.getProductName());
                            product.setAddedCount(item.getQuantity());
                            return product;
                        },
                        (a, b) -> {
                            a.setAddedCount(a.getAddedCount() + b.getAddedCount());
                            if (a.getProductName() == null) {
                                a.setProductName(b.getProductName());
                            }
                            return a;
                        }
                ));

        return agg.values().stream()
                .sorted(Comparator.comparingLong(PopularProduct::getAddedCount).reversed())
                .limit(5)
                .collect(Collectors.toList());
    }
}
