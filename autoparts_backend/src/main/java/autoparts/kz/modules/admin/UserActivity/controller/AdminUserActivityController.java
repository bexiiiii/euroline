package autoparts.kz.modules.admin.UserActivity.controller;


import autoparts.kz.modules.admin.UserActivity.entity.UserActivity;
import autoparts.kz.modules.admin.UserActivity.repository.UserActivityRepository;
import autoparts.kz.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/users") @RequiredArgsConstructor
public class AdminUserActivityController {
    private final UserActivityRepository repo;
    private final UserRepository userRepo;

    @GetMapping("/activity") @PreAuthorize("hasRole('ADMIN')")
    public Page<UserActivity> list(@RequestParam(required=false) Long userId,
                                   @RequestParam(required=false) String module,
                                   @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="50") int size){
        Specification<UserActivity> spec = Specification.where(null);
        
        if (userId != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("userId"), userId));
        }
        
        if (module != null && !module.isBlank()) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("module"), module));
        }
        
        return repo.findAll(spec, PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    @PostMapping("/activity")
    public UserActivity record(@RequestBody UserActivity activity, HttpServletRequest request) {
        // Enhance activity with request information
        if (activity.getIpAddress() == null) {
            activity.setIpAddress(getClientIpAddress(request));
        }
        if (activity.getUserAgent() == null) {
            activity.setUserAgent(request.getHeader("User-Agent"));
        }
        
        // Set user name if not provided
        if (activity.getUserName() == null && activity.getUserId() != null) {
            userRepo.findById(activity.getUserId()).ifPresent(user -> {
                String name = user.getName() != null && user.getSurname() != null 
                    ? user.getName() + " " + user.getSurname()
                    : user.getClientName() != null ? user.getClientName() : user.getEmail();
                activity.setUserName(name);
            });
        }
        
        return repo.save(activity);
    }

    @GetMapping("/{id}/activity") @PreAuthorize("hasRole('ADMIN')")
    public Page<UserActivity> byUser(@PathVariable Long id, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="50") int size){
        return list(id, null, page, size);
    }
    
    @GetMapping("/activity/stats") @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> stats() {
        long total = repo.count();
        return Map.of("total", total);
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
