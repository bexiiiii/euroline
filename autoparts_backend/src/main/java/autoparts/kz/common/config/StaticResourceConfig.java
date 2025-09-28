package autoparts.kz.common.config;



import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.*;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.File;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

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