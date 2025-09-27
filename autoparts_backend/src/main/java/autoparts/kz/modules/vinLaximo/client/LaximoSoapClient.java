package autoparts.kz.modules.vinLaximo.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

@Component
public class LaximoSoapClient {

    private final RestTemplate http;
    private final String endpoint;
    private final String login;
    private final String password;

    // нужный неймспейс для WebCatalog.Kito
    private static final String EC_NS = "http://WebCatalog.Kito.ec";

    public LaximoSoapClient(RestTemplate http,
                            @Value("${laximo.cat.soap-url}") String endpoint,
                            @Value("${laximo.cat.login}") String login,
                            @Value("${laximo.cat.password}") String password) {
        this.http = http;
        this.endpoint = endpoint;
        this.login = login;
        this.password = password;
    }

    /** Выполняет команды и возвращает срезанный <response>...</response> */
    public String execCommands(List<String> commands) {
        String raw = execCommandsRaw(commands);
        return autoparts.kz.modules.vinLaximo.SoapXml.SoapXml.sliceResponseXml(raw);
    }

    /** Возвращает полный SOAP-ответ (для отладки) */
    public String execCommandsRaw(List<String> commands) {
        String requestPayload = String.join("\n", commands);
        String hmac = md5(requestPayload + password);
        String envelope = buildSoap12Envelope(requestPayload, login, hmac);

        HttpHeaders h = new HttpHeaders();
        h.set(HttpHeaders.CONTENT_TYPE, "application/soap+xml; charset=utf-8; action=\"QueryDataLogin\"");

        // Для SOAP 1.2 SOAPAction обычно не требуется; если вдруг понадобится:
        // h.set("Action", "QueryDataLogin");

        ResponseEntity<String> resp = http.exchange(
                endpoint, HttpMethod.POST, new HttpEntity<>(envelope, h), String.class);

        if (resp.getBody() == null) {
            throw new RuntimeException("Laximo SOAP empty body. HTTP " + resp.getStatusCode());
        }
        if (!resp.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Laximo SOAP HTTP " + resp.getStatusCode() + " body=" + head(resp.getBody()));
        }
        return resp.getBody();
    }

    private static String buildSoap12Envelope(String cmd, String login, String hmac) {
        String EC_NS = "http://WebCatalog.Kito.ec";
        String body =
                "<soapenv:Envelope xmlns:soapenv=\"http://www.w3.org/2003/05/soap-envelope\" " +
                        "xmlns:ec=\"" + EC_NS + "\">" +
                        "<soapenv:Body>" +
                        "<ec:QueryDataLogin>" +
                        "<ec:request>" + xmlEscape(cmd) + "</ec:request>" +
                        "<ec:login>"   + xmlEscape(login) + "</ec:login>" +
                        "<ec:hmac>"    + xmlEscape(hmac) + "</ec:hmac>" +
                        "</ec:QueryDataLogin>" +
                        "</soapenv:Body>" +
                        "</soapenv:Envelope>";
        return body; // без trim(), уже без лидирующих \n/пробелов
    }


    private static String md5(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) { throw new IllegalStateException(e); }
    }

    private static String xmlEscape(String s) {
        return s.replace("&","&amp;")
                .replace("<","&lt;")
                .replace(">","&gt;")
                .replace("\"","&quot;")
                .replace("'","&apos;");
    }

    private static String head(String s) {
        String one = s.replaceAll("\\s+"," ");
        return one.substring(0, Math.min(300, one.length()));
    }
}
