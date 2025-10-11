package autoparts.kz.modules.admin.controller;


import autoparts.kz.modules.admin.dto.AdsRequest;
import autoparts.kz.modules.admin.dto.AdsResponse;
import autoparts.kz.modules.admin.service.AdminAdsService;
import autoparts.kz.modules.common.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/files/ads")
@RequiredArgsConstructor
public class AdminAdsController {

    private final AdminAdsService adminAdsService;
    private final FileStorageService storageService;

    @PostMapping("/upload")
    public ResponseEntity<String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        var stored = storageService.store(file, "admin/ads/");
        return ResponseEntity.ok(stored.url());
    }

    @GetMapping
    public List<AdsResponse> getAllAds() {
        return adminAdsService.getAllAds();
    }

    @PostMapping
    public ResponseEntity<?> addAd(@RequestBody AdsRequest request) {
        adminAdsService.addAd(request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAd(@PathVariable Long id) {
        adminAdsService.deleteAd(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<?> activateAd(@PathVariable Long id) {
        adminAdsService.setActive(id, true);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivateAd(@PathVariable Long id) {
        adminAdsService.setActive(id, false);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAd(@PathVariable Long id, @RequestBody AdsRequest request) {
        adminAdsService.updateAd(id, request);
        return ResponseEntity.ok().build();
    }
}
