package autoparts.kz.modules.stockOneC.controller;

import autoparts.kz.modules.stockOneC.service.OneCService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/test/1c")
@RequiredArgsConstructor
public class StockController {
    private final OneCService oneCService;

    @GetMapping("/{externalCode}")
    public ResponseEntity<?> test(@PathVariable String externalCode) {
        return oneCService.getStockByExternalCode(externalCode)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
