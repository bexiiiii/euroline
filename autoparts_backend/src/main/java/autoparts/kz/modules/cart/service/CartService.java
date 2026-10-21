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
    private final autoparts.kz.modules.cml.service.ProductEnrichmentService enrichmentService;

    /** New storefront path: identity, warehouse and price are resolved on the server. */
    @Transactional
    public Cart addOffer(Long userId, Long productId, String warehouseRefKey, int quantity) {
        Cart cart = cartRepository.findLockedByUserId(userId).orElseGet(() -> getCartByUserIdEntity(userId));
        if (cart.getItems() == null) cart.setItems(new java.util.ArrayList<>());
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Товар не найден"));
        CartItem item = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId)
                        && java.util.Objects.equals(i.getWarehouseRefKey(), warehouseRefKey))
                .findFirst().orElse(null);
        long total = (long) quantity + (item == null ? 0 : item.getQuantity());
        if (total > autoparts.kz.common.constants.ValidationConstants.MAX_QUANTITY || quantity <= 0) {
            throw new IllegalArgumentException("Недопустимое количество");
        }
        if (item == null) {
            item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            item.setWarehouseRefKey(warehouseRefKey);
            cart.getItems().add(item);
        }
        validateOffer(item, (int) total);
        item.setQuantity((int) total);
        return cartRepository.save(cart);
    }

    @Transactional
    public Cart updateItem(Long userId, Long itemId, int quantity) {
        Cart cart = cartRepository.findLockedByUserId(userId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Корзина не найдена"));
        CartItem item = cart.getItems().stream().filter(i -> itemId.equals(i.getId())).findFirst()
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Позиция корзины не найдена"));
        if (quantity == 0) cart.getItems().remove(item);
        else {
            if (quantity < 1 || quantity > autoparts.kz.common.constants.ValidationConstants.MAX_QUANTITY) {
                throw new IllegalArgumentException("Недопустимое количество");
            }
            // Preserve legacy quote/catalog carts without a warehouse; the new offer path always has one.
            if (item.getWarehouseRefKey() != null && !item.getWarehouseRefKey().isBlank()) validateOffer(item, quantity);
            item.setQuantity(quantity);
        }
        return cartRepository.save(cart);
    }

    private void validateOffer(CartItem item, int quantity) {
        if (quantity < 1 || quantity > autoparts.kz.common.constants.ValidationConstants.MAX_QUANTITY) {
            throw new IllegalArgumentException("Недопустимое количество");
        }
        var data = enrichmentService.enrichProduct(item.getProduct())
                .orElseThrow(() -> new IllegalArgumentException("Предложение больше недоступно. Повторите поиск."));
        if (data.getPrice() == null || data.getPrice() <= 0) {
            throw new IllegalArgumentException("Цена пока не подтверждена. Уточните её у менеджера.");
        }
        if (item.getWarehouseRefKey() == null || item.getWarehouseRefKey().isBlank()) {
            throw new IllegalArgumentException("Выберите склад в результатах поиска");
        }
        if (data.getWarehouses() == null) {
            throw new IllegalArgumentException("Остатки по складам пока не подтверждены");
        }
        var warehouse = data.getWarehouses().stream()
                .filter(w -> item.getWarehouseRefKey().equals(w.getWarehouseGuid())).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Предложение выбранного склада больше недоступно"));
        if (warehouse.getQuantity() == null || warehouse.getQuantity().compareTo(java.math.BigDecimal.valueOf(quantity)) < 0) {
            throw new IllegalArgumentException("Недостаточно товара на выбранном складе. Обновите поиск.");
        }
        item.setPrice(java.math.BigDecimal.valueOf(data.getPrice()));
        item.setWarehouseName(warehouse.getWarehouseName() == null ? warehouse.getWarehouseGuid() : warehouse.getWarehouseName());
    }

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
            // Обновляем цену на случай если она изменилась
            existing.get().setPrice(product.getPrice() != null ? java.math.BigDecimal.valueOf(product.getPrice()) : null);
        } else {
            CartItem item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            item.setQuantity(quantity);
            // ✅ ИСПРАВЛЕНИЕ: Устанавливаем цену из продукта при добавлении в корзину
            item.setPrice(product.getPrice() != null ? java.math.BigDecimal.valueOf(product.getPrice()) : null);
            cart.getItems().add(item);
        }
        return cartRepository.save(cart);
    }

    /**
     * Добавляет товар в корзину по OEM/коду. Если товара с таким кодом нет в ручном каталоге,
     * создаёт минимальную запись Product и затем добавляет её в корзину.
     */
    public Cart addToCartByOem(Long userId, String oem, String name, String brand, Integer price, String imageUrl,
                               String warehouseName, String warehouseRefKey, int quantity) {
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
                    p.setImageUrl(trustedImageUrl(imageUrl));
                    if (price != null) p.setPrice(price);
                    return productRepository.save(p);
                });

        // The search response can contain a live 1C price even for a product
        // originally created from a UMAPI offer. Keep that value for the cart.
        boolean productChanged = false;
        if (price != null) {
            product.setPrice(price);
            productChanged = true;
        }
        // Товар мог быть создан раньше без фото — дополним, если поиск его прислал.
        String safeImageUrl = trustedImageUrl(imageUrl);
        if ((product.getImageUrl() == null || product.getImageUrl().isBlank()) && safeImageUrl != null) {
            product.setImageUrl(safeImageUrl);
            productChanged = true;
        }
        if (productChanged) {
            product = productRepository.save(product);
        }

        Long productId = product.getId();
        Cart updatedCart = addOrUpdate(cart, productId, quantity);
        updatedCart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst()
                .ifPresent(item -> {
                    if (price != null) {
                        item.setPrice(java.math.BigDecimal.valueOf(price));
                    }
                    if (warehouseName != null && !warehouseName.isBlank()) {
                        item.setWarehouseName(warehouseName);
                    }
                    if (warehouseRefKey != null && !warehouseRefKey.isBlank()) {
                        item.setWarehouseRefKey(warehouseRefKey);
                    }
                });
        cartRepository.save(updatedCart);
        return getCartByUserIdEntity(userId);
    }

    // URL фото приходит от клиента, а товар общий для всех: принимаем только картинки UMAPI.
    private static final java.util.regex.Pattern TRUSTED_IMAGE_URL = java.util.regex.Pattern.compile(
            "^https://image\\.umapi\\.ru/IMAGE/\\d+/[0-9a-fA-F]+\\.(webp|jpe?g|png|gif)$");

    private static String trustedImageUrl(String imageUrl) {
        if (imageUrl == null) {
            return null;
        }
        String trimmed = imageUrl.trim();
        return TRUSTED_IMAGE_URL.matcher(trimmed).matches() ? trimmed : null;
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
                // Обновляем цену на случай если она изменилась
                Product product = productRepository.findById(productId).orElse(null);
                if (product != null && product.getPrice() != null) {
                    itemOpt.get().setPrice(java.math.BigDecimal.valueOf(product.getPrice()));
                }
            } else {
                Product product = productRepository.findById(productId).orElseThrow();
                CartItem item = new CartItem();
                item.setCart(cart);
                item.setProduct(product);
                item.setQuantity(quantity);
                // ✅ ИСПРАВЛЕНИЕ: Устанавливаем цену из продукта
                item.setPrice(product.getPrice() != null ? java.math.BigDecimal.valueOf(product.getPrice()) : null);
                cart.getItems().add(item);
            }
        }
        cartRepository.save(cart);
        return getCartByUserIdEntity(userId);
    }
}
