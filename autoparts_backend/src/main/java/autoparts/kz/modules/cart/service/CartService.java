package autoparts.kz.modules.cart.service;


import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.cart.dto.CartResponse;
import autoparts.kz.modules.cart.entity.Cart;
import autoparts.kz.modules.cart.entity.CartItem;
import autoparts.kz.modules.cart.repository.CartRepository;
import autoparts.kz.modules.cart.repository.CartItemRepository;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.manualProducts.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    @Transactional
    public Cart getCart(User user) {
        // Prefer fetch by userId to initialize items/products
        return cartRepository.findByUserIdFetch(user.getId()).orElseGet(() -> {
            Cart cart = new Cart();
            cart.setUser(user);
            return cartRepository.save(cart);
        });
    }

    @Transactional
    public Cart getCartByUserIdEntity(Long userId) {
        return cartRepository.findByUserIdFetch(userId).orElseGet(() -> {
            Cart cart = new Cart();
            var u = new User();
            u.setId(userId);
            cart.setUser(u);
            return cartRepository.save(cart);
        });
    }

    public Cart addToCart(User user, Long productId, int quantity) {
        Cart cart = getCart(user);
        Cart saved = addOrUpdate(cart, productId, quantity);
        return getCartByUserIdEntity(saved.getUser().getId());
    }

    public Cart addToCart(Long userId, Long productId, int quantity) {
        Cart cart = getCartByUserIdEntity(userId);
        Cart saved = addOrUpdate(cart, productId, quantity);
        return getCartByUserIdEntity(userId);
    }

    private Cart addOrUpdate(Cart cart, Long productId, int quantity) {
        if (cart.getItems() == null) {
            cart.setItems(new java.util.ArrayList<>());
        }
        Product product = productRepository.findById(productId).orElseThrow();
        Optional<CartItem> existing = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst();
        if (existing.isPresent()) {
            existing.get().setQuantity(existing.get().getQuantity() + quantity);
        } else {
            CartItem item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            item.setQuantity(quantity);
            cart.getItems().add(item);
        }
        return cartRepository.save(cart);
    }

    /**
     * Добавляет товар в корзину по OEM/коду. Если товара с таким кодом нет в ручном каталоге,
     * создаёт минимальную запись Product и затем добавляет её в корзину.
     */
    public Cart addToCartByOem(Long userId, String oem, String name, String brand, Integer price, String imageUrl, int quantity) {
        Cart cart = getCartByUserIdEntity(userId);

        // найти или создать product по коду
        Product product = productRepository.findFirstByCodeIgnoreCase(oem)
                .orElseGet(() -> {
                    Product p = new Product();
                    p.setCode(oem);
                    // Поля NotBlank — подставляем безопасные значения
                    p.setName(name != null && !name.isBlank() ? name : oem);
                    p.setBrand(brand != null && !brand.isBlank() ? brand : "UNKNOWN");
                    p.setExternalCode(oem);
                    p.setImageUrl(imageUrl);
                    if (price != null) p.setPrice(price);
                    return productRepository.save(p);
                });

        return addOrUpdate(cart, product.getId(), quantity);
    }

    public Cart removeFromCart(User user, Long productId) {
        Cart cart = getCart(user);
        cart.getItems().removeIf(i -> i.getProduct().getId().equals(productId));
        cartRepository.save(cart);
        return getCartByUserIdEntity(user.getId());
    }

    public Cart removeFromCart(Long userId, Long productId) {
        Cart cart = getCartByUserIdEntity(userId);
        cart.getItems().removeIf(i -> i.getProduct().getId().equals(productId));
        cartRepository.save(cart);
        return getCartByUserIdEntity(userId);
    }

    @Transactional(readOnly = true)
    public List<CartResponse> getAllCarts() {
        return cartRepository.findAllWithItems().stream()
                .map(autoparts.kz.modules.admin.mappers.CartMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void clearCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found"));
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    @Transactional(readOnly = true)
    public CartResponse getCartByUserId(Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found"));
        return autoparts.kz.modules.admin.mappers.CartMapper.toResponse(cart);
    }

    @Transactional
    public void removeItem(Long userId, Long productId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found"));
        cart.getItems().removeIf(item -> item.getProduct().getId().equals(productId));
        cartRepository.save(cart);
    }

    public Cart updateQuantity(Long userId, Long productId, int quantity) {
        Cart cart = getCartByUserIdEntity(userId);
        if (quantity <= 0) {
            cart.getItems().removeIf(i -> i.getProduct().getId().equals(productId));
        } else {
            var itemOpt = cart.getItems().stream()
                    .filter(i -> i.getProduct().getId().equals(productId))
                    .findFirst();
            if (itemOpt.isPresent()) {
                itemOpt.get().setQuantity(quantity);
            } else {
                Product product = productRepository.findById(productId).orElseThrow();
                CartItem item = new CartItem();
                item.setCart(cart);
                item.setProduct(product);
                item.setQuantity(quantity);
                cart.getItems().add(item);
            }
        }
        cartRepository.save(cart);
        return getCartByUserIdEntity(userId);
    }
}
