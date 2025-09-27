package autoparts.kz;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
@EnableCaching
@EnableAsync
public class AutopartsApplication {

	public static void main(String[] args) {
		SpringApplication.run(AutopartsApplication.class, args);
	}

}
