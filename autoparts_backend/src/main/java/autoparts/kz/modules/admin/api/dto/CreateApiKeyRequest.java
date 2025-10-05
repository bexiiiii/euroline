package autoparts.kz.modules.admin.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateApiKeyRequest(
        @NotBlank(message = "Название ключа обязательно")
        @Size(max = 255, message = "Название должно быть не длиннее 255 символов")
        String name,

        @Size(max = 1024, message = "Описание не должно превышать 1024 символов")
        String description,

        @Size(max = 255, message = "Длина поля 'createdBy' ограничена 255 символами")
        String createdBy
) {}
