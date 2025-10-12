package autoparts.kz.common.config;



import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.*;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.File;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:5173,https://admin.euroline.1edu.kz,https://euroline.1edu.kz}")
    private String allowedOrigins;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // путь на диске для storage
        Path storageDir = Paths.get("storage");
        String storageLocation = storageDir.toFile().getAbsolutePath();

        // Обработчики для файлов из storage с правильной конфигурацией
        registry.addResourceHandler("/files/**")
                .addResourceLocations("file:" + storageLocation + "/files/",
                                    "file:" + storageLocation + "/images/", 
                                    "file:" + storageLocation + "/images/banners/",
                                    "file:" + storageLocation + "/receipts/",
                                    "file:" + storageLocation + "/reports/")
                .setCachePeriod(3600) // кэш на час
                .resourceChain(true)
                .addResolver(new CustomPathResourceResolver()); // Custom resolver for better file handling

        // Обработчик для uploads (если используется)
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/")
                .setCachePeriod(3600)
                .resourceChain(true)
                .addResolver(new CustomPathResourceResolver());
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        String[] allowed = origins.toArray(new String[0]);

        registry.addMapping("/files/**")
                .allowedOrigins(allowed)
                .allowedMethods("GET", "HEAD", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Content-Disposition")
                .allowCredentials(true)
                .maxAge(3600);

        registry.addMapping("/uploads/**")
                .allowedOrigins(allowed)
                .allowedMethods("GET", "HEAD", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Content-Disposition")
                .allowCredentials(true)
                .maxAge(3600);
    }
    
    // Custom PathResourceResolver to handle URL encoding issues
    private static class CustomPathResourceResolver extends PathResourceResolver {
        @Override
        protected Resource getResource(String resourcePath, Resource location) throws IOException {
            try {
                // Try original path first
                Resource resource = super.getResource(resourcePath, location);
                if (resource != null && resource.exists()) {
                    return resource;
                }
                
                // If not found, try with URL decoded path (for files with spaces)
                String decodedPath = java.net.URLDecoder.decode(resourcePath, "UTF-8");
                return super.getResource(decodedPath, location);
            } catch (Exception e) {
                return null;
            }
        }
    }
}
