package autoparts.kz.modules.kaspi.service;

import autoparts.kz.modules.finance.entity.TopUp;
import autoparts.kz.modules.finance.repository.TopUpRepository;
import autoparts.kz.modules.finance.service.FinanceService;
import autoparts.kz.modules.kaspi.client.KaspiSidecarClient;
import autoparts.kz.modules.kaspi.client.KaspiSidecarClient.Creds;
import autoparts.kz.modules.kaspi.client.KaspiSidecarClient.Result;
import autoparts.kz.modules.kaspi.config.KaspiProperties;
import autoparts.kz.modules.kaspi.dto.KaspiDtos.*;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.*;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Balance top-ups paid through Kaspi Pay (invoice to a phone, or QR).
 *
 * Money safety:
 *  - the balance is credited only after the backend itself reads status "Processed" from Kaspi (never from the client);
 *  - crediting goes through {@link FinanceService#approveExternalTopUp}, which row-locks the top-up and acts only on
 *    PENDING, and the top_ups (kaspi_type, kaspi_operation_id) unique index ties one Kaspi operation to one top-up;
 *  - this service never writes the top-up status directly (only via FinanceService) — bookkeeping columns are updated
 *    with a targeted UPDATE so a stale entity can't overwrite a concurrent approval.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KaspiTopUpService {

    public static final String TYPE_INVOICE = "INVOICE";
    public static final String TYPE_QR = "QR";
    public static final String METHOD_INVOICE = "KASPI_INVOICE";
    public static final String METHOD_QR = "KASPI_QR";

    private static final String STATUS_PROCESSED = "Processed";
    private static final String QR_NOT_SCANNED = "QrTokenCreated";
    /** Kaspi returns local Kazakhstan time without offset (UTC+5 since 2024). */
    private static final ZoneOffset KASPI_OFFSET = ZoneOffset.ofHours(5);

    // final failure/expiry statuses (from kaspi-pos-automation polling.js); anything unknown stays pending
    private static final Set<String> QR_FAILED = Set.of(
            "CancelledByUser", "NotConfirmedByUser", "CancelledByExternalSource", "ProcessingFailed", "Rejected",
            "InsufficientFunds", "InsufficientFundsError", "Error", "IrisSrcBlockCode1", "IrisSrcBlockCode3",
            "IrisSrcBlockCode9", "IrisDestBlockCode3", "IrisDestBlockCode5", "IrisDestBlockCode7",
            "IrisDestBlockCode10", "QrTokenDiscarded", "Expired");
    private static final Set<String> INVOICE_FAILED = Set.of(
            "RemotePaymentCanceled", "RemotePaymentRejected", "Expired");

    private static final Map<String, String> STATUS_RU = Map.of(
            "QrTokenCreated", "Ожидает сканирования",
            "Wait", "Ожидает подтверждения в Kaspi",
            "RemotePaymentCreated", "Счёт выставлен, ожидает оплаты",
            "Processed", "Оплачено",
            "RemotePaymentCanceled", "Счёт отменён",
            "RemotePaymentRejected", "Счёт отклонён",
            "Expired", "Время оплаты истекло",
            "QrTokenDiscarded", "QR-код истёк");

    private final KaspiSidecarClient sidecar;
    private final KaspiSessionService sessions;
    private final KaspiProperties props;
    private final TopUpRepository topups;
    private final FinanceService finance;

    public Availability availability() {
        return new Availability(sessions.isConnected(), props.getMinAmount(), props.getMaxAmount());
    }

    // ── create ──

    public KaspiTopUpView createInvoice(Long clientId, CreateInvoiceRequest req) {
        String phone = KaspiSessionService.normalizePhone(req == null ? null : req.phone());
        BigDecimal amount = validateAmount(req == null ? null : req.amount());
        Creds creds = requireReady(clientId);

        TopUp t = newTopUp(clientId, amount, TYPE_INVOICE, METHOD_INVOICE);
        t.setKaspiPhone(phone);
        t = topups.saveAndFlush(t);

        String comment = props.getCommentPrefix() + " #" + t.getId();
        Result r = KaspiSessionService.call(() -> sidecar.invoiceCreate(creds, phone, amount, comment));
        JsonNode d = r.data();
        Long opId = firstLong(d, "QrOperationId", "Id");
        if (!r.ok() || opId == null) {
            failCreate(t, r);
        }
        t.setKaspiOperationId(opId);
        t.setKaspiStatus(trim(d.path("Status").asText("RemotePaymentCreated")));
        t.setKaspiExpiresAt(Instant.now().plus(props.getInvoiceTtl()));
        t = topups.saveAndFlush(t);
        log.info("Kaspi invoice created: topUp={}, client={}, amount={}, op={}", t.getId(), clientId, amount, opId);
        return view(t);
    }

    public KaspiTopUpView createQr(Long clientId, CreateQrRequest req) {
        BigDecimal amount = validateAmount(req == null ? null : req.amount());
        Creds creds = requireReady(clientId);

        TopUp t = topups.saveAndFlush(newTopUp(clientId, amount, TYPE_QR, METHOD_QR));

        Result r = KaspiSessionService.call(() -> sidecar.qrCreate(creds, amount));
        JsonNode d = r.data();
        Long opId = firstLong(d, "QrOperationId");
        // QrOriginalToken (https://qr.kaspi.kz/...) is the "Единый QR": payable from Kaspi and other banks' apps
        String token = firstText(d, "QrOriginalToken", "QrToken");
        if (!r.ok() || opId == null || token == null) {
            failCreate(t, r);
        }
        t.setKaspiOperationId(opId);
        t.setKaspiQrToken(token);
        t.setKaspiStatus(QR_NOT_SCANNED);
        t.setKaspiExpiresAt(parseQrExpiry(d.path("ExpireDate").asText(null)));
        t = topups.saveAndFlush(t);
        log.info("Kaspi QR created: topUp={}, client={}, amount={}, op={}", t.getId(), clientId, amount, opId);
        return view(t);
    }

    // ── client reads / cancel ──

    /** Returns the top-up; refreshes its Kaspi status server-side if it was not checked very recently. */
    public KaspiTopUpView get(Long clientId, Long topUpId) {
        TopUp t = owned(clientId, topUpId);
        Instant checked = t.getKaspiCheckedAt();
        if (t.getStatus() == TopUp.Status.PENDING
                && (checked == null || checked.isBefore(Instant.now().minus(props.getOnDemandCheckGap())))) {
            try {
                checkOne(t);
            } catch (Exception e) {
                log.debug("On-demand Kaspi check failed for topUp {}: {}", topUpId, e.getMessage());
            }
            t = owned(clientId, topUpId);
        }
        return view(t);
    }

    /** Cancels an unpaid invoice at Kaspi; the poller then records the final status. QR codes simply expire. */
    public KaspiTopUpView cancel(Long clientId, Long topUpId) {
        TopUp t = owned(clientId, topUpId);
        if (t.getStatus() != TopUp.Status.PENDING) return view(t);
        if (!TYPE_INVOICE.equals(t.getKaspiType()) || t.getKaspiOperationId() == null) {
            throw new KaspiException(400, "QR-код нельзя отменить — он истечёт автоматически");
        }
        Creds creds = sessions.creds().orElseThrow(() -> new KaspiException(409, "Kaspi оплата временно недоступна"));
        Result r = KaspiSessionService.call(() -> sidecar.invoiceCancel(creds, t.getKaspiOperationId()));
        if (r.sessionLost()) sessions.markExpired("Сессия Kaspi вытеснена или истекла: " + r.errorMessage());
        checkOne(topups.findById(topUpId).orElseThrow());
        return view(owned(clientId, topUpId));
    }

    // ── polling ──

    @Scheduled(fixedDelayString = "${kaspi.poll-interval-ms:5000}", initialDelayString = "PT30S")
    public void pollPending() {
        if (!props.isEnabled()) return;
        rejectOrphans();
        if (!sessions.isConnected()) return;
        for (TopUp t : topups.findPendingKaspi(PageRequest.of(0, props.getPollBatchSize()))) {
            try {
                if (!checkOne(t)) break; // session lost — stop this tick
            } catch (Exception e) {
                log.warn("Kaspi status check failed for topUp {}: {}", t.getId(), e.getMessage());
            }
        }
    }

    /**
     * Reads the operation status from Kaspi and applies it. Safe to call concurrently / repeatedly.
     * @return false if the Kaspi session is unusable (caller should stop polling for now)
     */
    boolean checkOne(TopUp t) {
        if (t.getStatus() != TopUp.Status.PENDING || t.getKaspiOperationId() == null) return true;
        Optional<Creds> creds = sessions.creds();
        if (creds.isEmpty()) return false;

        long op = t.getKaspiOperationId();
        boolean qr = TYPE_QR.equals(t.getKaspiType());
        Result r = qr ? sidecar.qrStatus(creds.get(), op) : sidecar.invoiceDetails(creds.get(), op);
        Instant now = Instant.now();

        if (r.sessionLost()) {
            sessions.markExpired("Сессия Kaspi вытеснена или истекла: " + r.errorMessage());
            return false;
        }
        if (!r.ok()) {
            log.warn("Kaspi status error for topUp {} (op {}): {}", t.getId(), op, r.errorMessage());
            topups.updateKaspiState(t.getId(), t.getKaspiStatus(), now);
            return true;
        }

        JsonNode d = r.data();
        String status = d.path("Status").asText("");
        if (status.isEmpty()) {
            topups.updateKaspiState(t.getId(), t.getKaspiStatus(), now);
            return true;
        }

        if (STATUS_PROCESSED.equals(status)) {
            BigDecimal paid = decimal(d.path("Amount"));
            if (paid != null && paid.compareTo(t.getAmount()) != 0) {
                // never credit an amount different from what was requested; leave for manual review
                log.error("Kaspi amount mismatch for topUp {} (op {}): expected {}, Kaspi {}", t.getId(), op, t.getAmount(), paid);
                topups.updateKaspiState(t.getId(), trim("Processed:AMOUNT_MISMATCH:" + paid.toPlainString()), now);
                return true;
            }
            topups.updateKaspiState(t.getId(), status, now);
            boolean credited = finance.approveExternalTopUp(t.getId(),
                    "Kaspi " + (qr ? "QR" : "счёт") + " #" + op + " оплачен");
            if (credited) log.info("Kaspi top-up {} credited: client={}, amount={}, op={}", t.getId(), t.getClientId(), t.getAmount(), op);
            return true;
        }

        if ((qr ? QR_FAILED : INVOICE_FAILED).contains(status)) {
            topups.updateKaspiState(t.getId(), status, now);
            finance.rejectExternalTopUp(t.getId(), "Kaspi: " + STATUS_RU.getOrDefault(status, status));
            return true;
        }

        // intermediate (or unknown) status
        topups.updateKaspiState(t.getId(), trim(status), now);
        Instant exp = t.getKaspiExpiresAt();
        if (exp != null && now.isAfter(exp)) {
            if (qr && QR_NOT_SCANNED.equals(status) && now.isAfter(exp.plus(props.getQrGrace()))) {
                // never scanned and the token is dead — it can no longer be paid
                finance.rejectExternalTopUp(t.getId(), "Kaspi: QR-код истёк");
            } else if (!qr) {
                // our deadline passed: cancel at Kaspi; the resulting final status is applied on the next check
                Result c = sidecar.invoiceCancel(creds.get(), op);
                if (!c.ok()) log.warn("Kaspi invoice cancel failed for topUp {} (op {}): {}", t.getId(), op, c.errorMessage());
            }
            if (now.isAfter(exp.plus(props.getHardStopAfterExpiry()))) {
                log.warn("Kaspi topUp {} (op {}) still '{}' long after expiry — rejecting", t.getId(), op, status);
                finance.rejectExternalTopUp(t.getId(), "Kaspi: нет финального статуса (" + status + ")");
            }
        }
        return true;
    }

    /** Rows saved before the Kaspi call whose operation never got recorded (crash/timeout). */
    private void rejectOrphans() {
        for (TopUp t : topups.findKaspiWithoutOperation(Instant.now().minus(Duration.ofMinutes(15)))) {
            log.warn("Kaspi topUp {} has no Kaspi operation id — rejecting (check Kaspi history for comment '#{}')", t.getId(), t.getId());
            finance.rejectExternalTopUp(t.getId(), "Kaspi: операция не создана");
        }
    }

    // ── helpers ──

    private Creds requireReady(Long clientId) {
        if (!props.isEnabled()) throw new KaspiException(409, "Оплата через Kaspi отключена");
        Creds creds = sessions.creds().orElseThrow(() -> new KaspiException(409, "Оплата через Kaspi временно недоступна"));
        long pending = topups.countByClientIdAndStatusAndKaspiTypeIsNotNull(clientId, TopUp.Status.PENDING);
        if (pending >= props.getMaxPendingPerClient()) {
            throw new KaspiException(429, "У вас уже есть неоплаченные счета Kaspi. Оплатите или отмените их.");
        }
        return creds;
    }

    private BigDecimal validateAmount(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) throw new KaspiException(400, "Укажите сумму");
        if (amount.stripTrailingZeros().scale() > 0) throw new KaspiException(400, "Сумма должна быть в целых тенге");
        if (amount.compareTo(props.getMinAmount()) < 0) throw new KaspiException(400, "Минимальная сумма " + props.getMinAmount().toPlainString() + " ₸");
        if (amount.compareTo(props.getMaxAmount()) > 0) throw new KaspiException(400, "Максимальная сумма " + props.getMaxAmount().toPlainString() + " ₸");
        return amount.setScale(0);
    }

    private TopUp newTopUp(Long clientId, BigDecimal amount, String type, String method) {
        TopUp t = new TopUp();
        t.setClientId(clientId);
        t.setAmount(amount);
        t.setStatus(TopUp.Status.PENDING);
        t.setPaymentMethod(method);
        t.setKaspiType(type);
        return t;
    }

    private void failCreate(TopUp t, Result r) {
        if (r.sessionLost()) {
            sessions.markExpired("Сессия Kaspi вытеснена или истекла: " + r.errorMessage());
        }
        log.warn("Kaspi create failed for topUp {}: {}", t.getId(), r.errorMessage());
        finance.rejectExternalTopUp(t.getId(), "Kaspi: не удалось создать платёж (" + r.errorMessage() + ")");
        throw new KaspiException(r.sessionLost() ? 409 : 502,
                r.sessionLost() ? "Оплата через Kaspi временно недоступна" : "Kaspi не принял запрос: " + r.errorMessage());
    }

    private TopUp owned(Long clientId, Long topUpId) {
        TopUp t = topups.findById(topUpId).orElseThrow(() -> new KaspiException(404, "Пополнение не найдено"));
        if (!t.getClientId().equals(clientId) || t.getKaspiType() == null) {
            throw new KaspiException(404, "Пополнение не найдено");
        }
        return t;
    }

    private Instant parseQrExpiry(String raw) {
        Instant now = Instant.now();
        Instant fallback = now.plus(props.getQrTtl());
        if (raw == null || raw.isBlank()) return fallback;
        Instant parsed;
        try {
            parsed = OffsetDateTime.parse(raw).toInstant();
        } catch (Exception e) {
            try {
                parsed = LocalDateTime.parse(raw).toInstant(KASPI_OFFSET);
            } catch (Exception e2) {
                return fallback;
            }
        }
        // sanity: guard against timezone surprises
        return parsed.isBefore(now) || parsed.isAfter(now.plus(Duration.ofHours(1))) ? fallback : parsed;
    }

    KaspiTopUpView view(TopUp t) {
        return new KaspiTopUpView(t.getId(), t.getKaspiType(), t.getAmount(), t.getStatus().name(),
                t.getKaspiStatus() == null ? null : STATUS_RU.getOrDefault(t.getKaspiStatus(), t.getKaspiStatus()),
                t.getKaspiPhone(), t.getStatus() == TopUp.Status.PENDING ? t.getKaspiQrToken() : null,
                t.getKaspiExpiresAt(), t.getCreatedAt());
    }

    private static Long firstLong(JsonNode d, String... fields) {
        for (String f : fields) {
            JsonNode n = d.path(f);
            if (n.canConvertToLong() && n.asLong() > 0) return n.asLong();
            if (n.isTextual() && n.asText().matches("\\d+")) return Long.parseLong(n.asText());
        }
        return null;
    }

    private static String firstText(JsonNode d, String... fields) {
        for (String f : fields) {
            JsonNode n = d.path(f);
            if (n.isTextual() && !n.asText().isBlank()) return n.asText();
        }
        return null;
    }

    private static BigDecimal decimal(JsonNode n) {
        try {
            if (n.isNumber()) return n.decimalValue();
            if (n.isTextual()) {
                String s = n.asText().replaceAll("[^\\d.,]", "").replace(',', '.');
                return s.isEmpty() ? null : new BigDecimal(s);
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private static String trim(String s) {
        return s == null || s.length() <= 64 ? s : s.substring(0, 64);
    }
}
