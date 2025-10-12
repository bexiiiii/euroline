package autoparts.kz.modules.admin.Files.controller;

import autoparts.kz.modules.common.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImagesController {

    private final FileStorageService storageService;

    @PostMapping("/upload")
    public Map<String,String> upload(@RequestParam("image") MultipartFile image) throws IOException {
        var stored = storageService.store(image, "images/");
        return Map.of(
                "url", stored.url(),
                "id", storageService.encodeKey(stored.key())
        );
    }

    @PostMapping("/resize")
    public Map<String,String> resize(@RequestParam("image") MultipartFile image,
                                     @RequestParam int width, @RequestParam int height) throws IOException {
        BufferedImage src = ImageIO.read(image.getInputStream());
        BufferedImage out = Thumbnails.of(src).size(width, height).asBufferedImage();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(out, "png", baos);

        var stored = storageService.store(baos.toByteArray(), MediaType.IMAGE_PNG_VALUE,
                "images/resized/", image.getOriginalFilename());
        return Map.of(
                "url", stored.url(),
                "id", storageService.encodeKey(stored.key())
        );
    }
}
