package autoparts.kz.common.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "admin123";
        String encodedPassword = encoder.encode(rawPassword);
        System.out.println("Password for 'admin123': " + encodedPassword);
        
        // Проверим существующие пароли
        String existingHash1 = "$2a$10$zZKseK6k3ZKfUpcIFsddduKj1blZkMytY5HnL0Y0hD8P1FzG1N2bi";
        String existingHash2 = "$2a$10$y/FBOKqWWtCLLEAewq93B.V4RIS29r9RvG6CesEWt.9xKAc1Xzf6C";
        
        System.out.println("Existing hash 1 matches 'admin123': " + encoder.matches("admin123", existingHash1));
        System.out.println("Existing hash 2 matches 'admin123': " + encoder.matches("admin123", existingHash2));
        
        // Проверим другие популярные пароли
        System.out.println("Existing hash 1 matches 'admin': " + encoder.matches("admin", existingHash1));
        System.out.println("Existing hash 1 matches 'password': " + encoder.matches("password", existingHash1));
        System.out.println("Existing hash 1 matches '123456': " + encoder.matches("123456", existingHash1));
        
        System.out.println("Existing hash 2 matches 'admin': " + encoder.matches("admin", existingHash2));
        System.out.println("Existing hash 2 matches 'password': " + encoder.matches("password", existingHash2));
        System.out.println("Existing hash 2 matches '123456': " + encoder.matches("123456", existingHash2));
    }
}
