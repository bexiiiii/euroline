package autoparts.kz.common.util;

import autoparts.kz.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminPasswordResetter implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminPasswordResetter.class);
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) {
        logger.info("Checking admin users and passwords...");
        
        // Проверим существование admin@example.com и обновим пароль
        userRepository.findByEmail("admin@example.com").ifPresentOrElse(
            admin -> {
                String newPassword = "admin123";
                String encodedPassword = passwordEncoder.encode(newPassword);
                
                logger.info("Updating password for admin@example.com");
                logger.info("New encoded password: {}", encodedPassword);
                
                admin.setPassword(encodedPassword);
                userRepository.save(admin);
                
                logger.info("Admin password reset successfully for admin@example.com to: {}", newPassword);
                logger.info("You can now log in with admin@example.com / {}", newPassword);
            },
            () -> logger.warn("Admin user admin@example.com not found!")
        );
        
        // Проверим существование admin@autoparts.local и обновим пароль
        userRepository.findByEmail("admin@autoparts.local").ifPresentOrElse(
            admin -> {
                String newPassword = "admin123";
                String encodedPassword = passwordEncoder.encode(newPassword);
                
                logger.info("Updating password for admin@autoparts.local");
                logger.info("New encoded password: {}", encodedPassword);
                
                admin.setPassword(encodedPassword);
                userRepository.save(admin);
                
                logger.info("Admin password reset successfully for admin@autoparts.local to: {}", newPassword);
                logger.info("You can now log in with admin@autoparts.local / {}", newPassword);
            },
            () -> logger.warn("Admin user admin@autoparts.local not found!")
        );
    }
}
