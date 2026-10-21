package autoparts.kz.modules.kaspi.controller;

import autoparts.kz.common.security.SimplePrincipal;
import autoparts.kz.modules.kaspi.dto.KaspiDtos.*;
import autoparts.kz.modules.kaspi.service.KaspiTopUpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Client: top up own balance via Kaspi (invoice to any phone, or QR payable from Kaspi / other banks). */
@RestController
@RequestMapping("/api/finance/my/kaspi")
@RequiredArgsConstructor
public class KaspiTopUpController {

    private final KaspiTopUpService svc;

    @GetMapping("/availability")
    public Availability availability() { return svc.availability(); }

    @PostMapping("/invoice")
    public KaspiTopUpView invoice(@AuthenticationPrincipal SimplePrincipal p, @RequestBody CreateInvoiceRequest req) {
        return svc.createInvoice(p.id(), req);
    }

    @PostMapping("/qr")
    public KaspiTopUpView qr(@AuthenticationPrincipal SimplePrincipal p, @RequestBody CreateQrRequest req) {
        return svc.createQr(p.id(), req);
    }

    @GetMapping("/top-ups/{id}")
    public KaspiTopUpView get(@AuthenticationPrincipal SimplePrincipal p, @PathVariable Long id) {
        return svc.get(p.id(), id);
    }

    @PostMapping("/top-ups/{id}/cancel")
    public KaspiTopUpView cancel(@AuthenticationPrincipal SimplePrincipal p, @PathVariable Long id) {
        return svc.cancel(p.id(), id);
    }

    @ExceptionHandler(KaspiException.class)
    public ResponseEntity<Map<String, Object>> onKaspi(KaspiException e) {
        return ResponseEntity.status(e.getHttpStatus()).body(Map.of("error", "kaspi", "message", e.getMessage()));
    }
}
