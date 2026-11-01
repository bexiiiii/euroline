package autoparts.kz.modules.onecOrders;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "integration.onec-orders")
public class OneCOrderProperties {
    private boolean enabled;
    private String url;
    private String username;
    private String password;
    private String token;
    private String caCertificate;
    private String organizationRefKey;
    private String warehouseRefKey;
    private String odataUrl;
    private String currencyRefKey;
    private java.time.LocalDateTime createdAfter = java.time.LocalDateTime.of(1970, 1, 1, 0, 0);
}
