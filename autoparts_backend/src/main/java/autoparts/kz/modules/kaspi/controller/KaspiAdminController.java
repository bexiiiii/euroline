package autoparts.kz.modules.kaspi.controller;

import autoparts.kz.modules.kaspi.dto.KaspiDtos.*;
import autoparts.kz.modules.kaspi.service.KaspiSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Admin: connect the Kaspi Pay cashier account (phone → SMS code) used for top-up invoices / QR. */
@RestController
@RequestMapping("/api/admin/kaspi")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class KaspiAdminController {

    private final KaspiSessionService sessions;

    @GetMapping("/status")
    public ConnectionStatus status() { return sessions.status(); }

    @PostMapping("/check")
    public ConnectionStatus check() { return sessions.check(); }

    @PostMapping("/auth/init")
    public AuthInitResponse init() { return sessions.init(); }

    @PostMapping("/auth/send-phone")
    public SendPhoneResponse sendPhone(@RequestBody SendPhoneRequest req) { return sessions.sendPhone(req); }

    @PostMapping("/auth/verify-otp")
    public ConnectionStatus verifyOtp(@RequestBody VerifyOtpRequest req) { return sessions.verifyOtp(req); }

    @PostMapping("/disconnect")
    public ConnectionStatus disconnect() { return sessions.disconnect(); }

    @ExceptionHandler(KaspiException.class)
    public ResponseEntity<Map<String, Object>> onKaspi(KaspiException e) {
        return ResponseEntity.status(e.getHttpStatus()).body(Map.of("error", "kaspi", "message", e.getMessage()));
    }
}
