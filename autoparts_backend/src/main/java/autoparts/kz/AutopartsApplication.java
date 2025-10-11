package autoparts.kz;

import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableRabbit
@EnableScheduling
@SpringBootApplication
@EnableCaching
@EnableAsync
@ConfigurationPropertiesScan
public class AutopartsApplication {

	public static void main(String[] args) {
		SpringApplication.run(AutopartsApplication.class, args);
	}

}
