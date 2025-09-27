package autoparts.kz.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PasswordChangeRequest {
    
    @NotBlank(message = "Текущий пароль обязателен")
    private String oldPassword;
    
    @NotBlank(message = "Новый пароль обязателен")
    @Size(min = 6, message = "Новый пароль должен содержать минимум 6 символов")
    private String newPassword;
    
    public PasswordChangeRequest() {}
    
    public PasswordChangeRequest(String oldPassword, String newPassword) {
        this.oldPassword = oldPassword;
        this.newPassword = newPassword;
    }
    
    public String getOldPassword() {
        return oldPassword;
    }
    
    public void setOldPassword(String oldPassword) {
        this.oldPassword = oldPassword;
    }
    
    public String getNewPassword() {
        return newPassword;
    }
    
    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
