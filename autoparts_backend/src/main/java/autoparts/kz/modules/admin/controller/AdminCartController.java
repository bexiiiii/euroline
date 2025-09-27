package autoparts.kz.modules.admin.controller;

import autoparts.kz.modules.admin.dto.cart.AdminCartResponse;
import autoparts.kz.modules.admin.dto.cart.AdminCartStatsResponse;
import autoparts.kz.modules.admin.service.AdminCartService;
import autoparts.kz.modules.cart.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/carts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCartController {
    private final CartService cartService;
    private final AdminCartService adminCartService;

    @GetMapping
    public Page<AdminCartResponse> getAllCarts(@RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "10") int size,
                                               @RequestParam(defaultValue = "lastUpdated,desc") String sort,
                                               @RequestParam(required = false) String status) {
        return adminCartService.getCarts(page, size, sort, status);
    }

    @GetMapping("/stats")
    public AdminCartStatsResponse getStats(@RequestParam(defaultValue = "30") int days) {
        return adminCartService.getStats(days);
    }

    @GetMapping("/{cartId}")
    public AdminCartResponse getCart(@PathVariable Long cartId) {
        return adminCartService.getCart(cartId);
    }

    @DeleteMapping("/{cartId}")
    public void clearCart(@PathVariable Long cartId) {
        adminCartService.clearCart(cartId);
    }

    @DeleteMapping("/{cartId}/items/{itemId}")
    public AdminCartResponse removeItem(@PathVariable Long cartId, @PathVariable Long itemId) {
        return adminCartService.removeItem(cartId, itemId);
    }

    @PostMapping("/{cartId}/send-reminder")
    public void sendReminder(@PathVariable Long cartId) {
        adminCartService.sendReminder(cartId);
    }

    @PostMapping("/{cartId}/convert-to-order")
    public java.util.Map<String, Long> convertToOrder(@PathVariable Long cartId) {
        return java.util.Map.of("orderId", adminCartService.convertToOrder(cartId));
    }
}
