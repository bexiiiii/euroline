package autoparts.kz.modules.admin.controller;


import autoparts.kz.common.dto.PageResponse;
import autoparts.kz.modules.admin.dto.NotificationHistoryResponse;
import autoparts.kz.modules.admin.dto.NotificationRequest;
import autoparts.kz.modules.admin.dto.NotificationResponse;
import autoparts.kz.modules.admin.service.NotificationSenderService;
import org.springframework.beans.factory.annotation.Autowired;
import autoparts.kz.common.security.SimplePrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/admin/notifications")
public class AdminNotificationController {
    @Autowired
    private NotificationSenderService notificationSenderService;

    @PostMapping("/send")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> send(@RequestBody NotificationRequest request,
                                  @AuthenticationPrincipal(errorOnInvalidType = false) SimplePrincipal principal) {
        Long senderId = principal != null ? principal.id() : null;
        notificationSenderService.sendNotification(request, senderId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<NotificationResponse> getMyNotifications(@AuthenticationPrincipal(errorOnInvalidType = false) SimplePrincipal principal) {
        Long userId = principal != null ? principal.id() : null;
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized principal");
        return notificationSenderService.getUserNotifications(userId);
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<NotificationHistoryResponse> getNotificationHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        return notificationSenderService.getNotificationHistory(page, size);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        notificationSenderService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        notificationSenderService.deleteNotification(id);
        return ResponseEntity.ok().build();
    }

}
