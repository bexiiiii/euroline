package autoparts.kz.modules.admin.settings.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/system") @RequiredArgsConstructor
public class AdminSystemController {
    private final WebClient webClient = WebClient.create();

    @GetMapping("/status") @PreAuthorize("hasRole('ADMIN')")
    public Mono<Object> status(){ return webClient.get().uri("http://localhost:8080/actuator/health").retrieve().bodyToMono(Object.class); }

    @GetMapping("/services") @PreAuthorize("hasRole('ADMIN')")
    public Mono<Object> services(){ return webClient.get().uri("http://localhost:8080/actuator/health").retrieve().bodyToMono(Object.class); }

    @GetMapping("/metrics") @PreAuthorize("hasRole('ADMIN')")
    public Mono<Object> metrics(){ return webClient.get().uri("http://localhost:8080/actuator/metrics").retrieve().bodyToMono(Object.class); }

    @PostMapping("/restart") @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> restart(){ /* вставь graceful-restart хук или деплой‑скрипт */ return Map.of("accepted", true); }

    @GetMapping("/health") public Mono<Object> health(){ return status(); }
}