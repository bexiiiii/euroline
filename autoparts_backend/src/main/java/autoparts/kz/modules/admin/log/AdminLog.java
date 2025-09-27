package autoparts.kz.modules.admin.log;



import autoparts.kz.modules.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String action; // Пример: "BAN_USER", "UPDATE_USER"

    private String description; // Что именно было сделано

    private LocalDateTime timestamp = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "admin_id")
    private User performedBy; // Кто сделал (админ)
}
