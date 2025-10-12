package autoparts.kz.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class NotificationRequest {
    private String title;
    private String message;
    private boolean status;
    private Long userId;
    private String target;
    private String imageUrl;

}
