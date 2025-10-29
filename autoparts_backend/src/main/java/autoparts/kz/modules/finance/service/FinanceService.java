package autoparts.kz.modules.finance.service;


import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.auth.repository.UserRepository;
import autoparts.kz.modules.finance.dto.FinanceDtos;
import autoparts.kz.modules.finance.entity.ClientBalance;
import autoparts.kz.modules.finance.entity.FinanceTxn;
import autoparts.kz.modules.finance.entity.RefundRequest;
import autoparts.kz.modules.finance.entity.TopUp;
import autoparts.kz.modules.finance.repository.ClientBalanceRepository;
import autoparts.kz.modules.finance.repository.FinanceTxnRepository;
import autoparts.kz.modules.finance.repository.RefundRequestRepository;
import autoparts.kz.modules.finance.repository.TopUpRepository;
import autoparts.kz.modules.common.storage.FileStorageService;
import autoparts.kz.modules.notifications.entity.Notification;
import autoparts.kz.modules.notifications.service.NotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinanceService {
    private final ClientBalanceRepository balances;
    private final TopUpRepository topups;
    private final FinanceTxnRepository txns;
    private final RefundRequestRepository refunds;
    private final NotificationService notifications;
    private final UserRepository users;
    private final autoparts.kz.modules.telegram.service.TelegramNotificationService telegramNotificationService;
    private final autoparts.kz.modules.cml.service.ReturnIntegrationService returnIntegrationService;
    private final FileStorageService fileStorageService;

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private ClientBalance ensureBalance(Long clientId) {
        ClientBalance balance = balances.findById(clientId).orElse(null);
        if (balance == null) {
            balance = new ClientBalance();
            balance.setClientId(clientId);
            balance.setBalance(BigDecimal.ZERO);
            balance.setCreditLimit(BigDecimal.ZERO);
            balance.setCreditUsed(BigDecimal.ZERO);
            balance.setQrCodeUrl(null);
            return balances.save(balance);
        }
        boolean dirty = false;
        if (balance.getBalance() == null) {
            balance.setBalance(BigDecimal.ZERO);
            dirty = true;
        }
        if (balance.getCreditLimit() == null) {
            balance.setCreditLimit(BigDecimal.ZERO);
            dirty = true;
        }
        if (balance.getCreditUsed() == null) {
            balance.setCreditUsed(BigDecimal.ZERO);
            dirty = true;
        }
        return dirty ? balances.save(balance) : balance;
    }

    private BigDecimal availableCredit(ClientBalance balance) {
        BigDecimal limit = safe(balance.getCreditLimit());
        BigDecimal used = safe(balance.getCreditUsed());
        BigDecimal available = limit.subtract(used);
        return available.signum() < 0 ? BigDecimal.ZERO : available;
    }

    /**
     * Проверяет достаточность средств (баланс + доступный кредит) для совершения покупки.
     * Выбрасывает исключение если средств недостаточно.
     */
    public void validateSufficientFunds(Long clientId, BigDecimal requiredAmount) {
        if (requiredAmount == null || requiredAmount.signum() <= 0) {
            return;
        }
        ClientBalance balance = ensureBalance(clientId);
        BigDecimal currentBalance = safe(balance.getBalance());
        BigDecimal creditAvailable = availableCredit(balance);
        BigDecimal totalAvailable = currentBalance.add(creditAvailable);
        
        if (totalAvailable.compareTo(requiredAmount) < 0) {
            throw new IllegalStateException(
                String.format("Недостаточно средств для оформления заказа. " +
                    "Требуется: %.2f ₸, Доступно: %.2f ₸ (Баланс: %.2f ₸ + Кредит: %.2f ₸)",
                    requiredAmount, totalAvailable, currentBalance, creditAvailable)
            );
        }
    }

    /**
     * Списывает сумму заказа с баланса и/или кредита клиента.
     * Сначала списывается с баланса, затем используется кредит если нужно.
     */
    public void chargeForOrder(Long clientId, BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            return;
        }
        ClientBalance balance = ensureBalance(clientId);
        
        // Списываем с enforceLimit=false, т.к. мы уже проверили достаточность средств в validateSufficientFunds
        applyChargeAmount(balance, amount, false);
        
        balances.save(balance);
        log.info("Charged {} ₸ from client {} balance. New balance: {}, credit used: {}", 
            amount, clientId, balance.getBalance(), balance.getCreditUsed());
    }

    private void applyPositiveAmount(ClientBalance balance, BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            return;
        }
        BigDecimal debt = safe(balance.getCreditUsed());
        BigDecimal toDebt = amount.min(debt);
        if (toDebt.signum() > 0) {
            balance.setCreditUsed(debt.subtract(toDebt));
        }
        BigDecimal remainder = amount.subtract(toDebt);
        if (remainder.signum() > 0) {
            balance.setBalance(safe(balance.getBalance()).add(remainder));
        }
    }

    private void applyChargeAmount(ClientBalance balance, BigDecimal amount, boolean enforceLimit) {
        if (amount == null || amount.signum() <= 0) {
            return;
        }
        BigDecimal balancePortion = amount.min(safe(balance.getBalance()));
        if (balancePortion.signum() > 0) {
            balance.setBalance(safe(balance.getBalance()).subtract(balancePortion));
        }
        BigDecimal remaining = amount.subtract(balancePortion);
        if (remaining.signum() > 0) {
            BigDecimal creditAvailable = availableCredit(balance);
            if (enforceLimit && creditAvailable.compareTo(remaining) < 0) {
                throw new IllegalStateException("Недостаточно кредитного лимита для списания");
            }
            balance.setCreditUsed(safe(balance.getCreditUsed()).add(remaining));
        }
    }

    // Top-ups
    public Page<FinanceDtos.TopUpResponse> listTopUps(String status, Pageable p){
        Specification<TopUp> spec = (status==null)?null:(r, cq, cb)->cb.equal(r.get("status"), TopUp.Status.valueOf(status));
        return topups.findAll(spec, p).map(this::toTopUpResponse);
    }
    public Page<FinanceDtos.TopUpResponse> listTopUpsByClient(Long clientId, Pageable p){
        Specification<TopUp> spec = (r, cq, cb)->cb.equal(r.get("clientId"), clientId);
        return topups.findAll(spec, p).map(this::toTopUpResponse);
    }
    public FinanceDtos.TopUpResponse createTopUp(FinanceDtos.TopUpCreate r){
        TopUp t = new TopUp();
        t.setClientId(r.clientId());
        t.setAmount(r.amount());
        t.setStatus(TopUp.Status.PENDING);
        if (r.paymentMethod() != null && !r.paymentMethod().isBlank()) {
            t.setPaymentMethod(r.paymentMethod());
        }
        if (r.adminComment() != null && !r.adminComment().isBlank()) {
            t.setAdminComment(r.adminComment());
        }
        topups.save(t);
        
        // Отправить уведомление в Telegram о новом пополнении
        try {
            telegramNotificationService.notifyBalanceTopUp(t);
        } catch (Exception ex) {
            // Логируем, но не прерываем процесс
        }
        
        return toTopUpResponse(t);
    }
    public FinanceDtos.TopUpResponse getTopUp(Long id){
        TopUp t = topups.findById(id).orElseThrow(()->new EntityNotFoundException("TopUp not found"));
        return toTopUpResponse(t);
    }
    public TopUp findTopUpEntity(Long id){ return topups.findById(id).orElseThrow(()->new EntityNotFoundException("TopUp not found")); }
    public TopUp saveTopUpEntity(TopUp t){ return topups.save(t); }

    private FinanceDtos.TopUpResponse toTopUpResponse(TopUp t){
        User user = users.findById(t.getClientId()).orElse(null);
        String clientName = user != null ? resolveClientName(user) : null;
        String clientEmail = user != null ? user.getEmail() : null;
        String clientPhone = user != null ? user.getPhone() : null;

        return new FinanceDtos.TopUpResponse(
                t.getId(),
                t.getClientId(),
                t.getAmount(),
                t.getStatus() != null ? t.getStatus().name() : null,
                t.getCreatedAt(),
                t.getPaymentMethod(),
                t.getReceiptUrl(),
                t.getAdminComment(),
                clientName,
                clientEmail,
                clientPhone
        );
    }

    private String resolveClientName(User user) {
        if (user.getClientName() != null && !user.getClientName().isBlank()) {
            return user.getClientName();
        }

        StringBuilder builder = new StringBuilder();
        if (user.getSurname() != null && !user.getSurname().isBlank()) {
            builder.append(user.getSurname().trim());
        }
        if (user.getName() != null && !user.getName().isBlank()) {
            if (builder.length() > 0) {
                builder.append(' ');
            }
            builder.append(user.getName().trim());
        }
        if (user.getFathername() != null && !user.getFathername().isBlank()) {
            if (builder.length() > 0) {
                builder.append(' ');
            }
            builder.append(user.getFathername().trim());
        }
        if (builder.length() > 0) {
            return builder.toString();
        }
        return user.getEmail();
    }

    private String resolveContactName(User user) {
        StringBuilder builder = new StringBuilder();
        if (user.getSurname() != null && !user.getSurname().isBlank()) {
            builder.append(user.getSurname().trim());
        }
        if (user.getName() != null && !user.getName().isBlank()) {
            if (builder.length() > 0) {
                builder.append(' ');
            }
            builder.append(user.getName().trim());
        }
        if (user.getFathername() != null && !user.getFathername().isBlank()) {
            if (builder.length() > 0) {
                builder.append(' ');
            }
            builder.append(user.getFathername().trim());
        }
        if (builder.length() > 0) {
            return builder.toString();
        }
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail();
        }
        return null;
    }
    public FinanceDtos.TopUpResponse patchTopUp(Long id, FinanceDtos.PatchStatus r){
        TopUp t = topups.findById(id).orElseThrow();
        boolean statusChanged = false;

        if (r.paymentMethod() != null && !r.paymentMethod().isBlank()) {
            t.setPaymentMethod(r.paymentMethod());
        }
        if (r.adminComment() != null) {
            t.setAdminComment(r.adminComment());
        }
        if (r.status() != null && !r.status().isBlank()) {
            TopUp.Status newStatus = TopUp.Status.valueOf(r.status());
            if (newStatus != t.getStatus()) {
                t.setStatus(newStatus);
                statusChanged = true;
            }
        }

        topups.save(t);

        if (statusChanged) {
            // Отправить уведомление в Telegram об изменении статуса
            try {
                telegramNotificationService.notifyBalanceTopUp(t);
            } catch (Exception ex) {
                // Логируем, но не прерываем процесс
            }
            if (t.getStatus()== TopUp.Status.APPROVED) {
                applyApprovedTopUp(t);
                String title = "Пополнение одобрено";
                String body = "Заявка #"+t.getId()+" на сумму " + t.getAmount() + " ₸ подтверждена. Баланс пополнен.";
                notifications.createAndBroadcast(t.getClientId(), title, body, Notification.Type.FINANCE, Notification.Severity.SUCCESS);
            } else if (t.getStatus()== TopUp.Status.REJECTED) {
                String title = "Пополнение отклонено";
                String body = "Заявка #"+t.getId()+" на сумму " + t.getAmount() + " ₸ отклонена.";
                notifications.createAndBroadcast(t.getClientId(), title, body, Notification.Type.FINANCE, Notification.Severity.ERROR);
            } else {
                String title = "Статус пополнения обновлён";
                String body = "Заявка #"+t.getId()+": статус " + t.getStatus().name();
                notifications.createAndBroadcast(t.getClientId(), title, body, Notification.Type.FINANCE, Notification.Severity.INFO);
            }
        }

        return toTopUpResponse(t);
    }

    private void applyApprovedTopUp(TopUp topUp) {
        BigDecimal amount = safe(topUp.getAmount());
        if (amount.signum() <= 0) {
            return;
        }
        String desc = "TopUp " + topUp.getId();
        if (txns.existsByClientIdAndTypeAndDescription(topUp.getClientId(), "TOPUP", desc)) {
            // ничего не делаем, уже применено ранее
            return;
        }
        ClientBalance balance = ensureBalance(topUp.getClientId());
        applyPositiveAmount(balance, amount);
        balances.save(balance);
        addTxn(topUp.getClientId(), "TOPUP", amount, desc);
    }

    // Balance
    public FinanceDtos.BalanceResponse getBalance(Long clientId){
        ClientBalance current = ensureBalance(clientId);
        reconcileBalance(clientId);
        current = ensureBalance(clientId);
        BigDecimal availableCredit = availableCredit(current);
        return new FinanceDtos.BalanceResponse(
                current.getClientId(),
                safe(current.getBalance()),
                safe(current.getCreditLimit()),
                safe(current.getCreditUsed()),
                availableCredit,
                current.getQrCodeUrl(),
                current.getUpdatedAt()
        );
    }
    public FinanceDtos.BalanceResponse adjust(Long clientId, FinanceDtos.BalanceAdjust r){
        adjustBalance(clientId, r.delta(), r.reason());
        addTxn(clientId,"ADJUST", r.delta(), r.reason());
        return getBalance(clientId);
    }
    public Page<FinanceDtos.ClientBalanceView> listBalances(Pageable p){
        return balances.findAll(p).map(this::toClientBalanceView);
    }

    public FinanceDtos.ClientBalanceView updateCreditProfile(Long clientId, FinanceDtos.CreditProfileUpdate request) {
        ClientBalance balance = ensureBalance(clientId);
        boolean changed = false;
        if (request.creditLimit() != null) {
            BigDecimal newLimit = request.creditLimit().max(BigDecimal.ZERO);
            if (safe(balance.getCreditUsed()).compareTo(newLimit) > 0) {
                throw new IllegalArgumentException("Нельзя установить лимит меньше текущего долга клиента");
            }
            balance.setCreditLimit(newLimit);
            changed = true;
        }
        if (Boolean.TRUE.equals(request.clearQr()) && balance.getQrCodeKey() != null) {
            try {
                fileStorageService.delete(balance.getQrCodeKey());
            } catch (Exception ex) {
                // логируем, но не блокируем очищение ссылки
                org.slf4j.LoggerFactory.getLogger(FinanceService.class)
                        .warn("Failed to delete QR code {} from storage: {}", balance.getQrCodeKey(), ex.getMessage());
            }
            balance.setQrCodeKey(null);
            balance.setQrCodeUrl(null);
            changed = true;
        }
        if (changed) {
            balances.save(balance);
        }
        return toClientBalanceView(balance);
    }

    public FinanceDtos.ClientBalanceView storeQrCode(Long clientId, FileStorageService.StoredObject storedObject) {
        ClientBalance balance = ensureBalance(clientId);
        if (balance.getQrCodeKey() != null && !Objects.equals(balance.getQrCodeKey(), storedObject.key())) {
            try {
                fileStorageService.delete(balance.getQrCodeKey());
            } catch (Exception ex) {
                org.slf4j.LoggerFactory.getLogger(FinanceService.class)
                        .warn("Failed to delete previous QR code {}: {}", balance.getQrCodeKey(), ex.getMessage());
            }
        }
        balance.setQrCodeKey(storedObject.key());
        balance.setQrCodeUrl(storedObject.url());
        balances.save(balance);
        return toClientBalanceView(balance);
    }

    private FinanceDtos.ClientBalanceView toClientBalanceView(ClientBalance balance) {
        User user = users.findById(balance.getClientId()).orElse(null);
        String establishmentName = null;
        String contactName = null;
        String email = null;
        String phone = null;

        if (user != null) {
            if (user.getClientName() != null && !user.getClientName().isBlank()) {
                establishmentName = user.getClientName().trim();
            }
            contactName = resolveContactName(user);
            email = user.getEmail();
            phone = user.getPhone();
        }

        return new FinanceDtos.ClientBalanceView(
                balance.getClientId(),
                safe(balance.getBalance()),
                safe(balance.getCreditLimit()),
                safe(balance.getCreditUsed()),
                balance.getQrCodeUrl(),
                balance.getUpdatedAt(),
                contactName,
                establishmentName,
                email,
                phone
        );
    }

    // Transactions
    public Page<FinanceTxn> listTxns(Long clientId, Pageable p){
        Specification<FinanceTxn> spec = (clientId==null)?null:(root, cq, cb)->cb.equal(root.get("clientId"), clientId);
        return txns.findAll(spec, p);
    }

    // Refund requests
    public Page<RefundRequest> listRefunds(String status, Pageable p){
        Specification<RefundRequest> spec=(status==null)?null:(r,cq,cb)->cb.equal(r.get("status"), RefundRequest.Status.valueOf(status));
        return refunds.findAll(spec,p);
    }
    public RefundRequest createRefund(RefundRequest r){ r.setStatus(RefundRequest.Status.NEW); return refunds.save(r); }
    public RefundRequest patchRefund(Long id, FinanceDtos.PatchStatus s){
        RefundRequest rr = refunds.findById(id).orElseThrow();

        if (s.adminComment() != null) {
            rr.setAdminComment(s.adminComment());
        }

        boolean statusChanged = false;
        if (s.status() != null && !s.status().isBlank()) {
            RefundRequest.Status newStatus = RefundRequest.Status.valueOf(s.status());
            if (newStatus != rr.getStatus()) {
                rr.setStatus(newStatus);
                statusChanged = true;
            }
        }

        refunds.save(rr);

        if (statusChanged) {
            if (rr.getStatus() == RefundRequest.Status.APPROVED || rr.getStatus() == RefundRequest.Status.DONE) {
                applyApprovedRefund(rr);
                String title = "Возврат одобрен";
                String body = "Заявка на возврат #" + rr.getId() + " на сумму " + rr.getAmount() + " ₸ одобрена.";
                notifications.createAndBroadcast(rr.getClientId(), title, body, Notification.Type.FINANCE, Notification.Severity.SUCCESS);
                
                // ✅ НОВОЕ: Автоматическая отправка одобренного возврата в 1C через CommerceML
                try {
                    returnIntegrationService.sendReturnTo1C(rr.getId());
                } catch (Exception e) {
                    // Логируем ошибку, но не блокируем операцию одобрения
                    org.slf4j.LoggerFactory.getLogger(FinanceService.class)
                        .error("Не удалось отправить возврат {} в 1C: {}", rr.getId(), e.getMessage());
                }
            } else if (rr.getStatus() == RefundRequest.Status.REJECTED) {
                String title = "Возврат отклонён";
                String body = "Заявка на возврат #" + rr.getId() + " отклонена.";
                notifications.createAndBroadcast(rr.getClientId(), title, body, Notification.Type.FINANCE, Notification.Severity.ERROR);
            } else if (rr.getStatus() == RefundRequest.Status.IN_REVIEW) {
                String title = "Возврат на рассмотрении";
                String body = "Заявка на возврат #" + rr.getId() + " переведена в статус рассмотрения.";
                notifications.createAndBroadcast(rr.getClientId(), title, body, Notification.Type.FINANCE, Notification.Severity.INFO);
            }
        }

        return rr;
    }

    // Stats
    public Map<String,Object> stats(){
        // ✅ ОПТИМИЗИРОВАНО: Используем агрегирующие запросы вместо загрузки всех записей
        
        // 1. Считаем общий баланс агрегирующим запросом
        BigDecimal totalBalance = balances.sumAllBalances();
        if (totalBalance == null) totalBalance = BigDecimal.ZERO;

        Instant monthStart = LocalDate.now(ZoneId.systemDefault())
                .withDayOfMonth(1)
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant();

        // 2. Считаем пополнения за месяц агрегирующим запросом
        BigDecimal monthlyTopUps = topups.sumApprovedTopUpsAfterDate(monthStart);
        if (monthlyTopUps == null) monthlyTopUps = BigDecimal.ZERO;
        
        // 3. Считаем ожидающие пополнения
        long pendingTopUps = topups.countByStatus(TopUp.Status.PENDING);

        // 4. Считаем возвраты за месяц агрегирующим запросом
        List<RefundRequest.Status> completedStatuses = List.of(
            RefundRequest.Status.DONE, 
            RefundRequest.Status.APPROVED
        );
        BigDecimal monthlyRefunds = refunds.sumRefundsByStatusesAfterDate(completedStatuses, monthStart);
        if (monthlyRefunds == null) monthlyRefunds = BigDecimal.ZERO;

        // 5. Считаем ожидающие возвраты
        long pendingRefunds = refunds.countByStatusIn(
            List.of(RefundRequest.Status.NEW, RefundRequest.Status.IN_REVIEW)
        );

        // 6. Считаем выручку агрегирующим запросом
        BigDecimal revenue = txns.sumAmountByType("CHARGE");
        if (revenue == null) revenue = BigDecimal.ZERO;

        // 7. Общее количество операций
        long totalTopUps = topups.count();
        long totalRefunds = refunds.count();

        BigDecimal totalCreditLimit = balances.sumAllCreditLimits();
        if (totalCreditLimit == null) totalCreditLimit = BigDecimal.ZERO;
        BigDecimal totalCreditUsed = balances.sumAllCreditUsed();
        if (totalCreditUsed == null) totalCreditUsed = BigDecimal.ZERO;

        Map<String,Object> response = new HashMap<>();
        response.put("totalBalance", totalBalance);
        response.put("monthlyTopUps", monthlyTopUps);
        response.put("monthlyRefunds", monthlyRefunds);
        response.put("pendingOperations", pendingTopUps + pendingRefunds);
        response.put("revenue", revenue);
        response.put("topUps", totalTopUps);
        response.put("refunds", totalRefunds);
        response.put("totalCreditLimit", totalCreditLimit);
        response.put("totalCreditUsed", totalCreditUsed);
        response.put("totalCreditAvailable", totalCreditLimit.subtract(totalCreditUsed));
        return response;
    }

    private void applyApprovedRefund(RefundRequest rr) {
        if (rr.getAmount() == null || rr.getClientId() == null) {
            return;
        }

        String desc = "RefundReq " + rr.getId();
        if (txns.existsByClientIdAndTypeAndDescription(rr.getClientId(), "REFUND", desc)) {
            return;
        }
        ClientBalance balance = ensureBalance(rr.getClientId());
        applyPositiveAmount(balance, rr.getAmount());
        balances.save(balance);
        addTxn(rr.getClientId(), "REFUND", rr.getAmount(), desc);
    }

    // helpers
    private void adjustBalance(Long clientId, BigDecimal delta, String reason){
        if (delta == null || delta.signum() == 0) {
            return;
        }
        ClientBalance balance = ensureBalance(clientId);
        if (delta.signum() > 0) {
            applyPositiveAmount(balance, delta);
        } else {
            applyChargeAmount(balance, delta.negate(), false);
        }
        balances.save(balance);
    }
    private void addTxn(Long clientId, String type, BigDecimal amount, String desc){
        FinanceTxn t = new FinanceTxn(); t.setClientId(clientId); t.setType(type); t.setAmount(amount); t.setDescription(desc); txns.save(t);
    }

    // Public helper to credit returns to balance with RETURN txn type
    public void creditReturn(Long clientId, BigDecimal amount, String description){
        adjustBalance(clientId, amount, description);
        addTxn(clientId, "RETURN", amount, description);
    }

    public void creditReturnByRequest(Long clientId, BigDecimal amount, Long returnRequestId){
        if (amount == null || amount.signum() <= 0) return;
        String desc = "ReturnReq "+returnRequestId;
        if (!txns.existsByClientIdAndTypeAndDescription(clientId, "RETURN", desc)){
            adjustBalance(clientId, amount, "RETURN APPROVED "+returnRequestId);
            addTxn(clientId, "RETURN", amount, desc);
        }
    }

    // Charge client balance for an order (idempotent)
    public void chargeOrder(Long clientId, BigDecimal amount, Long orderId){
        if (amount == null || amount.signum() <= 0) return;
        String desc = "Order "+orderId;
        if (txns.existsByClientIdAndTypeAndDescription(clientId, "CHARGE", desc)){
            return;
        }
        ClientBalance balance = ensureBalance(clientId);
        applyChargeAmount(balance, amount, true);
        balances.save(balance);
        addTxn(clientId, "CHARGE", amount, desc);
    }

    public boolean hasChargeForOrder(Long clientId, Long orderId){
        return txns.existsByClientIdAndTypeAndDescription(clientId, "CHARGE", "Order "+orderId);
    }

    public void refundOrderIfCharged(Long clientId, BigDecimal amount, Long orderId){
        if (amount == null || amount.signum() <= 0) return;
        if (!hasChargeForOrder(clientId, orderId)) return;
        String desc = "Refund Order "+orderId;
        if (txns.existsByClientIdAndTypeAndDescription(clientId, "REFUND", desc)){
            return;
        }
        ClientBalance balance = ensureBalance(clientId);
        applyPositiveAmount(balance, amount);
        balances.save(balance);
        addTxn(clientId, "REFUND", amount, desc);
    }

    // Ensure balance aligns with approved top-ups and ledger
    @jakarta.transaction.Transactional
    protected void reconcileBalance(Long clientId){
        // 1) For each APPROVED top-up ensure a TOPUP txn exists
        var approved = topups.findByClientIdAndStatus(clientId, TopUp.Status.APPROVED);
        for (var t : approved){
            applyApprovedTopUp(t);
        }
        ClientBalance balance = ensureBalance(clientId);
        if (balance.getCreditLimit() != null && balance.getCreditUsed() != null
                && balance.getCreditLimit().compareTo(balance.getCreditUsed()) < 0) {
            balance.setCreditUsed(balance.getCreditLimit());
            balances.save(balance);
        }
    }
}
