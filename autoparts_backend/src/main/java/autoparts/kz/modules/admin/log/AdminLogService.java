package autoparts.kz.modules.admin.log;




import autoparts.kz.modules.auth.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminLogService {

    private final LogRepository logRepository;

    public void log(User admin, String action, String description) {
        AdminLog log = new AdminLog();
        log.setPerformedBy(admin);
        log.setAction(action);
        log.setDescription(description);
        logRepository.save(log);
    }
    public List<LogResponse> getAllLogs() {
        return logRepository.findAll().stream()
                .map(log -> new LogResponse(
                        log.getId(),
                        log.getAction(),
                        log.getDescription(),
                        log.getPerformedBy().getEmail(),
                        log.getTimestamp().toString()
                ))
                .collect(Collectors.toList());
    }

}

