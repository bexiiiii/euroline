package autoparts.kz.modules.kaspi.service;

import autoparts.kz.modules.kaspi.client.KaspiSidecarClient;
import autoparts.kz.modules.kaspi.client.KaspiSidecarClient.Creds;
import autoparts.kz.modules.kaspi.client.KaspiSidecarClient.Result;
import autoparts.kz.modules.kaspi.config.KaspiProperties;
import autoparts.kz.modules.kaspi.dto.KaspiDtos.*;
import autoparts.kz.modules.kaspi.entity.KaspiMerchantSession;
import autoparts.kz.modules.kaspi.repository.KaspiMerchantSessionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/**
 * Admin-side Kaspi Pay cashier login (phone → SMS OTP) and storage of the resulting session.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KaspiSessionService {

    private final KaspiSidecarClient sidecar;
    private final KaspiMerchantSessionRepository repo;
    private final KaspiProperties props;

    public ConnectionStatus status() {
        KaspiMerchantSession s = load();
        return new ConnectionStatus(props.isEnabled(), s.getStatus().name(), s.getPhone(), s.getOrgName(),
                s.getConnectedAt(), s.getLastCheckedAt(), s.getLastError());
    }

    /** Credentials for signing Kaspi requests, if a usable session exists. */
    public Optional<Creds> creds() {
        KaspiMerchantSession s = load();
        return s.isUsable() ? Optional.of(new Creds(s.getTokenSn(), s.getVtokenSecret(), s.getProfileId())) : Optional.empty();
    }

    public boolean isConnected() {
        return props.isEnabled() && load().isUsable();
    }

    public AuthInitResponse init() {
        Result r = call(sidecar::authInit);
        String processId = r.body().path("processId").asText(null);
        if (!r.httpOk() || processId == null || processId.isBlank()) {
            throw new KaspiException(502, "Kaspi не начал авторизацию: " + r.errorMessage());
        }
        return new AuthInitResponse(processId);
    }

    public SendPhoneResponse sendPhone(SendPhoneRequest req) {
        if (req == null || isBlank(req.processId())) throw new KaspiException(400, "processId обязателен");
        String phone = normalizePhone(req.phone());
        Result r = call(() -> sidecar.authSendPhone(req.processId(), phone));
        JsonNode b = r.body();
        boolean sent = r.httpOk() && b.path("success").asBoolean(false);
        String msg = sent ? b.path("desc").asText("SMS отправлено")
                : firstNonBlank(b.path("errorMessage").asText(null), b.path("error").asText(null), "Kaspi отклонил номер");
        return new SendPhoneResponse(sent, msg, sent ? null : b.path("errorCode").asText(null));
    }

    @Transactional
    public ConnectionStatus verifyOtp(VerifyOtpRequest req) {
        if (req == null || isBlank(req.processId()) || isBlank(req.otp())) {
            throw new KaspiException(400, "processId и код из SMS обязательны");
        }
        Result r = call(() -> sidecar.authVerifyOtp(req.processId(), req.otp().trim()));
        JsonNode b = r.body();
        String tokenSn = b.path("tokenSN").asText(null);
        String secret = b.path("vtokenSecret").asText(null);
        if (!r.httpOk() || !b.path("success").asBoolean(false) || isBlank(tokenSn) || isBlank(secret)) {
            log.warn("Kaspi OTP verification failed: http={}, step={}", r.httpStatus(), b.path("step").asText(""));
            throw new KaspiException(400, "Код не принят Kaspi: " + r.errorMessage());
        }
        KaspiMerchantSession s = load();
        s.setStatus(KaspiMerchantSession.Status.CONNECTED);
        s.setTokenSn(tokenSn);
        s.setVtokenSecret(secret);
        s.setProfileId(textOrNull(b.path("profileId")));
        s.setOrganizationId(textOrNull(b.path("organizationId")));
        s.setOrgName(textOrNull(b.path("orgName")));
        s.setPhone(textOrNull(b.path("phone")));
        s.setConnectedAt(Instant.now());
        s.setLastCheckedAt(Instant.now());
        s.setLastError(null);
        repo.save(s);
        log.info("Kaspi cashier session connected: org='{}', profileId={}", s.getOrgName(), s.getProfileId());
        return status();
    }

    /** Pings Kaspi with the stored session and updates its status. */
    @Transactional
    public ConnectionStatus check() {
        KaspiMerchantSession s = load();
        if (!s.isUsable()) return status();
        Result r = call(() -> sidecar.sessionCheck(new Creds(s.getTokenSn(), s.getVtokenSecret(), s.getProfileId())));
        s.setLastCheckedAt(Instant.now());
        if (r.httpOk() && r.body().path("active").asBoolean(false)) {
            s.setLastError(null);
        } else if (r.httpStatus() == 401 || r.httpStatus() == 403) {
            s.setStatus(KaspiMerchantSession.Status.EXPIRED);
            s.setLastError("Сессия Kaspi недействительна: " + r.errorMessage());
        } else {
            s.setLastError("Проверка не удалась: " + r.errorMessage());
        }
        repo.save(s);
        return status();
    }

    @Transactional
    public ConnectionStatus disconnect() {
        KaspiMerchantSession s = load();
        s.setStatus(KaspiMerchantSession.Status.DISCONNECTED);
        s.setTokenSn(null);
        s.setVtokenSecret(null);
        s.setLastError(null);
        repo.save(s);
        return status();
    }

    /** Called by payment flows when Kaspi reports the session evicted/invalid. */
    @Transactional
    public void markExpired(String reason) {
        KaspiMerchantSession s = load();
        if (s.getStatus() == KaspiMerchantSession.Status.CONNECTED) {
            s.setStatus(KaspiMerchantSession.Status.EXPIRED);
            s.setLastError(reason);
            repo.save(s);
            log.warn("Kaspi session marked EXPIRED: {}", reason);
        }
    }

    /** Periodic keep-alive / health check so the admin sees an expired session early. */
    @Scheduled(fixedDelayString = "PT15M", initialDelayString = "PT1M")
    public void scheduledCheck() {
        try {
            if (props.isEnabled() && load().isUsable()) check();
        } catch (Exception e) {
            log.debug("Kaspi session check failed: {}", e.getMessage());
        }
    }

    private KaspiMerchantSession load() {
        return repo.findById(KaspiMerchantSession.SINGLETON_ID).orElseGet(() -> {
            KaspiMerchantSession s = new KaspiMerchantSession();
            s.setId(KaspiMerchantSession.SINGLETON_ID);
            return s;
        });
    }

    /** Kaspi expects 10 digits without country code: 7XXXXXXXXX. */
    public static String normalizePhone(String raw) {
        String d = raw == null ? "" : raw.replaceAll("\\D", "");
        if (d.length() == 11 && (d.startsWith("7") || d.startsWith("8"))) d = d.substring(1);
        if (d.length() != 10 || !d.startsWith("7")) {
            throw new KaspiException(400, "Неверный номер телефона. Формат: +7 7XX XXX XX XX");
        }
        return d;
    }

    static Result call(java.util.function.Supplier<Result> fn) {
        try {
            return fn.get();
        } catch (KaspiException e) {
            throw e;
        } catch (Exception e) {
            throw new KaspiException(503, "Сервис Kaspi недоступен");
        }
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }

    private static String textOrNull(JsonNode n) {
        return n == null || n.isNull() || n.isMissingNode() ? null : n.asText();
    }

    private static String firstNonBlank(String... v) {
        for (String s : v) if (s != null && !s.isBlank()) return s;
        return null;
    }
}
