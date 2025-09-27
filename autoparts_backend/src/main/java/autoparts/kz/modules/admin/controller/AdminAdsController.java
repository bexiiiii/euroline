package autoparts.kz.modules.admin.controller;


import autoparts.kz.modules.admin.dto.AdsRequest;
import autoparts.kz.modules.admin.dto.AdsResponse;
import autoparts.kz.modules.admin.service.AdminAdsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/files/ads")
public class AdminAdsController {

    private final AdminAdsService adminAdsService;
    public AdminAdsController(AdminAdsService adminAdsService) {
        this.adminAdsService = adminAdsService;
    }
    private final String UPLOAD_DIR = "uploads/";

    @PostMapping("/upload")
    public ResponseEntity<String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path path = Paths.get(UPLOAD_DIR + filename);
        Files.copy(file.getInputStream(), path);

        String fileUrl = "/uploads/" + filename;
        return ResponseEntity.ok(fileUrl);
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
