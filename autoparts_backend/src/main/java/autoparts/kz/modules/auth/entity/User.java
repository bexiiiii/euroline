package autoparts.kz.modules.auth.entity;

import autoparts.kz.common.constants.SecurityConstants;
import autoparts.kz.modules.auth.Roles.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.Objects;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Email(message = "Неправильный формат email")
    @NotBlank(message = "Email не может быть пустым")
    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore // Исключаем пароль из JSON сериализации
    @Size(min = SecurityConstants.PASSWORD_MIN_LENGTH, message = "Пароль должен быть минимум " + SecurityConstants.PASSWORD_MIN_LENGTH + " символов")
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
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

    @Size(max = 20, message = "Номер телефона не может быть длиннее 20 символов")
    private String phone;

    @Column(name = "last_browser", length = 512)
    private String lastBrowser;

    @Column(nullable = false)
    private boolean banned = false;

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", email='" + email + '\'' +
                ", role=" + role +
                ", clientName='" + clientName + '\'' +
                ", country='" + country + '\'' +
                ", state='" + state + '\'' +
                ", city='" + city + '\'' +
                ", officeAddress='" + officeAddress + '\'' +
                ", type='" + type + '\'' +
                ", surname='" + surname + '\'' +
                ", name='" + name + '\'' +
                ", fathername='" + fathername + '\'' +
                ", phone='" + phone + '\'' +
                ", lastBrowser='" + lastBrowser + '\'' +
                ", banned=" + banned +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(id, user.id) && Objects.equals(email, user.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, email);
    }
}
