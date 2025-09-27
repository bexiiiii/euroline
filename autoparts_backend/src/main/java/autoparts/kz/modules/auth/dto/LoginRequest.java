package autoparts.kz.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {
    @Email(message = "Неправильный формат email")
    @NotBlank(message = "Email обязателен")
    private String email;
    
    @NotBlank(message = "Пароль обязателен")
    @Size(min = 6, message = "Пароль должен быть минимум 6 символов")
    private String password;
    
    // Поля для регистрации (опциональные для логина)
    private String clientName;
    private String country;
    private String state;
    private String city;
    private String officeAddress;
    private String type;
    private String surname;
    private String name;
    private String fathername;
    private String phone;
}
