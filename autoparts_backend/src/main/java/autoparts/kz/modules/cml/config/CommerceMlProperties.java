package autoparts.kz.modules.cml.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

@Component
@Validated
@ConfigurationProperties(prefix = "cml")
public class CommerceMlProperties {

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    @NotEmpty
    private List<String> allowedIps = new ArrayList<>();

    @Min(1)
    private int maxFileSizeMb = 50;

    @Min(1)
    private int maxUnzippedSizeMb = 500;

    @Min(1)
    private int batchSize = 5000;

    @Min(1)
    private long ordersExportIntervalMs = 300_000;

    @NotNull
    private QueueProperties queue = new QueueProperties();

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public List<String> getAllowedIps() {
        return allowedIps;
    }

    public void setAllowedIps(List<String> allowedIps) {
        this.allowedIps = allowedIps;
    }

    public int getMaxFileSizeMb() {
        return maxFileSizeMb;
    }

    public void setMaxFileSizeMb(int maxFileSizeMb) {
        this.maxFileSizeMb = maxFileSizeMb;
    }

    public int getMaxUnzippedSizeMb() {
        return maxUnzippedSizeMb;
    }

    public void setMaxUnzippedSizeMb(int maxUnzippedSizeMb) {
        this.maxUnzippedSizeMb = maxUnzippedSizeMb;
    }

    public int getBatchSize() {
        return batchSize;
    }

    public void setBatchSize(int batchSize) {
        this.batchSize = batchSize;
    }

    public QueueProperties getQueue() {
        return queue;
    }

    public void setQueue(QueueProperties queue) {
        this.queue = queue;
    }

    public long getOrdersExportIntervalMs() {
        return ordersExportIntervalMs;
    }

    public void setOrdersExportIntervalMs(long ordersExportIntervalMs) {
        this.ordersExportIntervalMs = ordersExportIntervalMs;
    }

    @Validated
    public static class QueueProperties {

        @NotBlank
        private String exchange = "cml.exchange";

        @NotBlank
        private String catalogRoutingKey = "catalog.import";

        @NotBlank
        private String offersRoutingKey = "offers.import";

        @NotBlank
        private String ordersExportRoutingKey = "orders.export";

        @NotBlank
        private String ordersApplyRoutingKey = "orders.apply";

        @NotBlank
        private String ordersIntegrationRoutingKey = "orders.integration";

        @NotBlank
        private String returnsIntegrationRoutingKey = "returns.integration";

        public String getExchange() {
            return exchange;
        }

        public void setExchange(String exchange) {
            this.exchange = exchange;
        }

        public String getCatalogRoutingKey() {
            return catalogRoutingKey;
        }

        public void setCatalogRoutingKey(String catalogRoutingKey) {
            this.catalogRoutingKey = catalogRoutingKey;
        }

        public String getOffersRoutingKey() {
            return offersRoutingKey;
        }

        public void setOffersRoutingKey(String offersRoutingKey) {
            this.offersRoutingKey = offersRoutingKey;
        }

        public String getOrdersExportRoutingKey() {
            return ordersExportRoutingKey;
        }

        public void setOrdersExportRoutingKey(String ordersExportRoutingKey) {
            this.ordersExportRoutingKey = ordersExportRoutingKey;
        }

        public String getOrdersApplyRoutingKey() {
            return ordersApplyRoutingKey;
        }

        public void setOrdersApplyRoutingKey(String ordersApplyRoutingKey) {
            this.ordersApplyRoutingKey = ordersApplyRoutingKey;
        }

        public String getOrdersIntegrationRoutingKey() {
            return ordersIntegrationRoutingKey;
        }

        public void setOrdersIntegrationRoutingKey(String ordersIntegrationRoutingKey) {
            this.ordersIntegrationRoutingKey = ordersIntegrationRoutingKey;
        }

        public String getReturnsIntegrationRoutingKey() {
            return returnsIntegrationRoutingKey;
        }

        public void setReturnsIntegrationRoutingKey(String returnsIntegrationRoutingKey) {
            this.returnsIntegrationRoutingKey = returnsIntegrationRoutingKey;
        }
    }
}
