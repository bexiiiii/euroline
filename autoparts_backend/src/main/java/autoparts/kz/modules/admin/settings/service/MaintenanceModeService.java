package autoparts.kz.modules.admin.settings.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class MaintenanceModeService {

    private final AtomicBoolean maintenanceEnabled = new AtomicBoolean(false);
    private final AtomicReference<Instant> lastUpdated = new AtomicReference<>(Instant.now());

    public boolean isEnabled() {
        return maintenanceEnabled.get();
    }

    public Instant getLastUpdated() {
        return lastUpdated.get();
    }

    public void setEnabled(boolean enabled) {
        maintenanceEnabled.set(enabled);
        lastUpdated.set(Instant.now());
    }

    public Map<String, Object> statusPayload() {
        return Map.of(
                "enabled", isEnabled(),
                "timestamp", getLastUpdated().toEpochMilli()
        );
    }
}
