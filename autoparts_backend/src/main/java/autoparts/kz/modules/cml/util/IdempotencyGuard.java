package autoparts.kz.modules.cml.util;

import autoparts.kz.modules.cml.domain.entity.CmlProcessedMessage;
import autoparts.kz.modules.cml.repo.CmlProcessedMessageRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
public class IdempotencyGuard {

    private final CmlProcessedMessageRepository repository;

    public IdempotencyGuard(CmlProcessedMessageRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public boolean tryAcquire(String id, String type) {
        if (repository.existsById(id)) {
            return false;
        }
        repository.save(new CmlProcessedMessage(id, LocalDateTime.now(), type));
        return true;
    }
}
