package autoparts.kz.modules.pricing;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CustomerPriceServiceTest {

    @Test
    void wholesaleDetectedFromUserType() {
        assertTrue(CustomerPriceService.isWholesale("Оптовая торговля"));
        assertTrue(CustomerPriceService.isWholesale("оптовик"));
        assertFalse(CustomerPriceService.isWholesale("Розничная торговля"));
        assertFalse(CustomerPriceService.isWholesale(""));
        assertFalse(CustomerPriceService.isWholesale(null));
    }
}
