package autoparts.kz.modules.admin.Events.controller;

import autoparts.kz.modules.admin.Events.entity.EventLog;
import autoparts.kz.modules.admin.Events.repository.EventLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// controller/EventController.java
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {
    private final EventLogRepository repo;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<EventLog> list(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="50") int size){
        return repo.findAll(PageRequest.of(page,size, Sort.by("createdAt").descending()));
    }
    @PostMapping
    public EventLog create(@RequestBody EventLog e){ return repo.save(e); }
    @GetMapping("/{id}") @PreAuthorize("hasRole('ADMIN')") public EventLog get(@PathVariable Long id){ return repo.findById(id).orElseThrow(); }
    @GetMapping("/stats") @PreAuthorize("hasRole('ADMIN')") public Map<String,Object> stats(){ return Map.of("total", repo.count()); }
    @DeleteMapping @PreAuthorize("hasRole('ADMIN')") public Map<String,Object> clear(){ long before=repo.count(); repo.deleteAll(); return Map.of("deleted", before); }
}
