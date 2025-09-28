package autoparts.kz.modules.admin.Events.controller;

import autoparts.kz.modules.admin.Events.entity.EventLog;
import autoparts.kz.modules.admin.Events.repository.EventLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/event-logs")
@RequiredArgsConstructor
public class EventController {
    private final EventLogRepository repo;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<EventLog> list(@RequestParam(required=false) String eventType,
                               @RequestParam(required=false) String entityType,
                               @RequestParam(required=false) Boolean success,
                               @RequestParam(required=false) String startDate,
                               @RequestParam(required=false) String endDate,
                               @RequestParam(defaultValue="0") int page, 
                               @RequestParam(defaultValue="20") int size,
                               @RequestParam(defaultValue="createdAt,desc") String sort){
        
        Specification<EventLog> spec = Specification.where(null);
        
        if (eventType != null && !eventType.isBlank()) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("eventType"), eventType));
        }
        
        if (entityType != null && !entityType.isBlank()) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("entityType"), entityType));
        }
        
        if (success != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("success"), success));
        }
        
        // Parse sort parameter
        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction = sortParts.length > 1 && "asc".equalsIgnoreCase(sortParts[1]) 
            ? Sort.Direction.ASC : Sort.Direction.DESC;
        
        return repo.findAll(spec, PageRequest.of(page, size, Sort.by(direction, sortField)));
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public EventLog create(@RequestBody EventLog eventLog, HttpServletRequest request) {
        // Enhance with request data
        if (eventLog.getIpAddress() == null) {
            eventLog.setIpAddress(getClientIpAddress(request));
        }
        if (eventLog.getUserAgent() == null) {
            eventLog.setUserAgent(request.getHeader("User-Agent"));
        }
        
        return repo.save(eventLog);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public EventLog get(@PathVariable Long id) {
        return repo.findById(id).orElseThrow();
    }
    
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> stats(@RequestParam(defaultValue="30") int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        
        long total = repo.count();
        long recent = repo.count((root, cq, cb) -> 
            cb.greaterThanOrEqualTo(root.get("createdAt"), since));
        long errors = repo.count((root, cq, cb) -> 
            cb.and(cb.equal(root.get("success"), false),
                   cb.greaterThanOrEqualTo(root.get("createdAt"), since)));
        
        return Map.of(
            "totalEvents", total,
            "recentEvents", recent,
            "errorEvents", errors,
            "days", days
        );
    }
    
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<EventLog> byUser(@PathVariable Long userId, 
                                 @RequestParam(defaultValue="0") int page, 
                                 @RequestParam(defaultValue="20") int size) {
        return repo.findAll((root, cq, cb) -> cb.equal(root.get("userId"), userId),
                           PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }
    
    @GetMapping("/errors")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<EventLog> errors(@RequestParam(defaultValue="0") int page, 
                                 @RequestParam(defaultValue="20") int size,
                                 @RequestParam(defaultValue="24") int hours) {
        Instant since = Instant.now().minus(hours, ChronoUnit.HOURS);
        return repo.findAll((root, cq, cb) -> 
            cb.and(cb.equal(root.get("success"), false),
                   cb.greaterThanOrEqualTo(root.get("createdAt"), since)),
            PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }
    
    @GetMapping("/event-types")
    @PreAuthorize("hasRole('ADMIN')")
    public List<String> getEventTypes() {
        return repo.findDistinctEventTypes();
    }
    
    @PostMapping("/test-real-event")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> createTestRealEvent() {
        EventLog realEvent = new EventLog();
        realEvent.setEventType("ADMIN_ACTION");
        realEvent.setEntityType("SYSTEM");
        realEvent.setDescription("Проверка реального логирования событий");
        realEvent.setDetails("Это событие создано администратором через админ-панель");
        realEvent.setUserName("Администратор");
        realEvent.setIpAddress("127.0.0.1");
        realEvent.setUserAgent("Admin Panel / Test Event");
        realEvent.setSuccess(true);
        realEvent.setCreatedAt(Instant.now());
        
        EventLog saved = repo.save(realEvent);
        return Map.of("created", true, "eventId", saved.getId(), "message", "Тестовое реальное событие создано");
    }
    
    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> clear() {
        long before = repo.count();
        repo.deleteAll();
        return Map.of("deleted", before);
    }
    
    @DeleteMapping("/cleanup")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> cleanup(@RequestParam int days) {
        Instant cutoff = Instant.now().minus(days, ChronoUnit.DAYS);
        List<EventLog> oldLogs = repo.findAll((root, cq, cb) -> 
            cb.lessThan(root.get("createdAt"), cutoff));
        int count = oldLogs.size();
        repo.deleteAll(oldLogs);
        return Map.of("deletedCount", count);
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}
