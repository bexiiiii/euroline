package autoparts.kz.modules.admin.log;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LogResponse {
    private Long id;

    private String action; // Пример: "BAN_USER", "UPDATE_USER"

    private String description; // Что именно было сделано
    private String performedBy; // email
    private String timestamp; // строка
}
