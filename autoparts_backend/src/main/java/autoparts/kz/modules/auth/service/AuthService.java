package autoparts.kz.modules.auth.service;

import autoparts.kz.modules.auth.Roles.Role;
import autoparts.kz.modules.auth.dto.LoginRequest;
import autoparts.kz.modules.auth.dto.RegisterRequest;
import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public boolean existsByEmail(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public void registerUser(RegisterRequest request) {
        User user = new User();
        user.setRole(Role.USER);
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setClientName(request.getClientName());
        user.setCountry(request.getCountry());
        user.setState(request.getState());
        user.setCity(request.getCity());
        // Устанавливаем значение по умолчанию для officeAddress если не указан
        user.setOfficeAddress(request.getOfficeAddress() != null && !request.getOfficeAddress().trim().isEmpty() 
            ? request.getOfficeAddress() : "Не указан");
        user.setType(request.getType());
        user.setSurname(request.getSurname());
        user.setName(request.getName());
        user.setFathername(request.getFathername());
        user.setPhone(request.getPhone());
        userRepository.save(user);
    }

    // Для совместимости со старым кодом
    public void registerUser(LoginRequest request) {
        User user = new User();
        user.setRole(Role.USER);
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setClientName(request.getClientName());
        user.setCountry(request.getCountry());
        user.setState(request.getState());
        user.setCity(request.getCity());
        // Устанавливаем значение по умолчанию для officeAddress если не указан
        user.setOfficeAddress(request.getOfficeAddress() != null && !request.getOfficeAddress().trim().isEmpty() 
            ? request.getOfficeAddress() : "Не указан");
        user.setType(request.getType());
        user.setSurname(request.getSurname());
        user.setName(request.getName());
        user.setFathername(request.getFathername());
        user.setPhone(request.getPhone());
        userRepository.save(user);
    }

    public boolean isBanned(String email) {
        return userRepository.findByEmail(email).map(User::isBanned).orElse(false);
    }

    public void updateLastBrowser(String email, String userAgent) {
        if (email == null || email.isBlank()) {
            return;
        }

        userRepository.findByEmail(email).ifPresent(user -> {
            user.setLastBrowser(normalizeUserAgent(userAgent));
            userRepository.save(user);
        });
    }

    private String normalizeUserAgent(String userAgent) {
        if (userAgent == null) {
            return "Unknown";
        }
        String value = userAgent.trim();
        if (value.isEmpty()) {
            return "Unknown";
        }
        return value.length() > 500 ? value.substring(0, 500) : value;
    }

    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        
        // Проверяем старый пароль
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Неверный текущий пароль");
        }
        
        // Устанавливаем новый пароль
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
