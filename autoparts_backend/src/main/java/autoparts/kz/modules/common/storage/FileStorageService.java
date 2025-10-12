package autoparts.kz.modules.common.storage;

import autoparts.kz.modules.cml.service.S3Storage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.UUID;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final S3Storage s3Storage;

    private String normalizePrefix(String prefix) {
        String normalized = (prefix == null || prefix.isBlank()) ? "images/" : prefix.trim();
        if (!normalized.endsWith("/")) {
            normalized = normalized + "/";
        }
        return normalized;
    }

    public StoredObject store(MultipartFile file, String prefix) throws IOException {
        String resolvedPrefix = normalizePrefix(prefix);
        String originalName = StringUtils.hasText(file.getOriginalFilename())
                ? Paths.get(file.getOriginalFilename()).getFileName().toString()
                : "file";
        String extension = "";
        int idx = originalName.lastIndexOf('.');
        if (idx != -1) {
            extension = originalName.substring(idx);
        }

        String key = resolvedPrefix +
                Instant.now().toEpochMilli() + "_" + UUID.randomUUID() + extension;

        String contentType = file.getContentType();
        if (!StringUtils.hasText(contentType)) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        s3Storage.putObject(key, file.getBytes(), contentType);

        return new StoredObject(key, s3Storage.publicUrl(key), contentType, file.getSize());
    }

    public StoredObject store(byte[] content, String contentType, String prefix, String filenameHint) {
        String resolvedPrefix = normalizePrefix(prefix);
        String safeName = StringUtils.hasText(filenameHint)
                ? Paths.get(filenameHint).getFileName().toString()
                : "object";
        String extension = "";
        int idx = safeName.lastIndexOf('.');
        if (idx != -1) {
            extension = safeName.substring(idx);
        }

        String key = resolvedPrefix +
                Instant.now().toEpochMilli() + "_" + UUID.randomUUID() + extension;

        String type = StringUtils.hasText(contentType) ? contentType : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        s3Storage.putObject(key, content, type);
        return new StoredObject(key, s3Storage.publicUrl(key), type, (long) content.length);
    }

    public StoredObjectContent load(String key) {
        var response = s3Storage.getObjectResponse(key);
        return new StoredObjectContent(
                response.asByteArray(),
                response.response().contentType(),
                response.response().contentLength()
        );
    }

    public void delete(String key) {
        s3Storage.deleteObject(key);
    }

    public record StoredObject(String key, String url, String contentType, Long size) {}
    public record StoredObjectContent(byte[] bytes, String contentType, Long size) {}

    public String encodeKey(String key) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(key.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    public String decodeKey(String encoded) {
        return new String(Base64.getUrlDecoder().decode(encoded), java.nio.charset.StandardCharsets.UTF_8);
    }
}
