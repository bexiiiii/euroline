package autoparts.kz.modules.admin.api.dto;

import jakarta.validation.constraints.Size;

public record UpdateApiKeyRequest(
        @Size(max = 255)
        String name,

        @Size(max = 1024)
        String description,

        Boolean active
) {}
