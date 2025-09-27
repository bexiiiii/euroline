package autoparts.kz.modules.admin.Files.controller;

import net.coobird.thumbnailator.Thumbnails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;

@RestController
@RequestMapping("/api/images")
public class ImagesController {
    @PostMapping("/upload")
    public Map<String,String> upload(@RequestParam("image") MultipartFile image) throws IOException {
        Path dir = Paths.get("storage/images"); Files.createDirectories(dir);
        Path path = dir.resolve(System.currentTimeMillis()+"_"+image.getOriginalFilename());
        Files.copy(image.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
        return Map.of("url", "/files/"+path.getFileName());
    }

    @PostMapping("/resize")
    public Map<String,String> resize(@RequestParam("image") MultipartFile image,
                                     @RequestParam int width, @RequestParam int height) throws IOException {
        Path dir = Paths.get("storage/images"); Files.createDirectories(dir);
        Path path = dir.resolve("resized_"+System.currentTimeMillis()+"_"+image.getOriginalFilename());
        BufferedImage src = ImageIO.read(image.getInputStream());
        BufferedImage out = Thumbnails.of(src).size(width, height).asBufferedImage();
        ImageIO.write(out, "png", path.toFile());
        return Map.of("url", "/files/"+path.getFileName());
    }
}