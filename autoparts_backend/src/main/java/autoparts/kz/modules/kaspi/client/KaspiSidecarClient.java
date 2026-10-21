package autoparts.kz.modules.kaspi.client;

import autoparts.kz.modules.kaspi.config.KaspiProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Thin HTTP client for the kaspi-pos-automation sidecar. Every call returns the raw HTTP status + JSON body;
 * interpretation (session lost, final statuses) lives in the services.
 */
@Component
@Slf4j
public class KaspiSidecarClient {

    /** Kaspi StatusCode when the cashier session was evicted (login from another device). */
    public static final int STATUS_SESSION_EVICTED = -101001;

    public record Creds(String tokenSn, String vtokenSecret, String profileId) {}

    public record Result(int httpStatus, JsonNode body) {
        public boolean httpOk() { return httpStatus >= 200 && httpStatus < 300; }

        /** Kaspi-level StatusCode (0 or absent = OK). */
        public int kaspiStatusCode() {
            JsonNode c = body.path("StatusCode");
            return c.isNumber() ? c.asInt() : 0;
        }

        /** The sidecar rejected our credentials or Kaspi evicted the session — admin must re-login. */
        public boolean sessionLost() {
            return httpStatus == 401 || kaspiStatusCode() == STATUS_SESSION_EVICTED;
        }

        public boolean ok() { return httpOk() && kaspiStatusCode() == 0; }

        public JsonNode data() { return body.path("Data"); }

        public String errorMessage() {
            for (String f : new String[]{"error", "Message", "message", "errorMessage"}) {
                JsonNode n = body.path(f);
                if (n.isTextual() && !n.asText().isBlank()) return n.asText();
            }
            return "HTTP " + httpStatus + (kaspiStatusCode() != 0 ? ", StatusCode " + kaspiStatusCode() : "");
        }
    }

    private final RestClient http;
    private final ObjectMapper mapper;

    public KaspiSidecarClient(KaspiProperties props, ObjectMapper mapper) {
        this.mapper = mapper;
        SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
        rf.setConnectTimeout((int) props.getConnectTimeout().toMillis());
        rf.setReadTimeout((int) props.getReadTimeout().toMillis());
        this.http = RestClient.builder().baseUrl(props.getSidecarUrl()).requestFactory(rf).build();
    }

    // ── Auth (SMS login of the cashier) ──

    public Result authInit() {
        return post("/api/auth/init", null, Map.of());
    }

    public Result authSendPhone(String processId, String phone) {
        return post("/api/auth/send-phone", null, Map.of("processId", processId, "phoneNumber", phone));
    }

    public Result authVerifyOtp(String processId, String otp) {
        return post("/api/auth/verify-otp", null, Map.of("processId", processId, "otp", otp));
    }

    public Result sessionCheck(Creds c) {
        return get("/api/session/check", c, Map.of());
    }

    // ── Invoice (счёт на телефон) ──

    public Result invoiceCreate(Creds c, String phone, BigDecimal amount, String comment) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("phoneNumber", phone);
        body.put("amount", amount);
        body.put("comment", comment == null ? "" : comment);
        return post("/api/invoice/create", c, body);
    }

    public Result invoiceDetails(Creds c, long operationId) {
        return get("/api/invoice/details", c, Map.of("operationId", String.valueOf(operationId)));
    }

    public Result invoiceCancel(Creds c, long operationId) {
        return post("/api/invoice/cancel", c, Map.of("operationId", String.valueOf(operationId)));
    }

    // ── QR ──

    public Result qrCreate(Creds c, BigDecimal amount) {
        return post("/api/qr/create", c, Map.of("amount", amount));
    }

    public Result qrStatus(Creds c, long qrOperationId) {
        return get("/api/qr/status", c, Map.of("qrOperationId", String.valueOf(qrOperationId)));
    }

    // ── plumbing ──

    private Result post(String path, Creds c, Object body) {
        return http.post().uri(path)
                .headers(h -> applyCreds(h, c))
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .exchange((req, res) -> new Result(res.getStatusCode().value(), read(res.getBody())));
    }

    private Result get(String path, Creds c, Map<String, String> query) {
        return http.get().uri(u -> {
                    u.path(path);
                    query.forEach(u::queryParam);
                    return u.build();
                })
                .headers(h -> applyCreds(h, c))
                .exchange((req, res) -> new Result(res.getStatusCode().value(), read(res.getBody())));
    }

    private static void applyCreds(org.springframework.http.HttpHeaders h, Creds c) {
        if (c == null) return;
        h.set("X-Token-SN", c.tokenSn());
        h.set("X-Vtoken-Secret", c.vtokenSecret());
        if (c.profileId() != null) h.set("X-Profile-Id", c.profileId());
    }

    private JsonNode read(InputStream in) {
        try {
            JsonNode n = mapper.readTree(in);
            return n == null || n.isMissingNode() ? NullNode.getInstance() : n;
        } catch (Exception e) {
            return NullNode.getInstance();
        }
    }
}
