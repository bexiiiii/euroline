package autoparts.kz.modules.cart.service;

import autoparts.kz.modules.cart.entity.*;
import autoparts.kz.modules.cart.repository.*;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.manualProducts.repository.ProductRepository;
import autoparts.kz.modules.cml.service.ProductEnrichmentService;
import autoparts.kz.modules.cml.dto.WarehouseStockDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CartOfferTest {
    final CartRepository carts = mock(CartRepository.class);
    final ProductRepository products = mock(ProductRepository.class);
    final ProductEnrichmentService enrichment = mock(ProductEnrichmentService.class);
    final CartService service = new CartService(carts, mock(CartItemRepository.class), products, enrichment);
    final Cart cart = new Cart();
    final Product product = new Product();
    final ProductEnrichmentService.EnrichmentData data = new ProductEnrichmentService.EnrichmentData();
    @BeforeEach void setup() {
        cart.setItems(new ArrayList<>()); product.setId(9L);
        when(carts.findLockedByUserId(1L)).thenReturn(Optional.of(cart));
        when(carts.save(any())).thenAnswer(i -> i.getArgument(0));
        when(products.findById(9L)).thenReturn(Optional.of(product));
        data.setPrice(12500); data.setWarehouses(List.of(warehouse("main"), warehouse("second")));
        when(enrichment.enrichProduct(product)).thenReturn(Optional.of(data));
    }
    static WarehouseStockDTO warehouse(String key) {
        var w = new WarehouseStockDTO(); w.setWarehouseGuid(key); w.setWarehouseName(key + " warehouse");
        w.setQuantity(BigDecimal.valueOf(5)); return w;
    }
    @Test void snapshotsServerPriceAndWarehouseAndMergesOnlySameOffer() {
        service.addOffer(1L, 9L, "main", 2);
        service.addOffer(1L, 9L, "main", 1);
        service.addOffer(1L, 9L, "second", 1);
        assertEquals(2, cart.getItems().size());
        assertEquals(3, cart.getItems().get(0).getQuantity());
        assertEquals(BigDecimal.valueOf(12500), cart.getItems().get(0).getPrice());
        assertEquals("main warehouse", cart.getItems().get(0).getWarehouseName());
    }
    @Test void validatesAggregateQuantity() {
        service.addOffer(1L, 9L, "main", 4);
        assertThrows(IllegalArgumentException.class, () -> service.addOffer(1L, 9L, "main", 2));
        assertEquals(4, cart.getItems().get(0).getQuantity());
    }
    @Test void missingStockOrWrongWarehouseCannotBePurchased() {
        assertThrows(IllegalArgumentException.class, () -> service.addOffer(1L, 9L, "unknown", 1));
        data.setPrice(10); data.setWarehouses(null);
        assertThrows(IllegalArgumentException.class, () -> service.addOffer(1L, 9L, "main", 1));
    }
    @Test void productWithoutPriceCanBeOrderedAndPriceIsLeftForManager() {
        data.setPrice(null);
        service.addOffer(1L, 9L, "main", 1);
        assertNull(cart.getItems().get(0).getPrice());
    }
    @Test void updateIsScopedToOwnedCartLineAndRemovalDoesNotRequireAvailability() {
        service.addOffer(1L, 9L, "main", 2); cart.getItems().get(0).setId(123L);
        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.updateItem(1L, 999L, 1));
        data.setPrice(null);
        service.updateItem(1L, 123L, 0);
        assertTrue(cart.getItems().isEmpty());
    }
}
