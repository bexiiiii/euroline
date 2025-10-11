package autoparts.kz.modules.user.entity;

import autoparts.kz.modules.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.Objects;

@AllArgsConstructor
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "user_profiles")
@Data
public class UserProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "client_name")
    private String clientName;
    @Column(name = "country")
    private String country;
    @Column(name = "state")
    private String state;
    @Column(name = "city")
    private String city;
    @Column(name = "office_address")
    private String officeAddress;
    @Column(name = "type")
    private String type;
    @Column(name = "surname")
    private String surname;
    @Column(name = "name")
    private String name;
    @Column(name = "fathername")
    private String fathername;
    @Column(name = "email")
    private String email;
    @Column(name = "phone")
    private String phone;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;


    @Override
    public String toString() {
        return "UserProfile{" +
                "id=" + id +
                ", clientName='" + clientName + '\'' +
                ", country='" + country + '\'' +
                ", state='" + state + '\'' +
                ", city='" + city + '\'' +
                ", officeAddress='" + officeAddress + '\'' +
                ", type='" + type + '\'' +
                ", surname='" + surname + '\'' +
                ", name='" + name + '\'' +
                ", fathername='" + fathername + '\'' +
                ", email='" + email + '\'' +
                ", phone='" + phone + '\'' +
                ", user=" + user +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        UserProfile that = (UserProfile) o;
        return Objects.equals(id, that.id) && Objects.equals(clientName, that.clientName) && Objects.equals(country, that.country) && Objects.equals(state, that.state) && Objects.equals(city, that.city) && Objects.equals(officeAddress, that.officeAddress) && Objects.equals(type, that.type) && Objects.equals(surname, that.surname) && Objects.equals(name, that.name) && Objects.equals(fathername, that.fathername) && Objects.equals(email, that.email) && Objects.equals(phone, that.phone) && Objects.equals(user, that.user);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, clientName, country, state, city, officeAddress, type, surname, name, fathername, email, phone, user);
    }
}
