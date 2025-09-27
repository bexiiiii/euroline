package autoparts.kz.modules.admin.dto;


import lombok.*;

@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class UserAdminResponse {
    private Long id;
    private String email;
    private String phone;
    private String country;
    private String state;
    private String city;
    private String officeAddress;
    private String type;
    private String surname;
    private String name;
    private String fathername;
    private String address;
    private String role;
    private boolean banned;

}
