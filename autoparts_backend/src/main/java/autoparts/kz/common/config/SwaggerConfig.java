package autoparts.kz.common.config;


import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(title = "Autoparts API", version = "v1", description = "Marketplace API")
)
public class SwaggerConfig {
}
