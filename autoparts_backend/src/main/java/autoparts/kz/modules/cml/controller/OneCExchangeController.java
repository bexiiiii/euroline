package autoparts.kz.modules.cml.controller;

import autoparts.kz.modules.cml.config.RequestIdFilter;
import autoparts.kz.modules.cml.service.OneCExchangeService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/1c-exchange")
public class OneCExchangeController {

    private final OneCExchangeService exchangeService;

    public OneCExchangeController(OneCExchangeService exchangeService) {
        this.exchangeService = exchangeService;
    }

    @GetMapping(produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<byte[]> handleGet(@RequestParam("type") String type,
                                            @RequestParam("mode") String mode,
                                            @RequestParam(value = "filename", required = false) String filename,
                                            HttpServletRequest request) {
        String requestId = (String) request.getAttribute(RequestIdFilter.HEADER);
        return switch ((type + ":" + mode).toLowerCase()) {
            case "catalog:checkauth" -> text(exchangeService.handleCheckAuth());
            case "catalog:init" -> text(exchangeService.handleInit());
            case "catalog:import" -> text(exchangeService.handleImport(type, filename != null ? filename : "import.xml", requestId));
            case "sale:query" -> exchangeService.handleSaleQuery(requestId);
            case "sale:success" -> text(exchangeService.handleSaleSuccess());
            case "sale:import" -> text(exchangeService.handleImport(type, filename != null ? filename : "orders_changes.xml", requestId));
            default -> ResponseEntity.badRequest()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(("failure\nunknown mode " + type + ":" + mode).getBytes());
        };
    }

    @PostMapping(consumes = MediaType.ALL_VALUE, produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<byte[]> handlePost(@RequestParam("type") String type,
                                             @RequestParam("mode") String mode,
                                             @RequestParam("filename") String filename,
                                             HttpServletRequest request) throws IOException {
        String requestId = (String) request.getAttribute(RequestIdFilter.HEADER);
        long contentLength = request.getContentLengthLong();
        String response = exchangeService.handleFileUpload(type, filename, request.getInputStream(), contentLength, requestId);
        return text(response);
    }

    private ResponseEntity<byte[]> text(String body) {
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .body(body.getBytes());
    }
}
