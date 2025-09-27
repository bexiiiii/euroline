package autoparts.kz.common.config;



import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // путь на диске
        Path storageDir = Paths.get("storage"); // storage/files, storage/images, storage/reports ...
        String location = storageDir.toFile().getAbsolutePath();

        registry.addResourceHandler("/files/**")
                .addResourceLocations("file:" + location + "/")
                .setCachePeriod(3600) // кэш на  час
                .resourceChain(true)
                .addResolver(new PathResourceResolver());
    }
}