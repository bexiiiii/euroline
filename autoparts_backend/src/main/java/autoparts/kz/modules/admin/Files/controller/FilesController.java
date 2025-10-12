package autoparts.kz.modules.admin.Files.controller;

import autoparts.kz.modules.common.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FilesController {

    private final FileStorageService storageService;

    @PostMapping("/upload")
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        var stored = storageService.store(file, "images/uploads/");
        String encoded = storageService.encodeKey(stored.key());
        Map<String, String> response = new HashMap<>();
        response.put("id", encoded);
        response.put("url", stored.url());
        return response;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> get(@PathVariable String id) {
        String key = storageService.decodeKey(id);
        FileStorageService.StoredObjectContent content = storageService.load(key);
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (content.contentType() != null) {
            try {
                mediaType = MediaType.parseMediaType(content.contentType());
            } catch (Exception ignored) {
            }
        }
        ByteArrayResource resource = new ByteArrayResource(content.bytes());
        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(content.size() != null ? content.size() : content.bytes().length)
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        storageService.delete(storageService.decodeKey(id));
    }
}
