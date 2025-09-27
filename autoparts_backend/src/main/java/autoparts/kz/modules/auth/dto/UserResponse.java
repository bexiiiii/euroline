package autoparts.kz.modules.auth.dto;

import autoparts.kz.modules.auth.Roles.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private Role role;
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
    private String lastBrowser;
    private boolean banned;
}
