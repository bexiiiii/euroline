package autoparts.kz.modules.kaspi.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.Duration;

/**
 * Kaspi Pay top-ups through the kaspi-pos-automation sidecar (docker/kaspi-pos).
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "kaspi")
public class KaspiProperties {
    /** Master switch for Kaspi top-ups (storefront hides the option when false or not connected). */
    private boolean enabled = true;
    /** Base URL of the internal sidecar, e.g. http://kaspi:3000 */
    private String sidecarUrl = "http://localhost:3010";
    private Duration connectTimeout = Duration.ofSeconds(5);
    private Duration readTimeout = Duration.ofSeconds(30);
    private BigDecimal minAmount = new BigDecimal("100");
    private BigDecimal maxAmount = new BigDecimal("1000000");
    /** Max simultaneously pending Kaspi top-ups per client. */
    private int maxPendingPerClient = 3;
    /** Our own deadline for an unpaid invoice; after it we cancel the invoice at Kaspi. */
    private Duration invoiceTtl = Duration.ofHours(24);
    /** Used when Kaspi does not return ExpireDate for a QR. */
    private Duration qrTtl = Duration.ofMinutes(5);
    /** A QR never scanned (still QrTokenCreated) this long after its expiry is rejected locally. */
    private Duration qrGrace = Duration.ofMinutes(5);
    /** If Kaspi still reports a non-final status this long after expiry, reject locally. */
    private Duration hardStopAfterExpiry = Duration.ofHours(24);
    /** Status polling cadence for pending Kaspi top-ups (ms). */
    private long pollIntervalMs = 5000;
    /** Max pending top-ups checked per poll tick. */
    private int pollBatchSize = 50;
    /** Min gap between on-demand status checks of one top-up triggered by the client. */
    private Duration onDemandCheckGap = Duration.ofSeconds(3);
    /** Text put into the Kaspi invoice comment; top-up id is appended. */
    private String commentPrefix = "Пополнение баланса Euroline";
}
