package autoparts.kz.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminProfileResponse {
    private Long id;
    private String email;
    private String role;
    private String name;
    private boolean banned;
}
