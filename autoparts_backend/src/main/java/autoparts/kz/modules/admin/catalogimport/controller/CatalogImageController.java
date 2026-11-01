package autoparts.kz.modules.admin.catalogimport.controller;

import autoparts.kz.modules.admin.catalogimport.service.PdfCatalogImportService;
import autoparts.kz.modules.cml.service.S3Storage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

/**
 * Публичная отдача фото товаров из PDF-каталогов (GET /api/products/** открыт без авторизации).
 * Отдаются только ключи catalog-import/*.png — остальное хранилище наружу не светим.
 */
@RestController
@RequiredArgsConstructor
public class CatalogImageController {

    private final S3Storage s3;

    @GetMapping("/api/products/catalog-images/{id}")
    public ResponseEntity<byte[]> image(@PathVariable String id) {
        String key;
        try {
            key = new String(Base64.getUrlDecoder().decode(id), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
        if (!key.startsWith(PdfCatalogImportService.KEY_PREFIX) || !key.endsWith(".png") || key.contains("..")) {
            return ResponseEntity.notFound().build();
        }
        try {
            byte[] bytes = s3.getObject(key);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
