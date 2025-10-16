package autoparts.kz.modules.cml.controller;

import autoparts.kz.modules.cml.config.RequestIdFilter;
import autoparts.kz.modules.cml.service.OneCExchangeService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/1c-exchange")
public class OneCExchangeController {

    private static final Logger log = LoggerFactory.getLogger(OneCExchangeController.class);
    private final OneCExchangeService exchangeService;

    public OneCExchangeController(OneCExchangeService exchangeService) {
        this.exchangeService = exchangeService;
    }

    // ✅ Тестовый endpoint для проверки соединения
    @GetMapping(value = "/test", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> testConnection() {
        return ResponseEntity.ok("success");
    }

    @GetMapping(produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> handleGet(@RequestParam("type") String type,
                                            @RequestParam("mode") String mode,
                                            @RequestParam(value = "filename", required = false) String filename,
                                            HttpServletRequest request) {
        // ✅ Безопасная обработка requestId
        String requestId = (String) request.getAttribute(RequestIdFilter.HEADER);
        if (requestId == null) {
            requestId = java.util.UUID.randomUUID().toString();
        }
        
        try {
            String response = switch ((type + ":" + mode).toLowerCase()) {
                case "catalog:checkauth" -> exchangeService.handleCheckAuth();
                case "catalog:init" -> exchangeService.handleInit();
                case "catalog:import" -> exchangeService.handleImport(type, filename != null ? filename : "import.xml", requestId);
                case "sale:query" -> exchangeService.handleSaleQuery(requestId);
                case "sale:success" -> exchangeService.handleSaleSuccess();
                case "sale:import" -> exchangeService.handleImport(type, filename != null ? filename : "orders_changes.xml", requestId);
                // ✅ НОВОЕ: Обработка возвратов
                case "return:query" -> exchangeService.handleReturnQuery(requestId);
                case "return:success" -> exchangeService.handleReturnSuccess();
                default -> "failure\nunknown mode " + type + ":" + mode;
            };
            
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(response);
                    
        } catch (Exception e) {
            e.printStackTrace();
            log.error("[{}] Error handling request type={} mode={}: {}", requestId, type, mode, e.getMessage(), e);
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("failure\n" + e.getMessage());
        }
    }

    @PostMapping(consumes = MediaType.ALL_VALUE, produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> handlePost(@RequestParam("type") String type,
                                             @RequestParam("mode") String mode,
                                             @RequestParam("filename") String filename,
                                             HttpServletRequest request) {
        // ✅ Безопасная обработка requestId
        String requestId = (String) request.getAttribute(RequestIdFilter.HEADER);
        if (requestId == null) {
            requestId = java.util.UUID.randomUUID().toString();
        }
        
        try {
            long contentLength = request.getContentLengthLong();
            String response = exchangeService.handleFileUpload(type, filename, request.getInputStream(), contentLength, requestId);
            
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(response);
                    
        } catch (Exception e) {
            e.printStackTrace();
            log.error("[{}] Error uploading file type={} mode={} filename={}: {}", requestId, type, mode, filename, e.getMessage(), e);
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("failure\n" + e.getMessage());
        }
    }
}
