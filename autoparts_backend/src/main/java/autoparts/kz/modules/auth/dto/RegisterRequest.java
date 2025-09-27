package autoparts.kz.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @Email(message = "Неправильный формат email")
    @NotBlank(message = "Email обязателен")
    private String email;
    
    @NotBlank(message = "Пароль обязателен")
    @Size(min = 6, message = "Пароль должен быть минимум 6 символов")
    private String password;
    
    @NotBlank(message = "Наименование клиента обязательно")
    private String clientName;
    
    @NotBlank(message = "Страна обязательна")
    private String country;
    
    @NotBlank(message = "Регион/область обязательны")
    private String state;
    
    @NotBlank(message = "Город обязателен")
    private String city;
    
    private String officeAddress;
    
    @NotBlank(message = "Вид деятельности обязателен")
    private String type;
    
    @NotBlank(message = "Фамилия обязательна")
    private String surname;
    
    @NotBlank(message = "Имя обязательно")
    private String name;
    
    @NotBlank(message = "Отчество обязательно")
    private String fathername;
    
    @NotBlank(message = "Номер телефона обязателен")
    private String phone;
}
