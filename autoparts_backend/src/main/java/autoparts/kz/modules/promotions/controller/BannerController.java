package autoparts.kz.modules.promotions.controller;

import autoparts.kz.modules.promotions.entity.Banner;
import autoparts.kz.modules.promotions.repository.BannerRepository;
import autoparts.kz.modules.common.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
public class BannerController {
    private final BannerRepository repo;
    private final FileStorageService storageService;

    @GetMapping
    public Page<Banner> list(@RequestParam(required=false) String status, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size){
        Specification<Banner> spec=(status==null)?null:(r, c, cb)->cb.equal(r.get("status"), status);
        return repo.findAll(spec, PageRequest.of(page,size, Sort.by("createdAt").descending()));
    }
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')") public Banner create(@RequestBody Banner b){ return repo.save(b); }
    @GetMapping("/{id}") public Banner get(@PathVariable Long id){ return repo.findById(id).orElseThrow(); }
    @PutMapping("/{id}") @PreAuthorize("hasRole('ADMIN')") public Banner update(@PathVariable Long id, @RequestBody Banner b){ b.setId(id); return repo.save(b); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasRole('ADMIN')") public void delete(@PathVariable Long id){ repo.deleteById(id); }
    @PatchMapping("/{id}/status") @PreAuthorize("hasRole('ADMIN')") public Banner status(@PathVariable Long id, @RequestParam String status){ var e=repo.findById(id).orElseThrow(); e.setStatus(status); return repo.save(e); }

    // upload
    @PostMapping("/{id}/upload") @PreAuthorize("hasRole('ADMIN')")
    public Banner upload(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        var b = repo.findById(id).orElseThrow();

        var stored = storageService.store(file, "images/banners/");
        b.setImageUrl(stored.url());
        return repo.save(b);
    }
    
    // Debug endpoint to fix existing banner URLs
    @PostMapping("/fix-urls")
    @PreAuthorize("hasRole('ADMIN')")
    public String fixBannerUrls() {
        var banners = repo.findAll();
        int updated = 0;
        
        for (var banner : banners) {
            String oldUrl = banner.getImageUrl();
            if (oldUrl != null && oldUrl.contains("/files/")) {
                String filename = oldUrl.substring(oldUrl.lastIndexOf("/") + 1);
                // Sanitize filename to match our file renaming
                String sanitizedFilename = filename
                    .replaceAll("[^a-zA-Z0-9._-]", "_")
                    .replaceAll("_+", "_");
                
                String newUrl = "/files/" + sanitizedFilename;
                if (!oldUrl.equals(newUrl)) {
                    banner.setImageUrl(newUrl);
                    repo.save(banner);
                    updated++;
                }
            }
        }
        
        return "Updated " + updated + " banner URLs";
    }
}
