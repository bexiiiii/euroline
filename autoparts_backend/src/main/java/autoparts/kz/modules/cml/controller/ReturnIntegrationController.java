package autoparts.kz.modules.cml.controller;

import autoparts.kz.modules.cml.service.ReturnIntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST API для управления интеграцией возвратов с 1C
 * Доступен только администраторам
 */
@RestController
@RequestMapping("/api/integration/1c/returns")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class ReturnIntegrationController {

    private final ReturnIntegrationService returnIntegrationService;

    /**
     * Ручная отправка конкретного возврата в 1C
     * POST /api/integration/1c/returns/{id}/send
     */
    @PostMapping("/{id}/send")
    public ResponseEntity<Map<String, Object>> sendReturnTo1C(@PathVariable Long id) {
        try {
            returnIntegrationService.sendReturnTo1C(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Возврат успешно отправлен в 1C",
                "refundId", id
            ));
        } catch (Exception e) {
            log.error("Ошибка отправки возврата {} в 1C: {}", id, e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Ошибка отправки: " + e.getMessage(),
                "refundId", id
            ));
        }
    }

    /**
     * Массовая отправка всех ожидающих возвратов в 1C
     * POST /api/integration/1c/returns/send-pending
     */
    @PostMapping("/send-pending")
    public ResponseEntity<Map<String, Object>> sendPendingReturns() {
        try {
            int count = returnIntegrationService.sendPendingReturnsTo1C();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Обработано возвратов: " + count,
                "count", count
            ));
        } catch (Exception e) {
            log.error("Ошибка массовой отправки возвратов: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Ошибка: " + e.getMessage()
            ));
        }
    }

    /**
     * Предпросмотр XML документа возврата
     * GET /api/integration/1c/returns/preview-xml
     */
    @GetMapping("/preview-xml")
    public ResponseEntity<String> previewReturnsXml() {
        try {
            String xml = returnIntegrationService.generateReturnsPackageXml();
            return ResponseEntity.ok()
                    .header("Content-Type", "application/xml; charset=UTF-8")
                    .body(xml);
        } catch (Exception e) {
            log.error("Ошибка генерации XML: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body("<?xml version=\"1.0\" encoding=\"UTF-8\"?><error>" + e.getMessage() + "</error>");
        }
    }

    /**
     * Статистика возвратов и их интеграции с 1C
     * GET /api/integration/1c/returns/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getReturnStats() {
        // TODO: Реализовать сбор статистики
        return ResponseEntity.ok(Map.of(
            "message", "Статистика в разработке"
        ));
    }
}
