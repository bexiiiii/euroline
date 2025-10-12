package autoparts.kz.modules.admin.reports.controller;

import autoparts.kz.modules.admin.reports.entity.GeneratedReport;
import autoparts.kz.modules.admin.reports.repository.GeneratedReportRepository;
import autoparts.kz.modules.manualProducts.repository.ProductRepository;
import autoparts.kz.modules.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

// controller/ReportController.java
@RestController
@RequestMapping("/api/reports") @RequiredArgsConstructor
public class ReportController {
    private final GeneratedReportRepository repo;
    private final ProductRepository products;
    private final OrderRepository orders;

    @PostMapping("/generate") @PreAuthorize("hasRole('ADMIN')")
    public GeneratedReport generate(@RequestBody Map<String,String> body) throws IOException {
        String type = body.getOrDefault("type","SALES");
        String format = body.getOrDefault("format","CSV");
        Path dir = Paths.get("storage/reports"); Files.createDirectories(dir);
        Path file = dir.resolve(type+"_"+System.currentTimeMillis()+".csv");
        try (BufferedWriter w = Files.newBufferedWriter(file, StandardCharsets.UTF_8)) {
            w.write('\ufeff');
            if ("PRODUCTS".equalsIgnoreCase(type)) {
                w.write("id,name,price,stock\n");
                for (var p: products.findAll()) w.write(p.getId()+","+p.getName()+","+p.getPrice()+","+p.getStock()+"\n");
            } else { // SALES (orders)
                w.write("orderId,total,status,createdAt\n");
                for (var o: orders.findAll()) w.write(o.getId()+","+o.getTotalAmount()+","+o.getStatus()+","+o.getCreatedAt()+"\n");
            }
        }
        var r = new GeneratedReport(); r.setType(type); r.setFormat(format); r.setPath(file.toString()); return repo.save(r);
    }

    @GetMapping("/{id}") @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ByteArrayResource> get(@PathVariable Long id) throws IOException {
        var r = repo.findById(id).orElseThrow();
        Path path = Paths.get(r.getPath());
        ByteArrayResource res = new ByteArrayResource(Files.readAllBytes(path));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename="+path.getFileName())
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .contentLength(res.contentLength())
                .body(res);
    }
}
