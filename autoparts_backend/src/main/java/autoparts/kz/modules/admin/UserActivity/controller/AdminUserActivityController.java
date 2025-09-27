package autoparts.kz.modules.admin.UserActivity.controller;


import autoparts.kz.modules.admin.UserActivity.entity.UserActivity;
import autoparts.kz.modules.admin.UserActivity.repository.UserActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users") @RequiredArgsConstructor
public class AdminUserActivityController {
    private final UserActivityRepository repo;

    @GetMapping("/activity") @PreAuthorize("hasRole('ADMIN')")
    public Page<UserActivity> list(@RequestParam(required=false) Long userId,
                                   @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="50") int size){
        Specification<UserActivity> spec=(userId==null)?null:(r, c, cb)->cb.equal(r.get("userId"), userId);
        return repo.findAll(spec, PageRequest.of(page,size, Sort.by("createdAt").descending()));
    }

    @PostMapping("/activity")
    public UserActivity record(@RequestBody UserActivity a){ return repo.save(a); }

    @GetMapping("/{id}/activity") @PreAuthorize("hasRole('ADMIN')")
    public Page<UserActivity> byUser(@PathVariable Long id, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="50") int size){
        return list(id, page, size);
    }
}
