package autoparts.kz.modules.notifications.controller;


import autoparts.kz.modules.notifications.repository.NotificationRepository;
import autoparts.kz.modules.notifications.entity.Notification;
import autoparts.kz.modules.notifications.notifications.InAppBroadcaster;
import lombok.RequiredArgsConstructor;
import autoparts.kz.common.security.SimplePrincipal;
import autoparts.kz.common.security.JwtUtils;
import autoparts.kz.modules.auth.service.AuthService;
import org.springframework.data.domain.*;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository repo;
    private final InAppBroadcaster sse;
    private final JwtUtils jwtUtils;
    private final AuthService authService;

    // список
    @GetMapping
    public Page<Notification> list(@AuthenticationPrincipal(errorOnInvalidType = false) SimplePrincipal principal,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        Long userId = principal != null ? principal.id() : null;
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized principal");
        return repo.findByUserId(userId, PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    // количество непрочитанных
    @GetMapping("/unread-count")
    public Map<String, Long> unread(@AuthenticationPrincipal(errorOnInvalidType = false) SimplePrincipal principal) {
        Long userId = principal != null ? principal.id() : null;
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized principal");
        return Map.of("count", repo.countUnread(userId));
    }

    // пометить как прочитанное
    @PostMapping("/{id}/read")
    public Map<String, Object> read(@AuthenticationPrincipal(errorOnInvalidType = false) SimplePrincipal principal,
                                    @PathVariable Long id) {
        Long userId = principal != null ? principal.id() : null;
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized principal");
        var n = repo.findById(id).orElseThrow();
        if (!n.getUserId().equals(userId)) throw new RuntimeException("Forbidden");
        n.setReadFlag(true); repo.save(n);
        return Map.of("ok", true);
    }

    // пометить все как прочитанные
    @PostMapping("/read-all")
    public Map<String, Object> readAll(@AuthenticationPrincipal(errorOnInvalidType = false) SimplePrincipal principal) {
        Long userId = principal != null ? principal.id() : null;
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized principal");
        repo.findByUserId(userId, PageRequest.of(0, Integer.MAX_VALUE)).forEach(n -> { n.setReadFlag(true); repo.save(n); });
        return Map.of("ok", true);
    }

    // realtime stream (SSE)
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal(errorOnInvalidType = false) SimplePrincipal principal,
                             @RequestParam(value = "token", required = false) String token) {
        Long userId = principal != null ? principal.id() : null;
        if (userId == null && token != null && !token.isBlank()) {
            try {
                String email = jwtUtils.extractUsername(token.replace("Bearer ", ""));
                var userOpt = authService.findByEmail(email);
                if (userOpt.isPresent()) {
                    userId = userOpt.get().getId();
                }
            } catch (Exception ignored) {}
        }
        if (userId == null) throw new RuntimeException("Unauthorized principal");
        return sse.subscribe(userId);
    }
}
