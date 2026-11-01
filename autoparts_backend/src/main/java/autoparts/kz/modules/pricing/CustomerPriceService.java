package autoparts.kz.modules.pricing;

import autoparts.kz.common.security.SimplePrincipal;
import autoparts.kz.modules.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Locale;

/**
 * Какой вид цены 1С показывать клиенту.
 * Оптовикам (users.type = "Оптовая торговля") — "оптовая", всем остальным и гостям — "Прайс-лист".
 * "Приходная цена" (закупочная) на витрину не попадает никогда.
 */
@Service
public class CustomerPriceService {

    private final UserRepository userRepository;
    private final String retailPriceType;
    private final String wholesalePriceType;

    public CustomerPriceService(
            UserRepository userRepository,
            @Value("${onec.prices.retail-type-ref-key:08430c1c-5f35-11f1-9248-7c214aee94f8}") String retailPriceType,
            @Value("${onec.prices.wholesale-type-ref-key:13f3d81c-5fe8-11f1-9840-ac1f6bdbe64e}") String wholesalePriceType
    ) {
        this.userRepository = userRepository;
        this.retailPriceType = retailPriceType;
        this.wholesalePriceType = wholesalePriceType;
    }

    /** Розничный вид цены: им заполняется products.price (гости, списки, админка). */
    public String retailPriceType() {
        return retailPriceType;
    }

    public String priceTypeForUser(Long userId) {
        if (userId == null) {
            return retailPriceType;
        }
        return userRepository.findById(userId)
                .map(user -> isWholesale(user.getType()) ? wholesalePriceType : retailPriceType)
                .orElse(retailPriceType);
    }

    /** Вид цены для пользователя текущего запроса; без авторизации — розница. */
    public String currentPriceType() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SimplePrincipal principal) {
            return priceTypeForUser(principal.id());
        }
        return retailPriceType;
    }

    static boolean isWholesale(String customerType) {
        return customerType != null && customerType.toLowerCase(Locale.ROOT).contains("опт");
    }
}
