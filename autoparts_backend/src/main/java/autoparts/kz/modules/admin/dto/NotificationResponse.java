package autoparts.kz.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter


public class NotificationResponse {
    private Long id;
    private String title;
    private String message;
    private boolean read;
    private String createdAt;
    private String imageUrl;
    private String target;
}
