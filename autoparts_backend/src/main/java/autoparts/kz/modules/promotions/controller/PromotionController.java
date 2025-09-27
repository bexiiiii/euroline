package autoparts.kz.modules.promotions.controller;

import autoparts.kz.modules.promotions.entity.Promotion;
import autoparts.kz.modules.promotions.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/promotions") @RequiredArgsConstructor
public class PromotionController {
    private final PromotionRepository repo;
    @GetMapping
    public Page<Promotion> list(@RequestParam(required=false) String status, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size){
        Specification<Promotion> spec=(status==null)?null:(r, c, cb)->cb.equal(r.get("status"), status);
        return repo.findAll(spec, PageRequest.of(page,size, Sort.by("createdAt").descending()));
    }
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')") public Promotion create(@RequestBody Promotion p){ return repo.save(p); }
    @GetMapping("/{id}") public Promotion get(@PathVariable Long id){ return repo.findById(id).orElseThrow(); }
    @PutMapping("/{id}") @PreAuthorize("hasRole('ADMIN')") public Promotion update(@PathVariable Long id, @RequestBody Promotion p){ p.setId(id); return repo.save(p); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasRole('ADMIN')") public void delete(@PathVariable Long id){ repo.deleteById(id); }
    @PatchMapping("/{id}/status") @PreAuthorize("hasRole('ADMIN')") public Promotion status(@PathVariable Long id, @RequestParam String status){ var e=repo.findById(id).orElseThrow(); e.setStatus(status); return repo.save(e); }
    @GetMapping("/history") @PreAuthorize("hasRole('ADMIN')") public Page<Promotion> history(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="50") int size){ return repo.findAll(PageRequest.of(page,size)); }
    @GetMapping("/stats") @PreAuthorize("hasRole('ADMIN')") public Map<String,Object> stats(){ return Map.of("total", repo.count()); }
}