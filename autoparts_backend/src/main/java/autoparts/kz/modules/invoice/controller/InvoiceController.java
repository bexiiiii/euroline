package autoparts.kz.modules.invoice.controller;

import autoparts.kz.common.security.SimplePrincipal;
import autoparts.kz.modules.finance.service.FinanceService;
import autoparts.kz.modules.invoice.dto.InvoiceDtos;
import autoparts.kz.modules.order.entity.Order;
import autoparts.kz.modules.order.entity.OrderItem;
import autoparts.kz.modules.order.repository.OrderRepository;
import autoparts.kz.modules.returns.entity.ReturnRequest;
import autoparts.kz.modules.returns.repository.ReturnRequestRepository;
import autoparts.kz.modules.returns.status.ReturnStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/my/invoices")
@RequiredArgsConstructor
public class InvoiceController {
    private final OrderRepository orders;
    private final ReturnRequestRepository returnsRepo;
    private final FinanceService finance;

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public InvoiceDtos.Details get(@AuthenticationPrincipal SimplePrincipal principal, @PathVariable Long id){
        Order o = orders.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!o.getUser().getId().equals(principal.id())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your order");

        var user = o.getUser();
        String fullName = String.join(" ", List.of(
                user.getSurname()==null?"":user.getSurname(),
                user.getName()==null?"":user.getName(),
                user.getFathername()==null?"":user.getFathername()
        )).trim();
        String receiverId = user.getClientName()!=null && !user.getClientName().isBlank() ? user.getClientName() : String.valueOf(user.getId());
        var receiver = new InvoiceDtos.Receiver(receiverId, fullName.isBlank()?user.getEmail():fullName, user.getPhone());

        List<InvoiceDtos.Item> items = o.getItems().stream().map(it -> toItem(it, o)).toList();

        String invoiceNumber = o.getPublicCode()!=null? o.getPublicCode() : String.valueOf(o.getId());
        String receiptNumber = o.getExternalId()!=null? o.getExternalId() : invoiceNumber;
        String deliveryMethod = (o.getDeliveryAddress()!=null && !o.getDeliveryAddress().isBlank()) ? "Доставка" : "Самовывоз";

        return new InvoiceDtos.Details(
                o.getId(),
                invoiceNumber,
                DATE.format(o.getCreatedAt().atZone(ZoneId.systemDefault())),
                DATE_TIME.format(o.getCreatedAt().atZone(ZoneId.systemDefault())),
                receiver,
                o.getDeliveryAddress(),
                deliveryMethod,
                receiptNumber,
                o.getPaymentStatus().name(),
                items
        );
    }

    @PostMapping("/{id}/returns")
    @Transactional
    public InvoiceDtos.ReturnResponse createReturn(@AuthenticationPrincipal SimplePrincipal principal,
                                                   @PathVariable Long id,
                                                   @RequestBody InvoiceDtos.CreateReturn r){
        Order o = orders.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!o.getUser().getId().equals(principal.id())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your order");

        // reject if already has active return for this order
        if (returnsRepo.existsByOrderIdAndCustomerIdAndStatusNot(o.getId(), principal.id(), ReturnStatus.REJECTED)){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Возврат по этому заказу уже оформлен");
        }

        // compute refundable amount based on requested items intersecting order items
        BigDecimal amount = BigDecimal.ZERO;
        for (InvoiceDtos.ReturnItem req : r.items()){
            var opt = o.getItems().stream().filter(oi -> oi.getProduct().getId().equals(req.productId())).findFirst();
            if (opt.isEmpty()) continue;
            OrderItem oi = opt.get();
            int qty = Math.max(0, Math.min(oi.getQuantity(), req.quantity()==null?0:req.quantity()));
            amount = amount.add(oi.getPrice().multiply(BigDecimal.valueOf(qty)));
        }

        // minimal refundable amount: 30000 ₸
        if (amount.compareTo(new BigDecimal("30000")) < 0){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Минимальная сумма возврата 30000 ₸");
        }

        // persist return request (start as NEW; will be credited on approval)
        ReturnRequest rr = ReturnRequest.builder()
                .orderId(o.getId())
                .customerId(principal.id())
                .reason(r.reason())
                .status(autoparts.kz.modules.returns.status.ReturnStatus.NEW)
                .build();
        // store details and amount if fields exist
        try {
            // reflectively set amount/details if compiled entity contains them (safe for older schemas)
            var cls = rr.getClass();
            try { cls.getDeclaredField("amount"); cls.getMethod("setAmount", BigDecimal.class).invoke(rr, amount); } catch (Throwable ignored) {}
            try {
                String json = toJson(r);
                cls.getDeclaredField("detailsJson");
                cls.getMethod("setDetailsJson", String.class).invoke(rr, json);
            } catch (Throwable ignored) {}
        } catch (Exception ignored) {}
        returnsRepo.save(rr);

        return new InvoiceDtos.ReturnResponse(rr.getId(), amount, rr.getStatus().name(), rr.getCreatedAt());
    }

    private static String toJson(Object o){
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(o);
        } catch (Exception e){ return "{}"; }
    }

    private static InvoiceDtos.Item toItem(OrderItem it, Order o){
        var p = it.getProduct();
        BigDecimal total = it.getPrice().multiply(BigDecimal.valueOf(it.getQuantity()));
        String deadline = DATE.format(o.getCreatedAt().plusDays(30).atZone(ZoneId.systemDefault()));
        return new InvoiceDtos.Item(
                it.getId(),
                p.getId(),
                p.getCode(),
                p.getBrand(),
                p.getName(),
                it.getPrice(),
                it.getQuantity(),
                total,
                0,
                deadline
        );
    }
}
