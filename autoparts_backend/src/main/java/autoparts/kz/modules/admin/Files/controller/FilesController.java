package autoparts.kz.modules.admin.Files.controller;


import org.springframework.core.io.Resource;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FilesController {
    @PostMapping("/upload")
    public Map<String,String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        Path dir = Paths.get("storage/files"); Files.createDirectories(dir);
        Path path = dir.resolve(System.currentTimeMillis()+"_"+file.getOriginalFilename());
        Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
        return Map.of("id", path.getFileName().toString(), "url", "/files/"+path.getFileName());
    }
    @GetMapping("/{id}")
    public ResponseEntity<Resource> get(@PathVariable String id) throws IOException {
        Path path = Paths.get("storage/files").resolve(id);
        ByteArrayResource res = new ByteArrayResource(Files.readAllBytes(path));
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM).body(res);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) throws IOException { Files.deleteIfExists(Paths.get("storage/files").resolve(id)); }
}
