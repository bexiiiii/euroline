package autoparts.kz.modules.cart.controller;

import autoparts.kz.common.constants.ValidationConstants;
import autoparts.kz.common.exception.InvalidQuantityException;
import autoparts.kz.common.security.SimplePrincipal;
import autoparts.kz.modules.cart.dto.AddByOemRequest;
import autoparts.kz.modules.cart.entity.Cart;
import autoparts.kz.modules.cart.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
    
    private final CartService cartService;

    @PostMapping("/add")
    public Cart addProductToCart(@AuthenticationPrincipal SimplePrincipal principal,
                                 @RequestParam Long productId,
                                 @RequestParam int quantity) {
        validateQuantity(quantity);
        return cartService.addToCart(principal.id(), productId, quantity);
    }

    @DeleteMapping("/remove")
    public Cart removeProductFromCart(@AuthenticationPrincipal SimplePrincipal principal,
                                      @RequestParam Long productId) {
        return cartService.removeFromCart(principal.id(), productId);
    }

    @GetMapping
    public Cart viewCart(@AuthenticationPrincipal SimplePrincipal principal) {
        return cartService.getCartByUserIdEntity(principal.id());
    }
    
    @PatchMapping("/update")
    public Cart updateQuantity(@AuthenticationPrincipal SimplePrincipal principal,
                               @RequestParam Long productId,
                               @RequestParam int quantity) {
        // quantity 0 -> remove item; >0 -> set exact value
        if (quantity < 0 || quantity > ValidationConstants.MAX_QUANTITY) {
            throw new InvalidQuantityException(quantity);
        }
        return cartService.updateQuantity(principal.id(), productId, quantity);
    }

    @PostMapping("/add-by-oem")
    public Cart addByOem(@AuthenticationPrincipal SimplePrincipal principal,
                         @RequestBody AddByOemRequest req) {
        validateQuantity(req.getQuantity());
        if (req.getOem() == null || req.getOem().isBlank()) {
            throw new IllegalArgumentException("oem is required");
        }
        return cartService.addToCartByOem(
                principal.id(),
                req.getOem(),
                req.getName(),
                req.getBrand(),
                req.getPrice(),
                req.getImageUrl(),
                req.getQuantity()
        );
    }
    
    private void validateQuantity(int quantity) {
        if (quantity < ValidationConstants.MIN_QUANTITY || quantity > ValidationConstants.MAX_QUANTITY) {
            throw new InvalidQuantityException(quantity);
        }
    }
}
