package autoparts.kz.modules.order.controller;

import autoparts.kz.common.security.SimplePrincipal;
import autoparts.kz.modules.order.dto.CreateOrderRequest;
import autoparts.kz.modules.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import autoparts.kz.modules.order.repository.OrderRepository;
import autoparts.kz.modules.admin.mappers.OrderMapper;
import autoparts.kz.modules.order.dto.OrderResponse;
import autoparts.kz.modules.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;

    @PostMapping("/create")
    public OrderResponse createOrder(@AuthenticationPrincipal SimplePrincipal principal,
                                     @Valid @RequestBody CreateOrderRequest req) {
        Order order = orderService.createOrderFromCart(principal.id(), req);
        return OrderMapper.toResponse(order);
    }

    @PostMapping("/{id}/confirm")
    public void confirmOrder(@PathVariable Long id) {
        orderService.confirmOrder(id);
    }

    @PostMapping("/{id}/cancel")
    public void cancelOrder(@PathVariable Long id) {
        orderService.cancelOrder(id);
    }

    @GetMapping("/my")
    @Transactional(readOnly = true)
    public Page<OrderResponse> myOrders(@AuthenticationPrincipal SimplePrincipal principal,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) {
        var p = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return orderRepository.findByUser_Id(principal.id(), p).map(OrderMapper::toResponse);
    }
}
