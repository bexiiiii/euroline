package autoparts.kz.modules.order.controller;


import autoparts.kz.modules.order.dto.order.OrderFilter;
import autoparts.kz.modules.order.entity.Order;
import autoparts.kz.modules.order.repository.OrderRepository;
import autoparts.kz.modules.order.service.spec.OrderSpecs;
import autoparts.kz.modules.order.dto.OrderResponse;
import autoparts.kz.modules.admin.mappers.OrderMapper;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderQueryController {

    private final OrderRepository repo;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public Page<OrderResponse> list(OrderFilter f,
                                    @RequestParam(defaultValue="0") int page,
                                    @RequestParam(defaultValue="20") int size,
                                    @RequestParam(defaultValue="createdAt,desc") String sort) {
        String[] s = sort.split(",");
        Pageable p = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(s.length>1?s[1]:"desc"), s[0]));
        
        // Create a new Specification instance instead of using the deprecated where() method
        Specification<Order> spec = Specification.allOf(
                OrderSpecs.q(f.getQ()),
                OrderSpecs.status(f.getStatus()),
                OrderSpecs.paymentStatus(f.getPaymentStatus()),
                OrderSpecs.period(f.getFrom(), f.getTo())
        );
        
        return repo.findAll(spec, p).map(OrderMapper::toResponse);
    }

    @PostMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InputStreamResource> export(OrderFilter f) throws Exception {
        var data = list(f, 0, Integer.MAX_VALUE, "createdAt,desc").getContent();
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                .setHeader("orderId", "customer", "total", "status", "paymentStatus", "createdAt")
                .build();

        try (OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8)) {
            writer.write('\ufeff');
            try (CSVPrinter csv = new CSVPrinter(writer, csvFormat)) {
                for (OrderResponse o : data) {
                    csv.printRecord(
                            o.getId(),
                            o.getCustomerEmail(),
                            o.getTotalAmount(),
                            o.getStatus(),
                            o.getPaymentStatus(),
                            o.getCreatedAt()
                    );
                }
            }
        }

        byte[] bytes = outputStream.toByteArray();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=orders.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .contentLength(bytes.length)
                .body(new InputStreamResource(new ByteArrayInputStream(bytes)));
    }
}
