package autoparts.kz.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class NotificationHistoryResponse {
    private Long id;
    private String title;
    private String message;
    private boolean status;
    private String target;
    private String imageUrl;
    private String createdAt;
    private Long senderId;
    private String senderEmail;
    private String senderName;
    private long recipientCount;
}

