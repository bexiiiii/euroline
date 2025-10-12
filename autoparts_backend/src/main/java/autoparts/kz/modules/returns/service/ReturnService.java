package autoparts.kz.modules.returns.service;


import autoparts.kz.modules.finance.service.FinanceService;
import autoparts.kz.modules.order.repository.OrderRepository;
import autoparts.kz.modules.returns.dto.ReturnDtos;
import autoparts.kz.modules.returns.entity.ReturnRequest;
import autoparts.kz.modules.returns.repository.ReturnRequestRepository;
import autoparts.kz.modules.returns.status.ReturnStatus;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReturnService {
    private final ReturnRequestRepository repo;
    private final FinanceService finance;
    private final OrderRepository orderRepository;
    private final autoparts.kz.modules.telegram.service.TelegramNotificationService telegramNotificationService;
    private final autoparts.kz.modules.cml.service.OneCBridgePublisher oneCBridgePublisher;

    public Page<ReturnDtos.Response> list(String status, Pageable p) {
        Specification<ReturnRequest> spec = (status==null)?null:
                (root, cq, cb) -> cb.equal(root.get("status"), ReturnStatus.valueOf(status));
        return repo.findAll(spec, p).map(this::map);
    }
    public ReturnDtos.Response create(ReturnDtos.Create r){
        ReturnRequest e = ReturnRequest.builder()
                .orderId(r.orderId()).customerId(r.customerId()).reason(r.reason())
                .status(ReturnStatus.NEW).build();
        repo.save(e);
        
        // Отправить уведомление в Telegram
        try {
            telegramNotificationService.notifyReturnRequest(e);
        } catch (Exception ex) {
            // Логируем, но не прерываем процесс
        }
        
        return map(e);
    }
    public ReturnDtos.Response get(Long id){ return map(find(id)); }
    public ReturnDtos.Response patch(Long id, ReturnDtos.PatchStatus r){
        var e = find(id);
        ReturnStatus previousStatus = e.getStatus();
        e.setStatus(ReturnStatus.valueOf(r.status()));
        
        // Отправить уведомление в Telegram при изменении статуса
        try {
            telegramNotificationService.notifyReturnRequest(e);
        } catch (Exception ex) {
            // Логируем, но не прерываем процесс
        }
        
        // On approval – credit amount back to balance (idempotent)
        if ((e.getStatus()==ReturnStatus.APPROVED || e.getStatus()==ReturnStatus.REFUNDED || e.getStatus()==ReturnStatus.PROCESSED)
                && e.getAmount()!=null && e.getAmount().signum()>0){
            try {
                finance.creditReturnByRequest(e.getCustomerId(), e.getAmount(), e.getId());
            } catch (Exception ignored) {}
        }
        repo.save(e);
        if (shouldPublishToOneC(previousStatus, e.getStatus())) {
            oneCBridgePublisher.publishReturnAfterCommit(e);
        }
        return map(e);
    }
    public Page<ReturnDtos.Response> listByCustomer(Long customerId, Pageable p){
        Specification<ReturnRequest> spec = (root, cq, cb) -> cb.equal(root.get("customerId"), customerId);
        return repo.findAll(spec, p).map(this::map);
    }
    public Map<String,Object> process(Long id){
        var e = find(id);
        ReturnStatus previousStatus = e.getStatus();
        e.setStatus(ReturnStatus.PROCESSED);
        repo.save(e);
        if (shouldPublishToOneC(previousStatus, e.getStatus())) {
            oneCBridgePublisher.publishReturnAfterCommit(e);
        }
        return Map.of("processed", true, "id", e.getId());
    }
    public Map<String,Object> stats(){
        long total = repo.count();

        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);
        LocalDate firstDayOfMonth = today.withDayOfMonth(1);
        LocalDate previousMonthStart = firstDayOfMonth.minusMonths(1);

        Instant currentPeriodStart = firstDayOfMonth.atStartOfDay(zone).toInstant();
        Instant previousPeriodStart = previousMonthStart.atStartOfDay(zone).toInstant();
        Instant previousPeriodEnd = currentPeriodStart;

        long currentNew = repo.countCreatedBetween(currentPeriodStart, Instant.now());
        long previousNew = repo.countCreatedBetween(previousPeriodStart, previousPeriodEnd);

        long processing = repo.countByStatus(ReturnStatus.NEW);
        long previousProcessing = repo.countByStatusAndCreatedBetween(ReturnStatus.NEW, previousPeriodStart, previousPeriodEnd);

        BigDecimal currentAmount = repo.sumAmountBetween(currentPeriodStart, Instant.now());
        if (currentAmount == null) currentAmount = BigDecimal.ZERO;
        BigDecimal previousAmount = repo.sumAmountBetween(previousPeriodStart, previousPeriodEnd);
        if (previousAmount == null) previousAmount = BigDecimal.ZERO;

        LocalDateTime currentOrdersStart = firstDayOfMonth.atStartOfDay();
        LocalDateTime currentOrdersEnd = today.plusDays(1).atStartOfDay();
        LocalDateTime previousOrdersStart = previousMonthStart.atStartOfDay();
        LocalDateTime previousOrdersEnd = firstDayOfMonth.atStartOfDay();

        long ordersCurrent = orderRepository.countCreatedBetween(currentOrdersStart, currentOrdersEnd);
        long ordersPrevious = orderRepository.countCreatedBetween(previousOrdersStart, previousOrdersEnd);

        double returnRateCurrent = ordersCurrent > 0 ? (double) currentNew / ordersCurrent * 100.0 : 0.0;
        double returnRatePrevious = ordersPrevious > 0 ? (double) previousNew / ordersPrevious * 100.0 : 0.0;

        return Map.of(
                "total", Map.of(
                        "value", total,
                        "changePercent", roundPercent(changePercent(currentNew, previousNew))
                ),
                "newReturns", Map.of(
                        "value", currentNew,
                        "changePercent", roundPercent(changePercent(currentNew, previousNew))
                ),
                "processing", Map.of(
                        "value", processing,
                        "delta", processing - previousProcessing
                ),
                "amount", Map.of(
                        "current", currentAmount,
                        "previous", previousAmount,
                        "changePercent", roundPercent(changePercent(currentAmount, previousAmount))
                ),
                "returnRate", Map.of(
                        "value", roundPercent(returnRateCurrent),
                        "previous", roundPercent(returnRatePrevious),
                        "change", roundPercent(returnRateCurrent - returnRatePrevious)
                )
        );
    }
    private ReturnRequest find(Long id){ return repo.findById(id).orElseThrow(() -> new EntityNotFoundException("Return not found")); }
    private ReturnDtos.Response map(ReturnRequest e){
        return new ReturnDtos.Response(e.getId(), e.getOrderId(), e.getCustomerId(), e.getReason(),
                e.getStatus().name(), e.getCreatedAt(), e.getAmount());
    }

    private double changePercent(long current, long previous) {
        if (previous == 0) {
            return current > 0 ? 100.0 : 0.0;
        }
        return ((double) current - previous) / previous * 100.0;
    }

    private double changePercent(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current != null && current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        if (current == null) {
            current = BigDecimal.ZERO;
        }
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    private double roundPercent(double value) {
        return BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    private boolean shouldPublishToOneC(ReturnStatus previousStatus, ReturnStatus currentStatus) {
        if (currentStatus == null || currentStatus == previousStatus) {
            return false;
        }
        return java.util.EnumSet.of(ReturnStatus.APPROVED, ReturnStatus.PROCESSED, ReturnStatus.REFUNDED)
                .contains(currentStatus);
    }
}
