package autoparts.kz.modules.cml.repo;

import autoparts.kz.modules.cml.domain.entity.CmlProcessedMessage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CmlProcessedMessageRepository extends JpaRepository<CmlProcessedMessage, String> {
}
