package autoparts.kz.modules.admin.settings.dto;

import jakarta.validation.constraints.NotBlank;

public record SettingUpdateRequest(
        @NotBlank(message = "Ключ настройки обязателен")
        String key,
        String value
) {}
