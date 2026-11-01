package autoparts.kz.modules.onecOrders;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyStore;
import java.security.cert.CertificateFactory;
import java.time.Duration;
import java.math.BigDecimal;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;

@Component
@ConditionalOnProperty(prefix = "integration.onec-orders", name = "enabled", havingValue = "true")
public class OneCOrderApiClient {
    private final OneCOrderProperties properties;
    private final RestTemplate http;

    @org.springframework.beans.factory.annotation.Autowired
    public OneCOrderApiClient(OneCOrderProperties properties) throws Exception {
        this(properties, createHttp(properties));
    }

    OneCOrderApiClient(OneCOrderProperties properties, RestTemplate http) {
        this.properties = properties;
        this.http = http;
    }

    private static RestTemplate createHttp(OneCOrderProperties p) throws Exception {
        URI uri = URI.create(p.getUrl() == null ? "" : p.getUrl());
        if (!"https".equals(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null) {
            throw new IllegalArgumentException("1C orders URL must use HTTPS without embedded credentials");
        }
        if (p.getUsername() == null || p.getUsername().isBlank() || p.getPassword() == null || p.getPassword().isBlank()) {
            throw new IllegalArgumentException("1C orders credentials are required");
        }
        OneCOrderCommandMapper.uuid(p.getOrganizationRefKey(), "organizationRefKey");
        if (p.getOdataUrl() != null && !p.getOdataUrl().isBlank()) {
            URI odata = URI.create(p.getOdataUrl());
            if (!uri.getScheme().equals(odata.getScheme()) || !uri.getHost().equals(odata.getHost())
                    || uri.getPort() != odata.getPort() || odata.getUserInfo() != null) {
                throw new IllegalArgumentException("1C OData must use the same HTTPS origin as the orders API");
            }
            OneCOrderCommandMapper.uuid(p.getCurrencyRefKey(), "currencyRefKey");
        }
        var builder = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10));
        if (p.getCaCertificate() != null && !p.getCaCertificate().isBlank()) {
            KeyStore trust = KeyStore.getInstance(KeyStore.getDefaultType());
            trust.load(null, null);
            try (var in = Files.newInputStream(Path.of(p.getCaCertificate()))) {
                int i = 0;
                for (var certificate : CertificateFactory.getInstance("X.509").generateCertificates(in)) {
                    trust.setCertificateEntry("onec-ca-" + i++, certificate);
                }
                if (i == 0) throw new IllegalArgumentException("1C CA certificate file is empty");
            }
            TrustManagerFactory tm = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
            tm.init(trust);
            SSLContext ssl = SSLContext.getInstance("TLS");
            ssl.init(null, tm.getTrustManagers(), null);
            builder.sslContext(ssl);
        }
        var factory = new JdkClientHttpRequestFactory(builder.build());
        factory.setReadTimeout(Duration.ofSeconds(20));
        return new RestTemplate(factory);
    }

    public String send(String commandJson) {
        return recoverOrSend(commandJson, null, true);
    }

    public String recoverOrSend(String commandJson, String knownRef, boolean allowCreate) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
        headers.setBasicAuth(properties.getUsername(), properties.getPassword(), StandardCharsets.UTF_8);
        if (properties.getToken() != null && !properties.getToken().isBlank()) {
            headers.set("X-SiteIntegration-Token", properties.getToken());
        }
        if (properties.getOdataUrl() != null && !properties.getOdataUrl().isBlank()) {
            String existing = knownRef == null || knownRef.isBlank() ? findExisting(commandJson, headers) : knownRef;
            if (existing != null) {
                completeDraft(existing, commandJson, headers);
                return existing;
            }
        }
        if (!allowCreate) throw new UncertainDeliveryException();
        var response = http.postForEntity(properties.getUrl(), new HttpEntity<>(commandJson, headers), JsonNode.class);
        JsonNode body = response.getBody();
        if (!response.getStatusCode().is2xxSuccessful() || body == null || !body.path("success").asBoolean()
                || !"processed".equals(body.path("status").asText())) {
            throw new IllegalStateException("1C did not confirm that the command was processed");
        }
        String ref;
        try {
            ref = OneCOrderCommandMapper.uuid(body.path("oneCRefKey").asText(), "response.oneCRefKey");
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("1C acknowledgment has no valid document key");
        }
        if (properties.getOdataUrl() != null && !properties.getOdataUrl().isBlank()) {
            completeDraft(ref, commandJson, headers);
        }
        return ref;
    }

    private String findExisting(String commandJson, HttpHeaders headers) {
        JsonNode command;
        try { command = new ObjectMapper().readTree(commandJson); }
        catch (java.io.IOException ex) { throw new IllegalArgumentException("Invalid saved order command"); }
        String code = command.path("data").path("siteOrderNumber").asText();
        if (!code.matches("[A-Z0-9]{5,10}")) throw new IllegalArgumentException("Invalid site order number for recovery");
        String marker = "Website order #" + code;
        String found = null;
        // This 1C publication silently returns no rows for substringof on its
        // comment field. Read paged projections and compare the exact first line.
        for (int offset = 0; offset < 10000; offset += 500) {
            String url = properties.getOdataUrl().replaceAll("/+$", "")
                    + "/Document_ЗаказКлиента?$format=json&$select=Ref_Key,Комментарий,DeletionMark&$top=500&$skip=" + offset;
            JsonNode body = http.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), JsonNode.class).getBody();
            if (body == null || !body.path("value").isArray()) throw new IllegalStateException("1C recovery lookup failed");
            var rows = body.path("value");
            for (var row : rows) {
                String comment = row.path("Комментарий").asText();
                if (!row.path("DeletionMark").asBoolean() && (comment.equals(marker) || comment.startsWith(marker + "\n") || comment.startsWith(marker + "\r\n"))) {
                    String ref = OneCOrderCommandMapper.uuid(row.path("Ref_Key").asText(), "existing document key");
                    if (found != null && !found.equals(ref)) throw new IllegalArgumentException("Multiple active 1C documents match the site order");
                    found = ref;
                }
            }
            if (rows.size() < 500) return found;
        }
        throw new IllegalArgumentException("1C recovery scan limit reached; manual review required");
    }

    static class UncertainDeliveryException extends IllegalStateException {
        UncertainDeliveryException() { super("Previous create attempt is uncertain; only document lookup may be retried"); }
    }

    // SiteIntegration v24.11 writes item amounts but leaves the document total and
    // currency empty. Complete only these empty fields, without posting the order.
    private void completeDraft(String ref, String commandJson, HttpHeaders headers) {
        JsonNode command;
        try { command = new ObjectMapper().readTree(commandJson); }
        catch (java.io.IOException ex) { throw new IllegalArgumentException("Invalid saved order command"); }
        String url = properties.getOdataUrl().replaceAll("/+$", "")
                + "/Document_ЗаказКлиента(guid'" + ref + "')?$format=json";
        var response = http.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), JsonNode.class);
        JsonNode document = response.getBody();
        if (document == null || !ref.equals(document.path("Ref_Key").asText()) || document.path("DeletionMark").asBoolean()) {
            throw new IllegalArgumentException("1C document is missing or marked for deletion");
        }
        var expectedItems = command.path("data").path("items");
        var actualItems = document.path("Товары");
        if (!itemQuantities(expectedItems, false).equals(itemQuantities(actualItems, true))) {
            throw new IllegalArgumentException("1C document items differ from the saved order");
        }
        BigDecimal expected = BigDecimal.ZERO;
        for (var item : expectedItems) expected = expected.add(item.path("price").decimalValue().multiply(item.path("quantity").decimalValue()));
        BigDecimal actual = document.path("СуммаДокумента").decimalValue();
        Map<String, Object> patch = new HashMap<>();
        var completedItems = actualItems.deepCopy();
        boolean completeItems = false;
        for (var item : completedItems) {
            // UT KZ derives the header total from СуммаСНДС. The old extension
            // leaves it empty even when Сумма is set. Do not infer tax amounts.
            if (item.has("СуммаСНДС") && item.path("СуммаСНДС").decimalValue().signum() == 0
                    && item.path("Сумма").decimalValue().signum() > 0) {
                if (item.path("СуммаНДС").decimalValue().signum() != 0 || item.path("Отменено").asBoolean()) {
                    throw new IllegalArgumentException("1C line tax or cancellation requires manual review");
                }
                BigDecimal lineTotal = item.path("Цена").decimalValue().multiply(item.path("Количество").decimalValue());
                if (item.path("Сумма").decimalValue().compareTo(lineTotal) != 0) {
                    throw new IllegalArgumentException("1C line amount differs from quantity and price");
                }
                ((com.fasterxml.jackson.databind.node.ObjectNode)item).put("СуммаСНДС", lineTotal);
                completeItems = true;
            }
        }
        if (completeItems) patch.put("Товары", completedItems);
        if (actual.compareTo(expected) != 0) {
            if (actual.signum() != 0) throw new IllegalArgumentException("1C document has a conflicting nonzero total");
            patch.put("СуммаДокумента", expected);
        }
        String currency = document.path("Валюта_Key").asText();
        if (currency.isBlank() || currency.equals("00000000-0000-0000-0000-000000000000")) {
            patch.put("Валюта_Key", properties.getCurrencyRefKey());
        } else if (!currency.equalsIgnoreCase(properties.getCurrencyRefKey())) {
            throw new IllegalArgumentException("1C document has a conflicting currency");
        }
        if (patch.isEmpty()) return;
        if (document.path("Posted").asBoolean()) throw new IllegalArgumentException("Cannot complete a posted 1C document");
        HttpHeaders patchHeaders = new HttpHeaders(); patchHeaders.putAll(headers);
        if (response.getHeaders().getETag() != null) patchHeaders.setIfMatch(response.getHeaders().getETag());
        http.exchange(url, HttpMethod.PATCH, new HttpEntity<>(patch, patchHeaders), String.class);
        JsonNode saved = http.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), JsonNode.class).getBody();
        if (saved == null || saved.path("СуммаДокумента").decimalValue().compareTo(expected) != 0
                || !properties.getCurrencyRefKey().equalsIgnoreCase(saved.path("Валюта_Key").asText())) {
            throw new IllegalStateException("1C document completion was not confirmed");
        }
    }

    private Map<String, BigDecimal> itemQuantities(JsonNode items, boolean fromOneC) {
        if (!items.isArray() || items.isEmpty()) throw new IllegalArgumentException("1C order has no items");
        Map<String, BigDecimal> quantities = new HashMap<>();
        for (var item : items) {
            String product = item.path(fromOneC ? "Номенклатура_Key" : "productRefKey").asText().toLowerCase(java.util.Locale.ROOT);
            BigDecimal price = item.path(fromOneC ? "Цена" : "price").decimalValue();
            BigDecimal quantity = item.path(fromOneC ? "Количество" : "quantity").decimalValue();
            String key = product + ":" + price.stripTrailingZeros().toPlainString();
            quantities.merge(key, quantity, BigDecimal::add);
        }
        quantities.replaceAll((key, value) -> value.stripTrailingZeros());
        return quantities;
    }
}
