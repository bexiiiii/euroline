package autoparts.kz.modules.admin.settings.controller;

import autoparts.kz.modules.admin.settings.entity.ErrorLog;
import autoparts.kz.modules.admin.settings.repository.ErrorLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/error-logs") @RequiredArgsConstructor
public class AdminErrorLogsController {
    private final ErrorLogRepository repo;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<ErrorLog> list(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="50") int size){
        return repo.findAll(PageRequest.of(page,size, Sort.by("createdAt").descending()));
    }
    @GetMapping("/{id}") @PreAuthorize("hasRole('ADMIN')") public ErrorLog get(@PathVariable Long id){ return repo.findById(id).orElseThrow(); }
    @PatchMapping("/{id}") @PreAuthorize("hasRole('ADMIN')") public ErrorLog resolve(@PathVariable Long id, @RequestParam boolean resolved){
        var e=repo.findById(id).orElseThrow(); e.setResolved(resolved); return repo.save(e);
    }
    @DeleteMapping @PreAuthorize("hasRole('ADMIN')") public Map<String,Object> clear(){
        long before = repo.count(); repo.deleteAll(); return Map.of("deleted", before);
    }
    @GetMapping("/stats") @PreAuthorize("hasRole('ADMIN')") public Map<String,Object> stats(){
        long total = repo.count(); long unresolved = repo.count((r,c,cb)->cb.isFalse(r.get("resolved")));
        return Map.of("total", total, "unresolved", unresolved);
    }
}
