package autoparts.kz.modules.finance.service;


import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.auth.repository.UserRepository;
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
import autoparts.kz.modules.notifications.entity.Notification;
import autoparts.kz.modules.notifications.service.NotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
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
public class FinanceService {
    private final ClientBalanceRepository balances;
    private final TopUpRepository topups;
    private final FinanceTxnRepository txns;
    private final RefundRequestRepository refunds;
    private final NotificationService notifications;
    private final UserRepository users;

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
            if (t.getStatus()== TopUp.Status.APPROVED) {
                String desc = "TopUp "+t.getId();
                if (!txns.existsByClientIdAndTypeAndDescription(t.getClientId(), "TOPUP", desc)){
                    adjustBalance(t.getClientId(), t.getAmount(), "TOPUP APPROVED");
                    addTxn(t.getClientId(),"TOPUP", t.getAmount(), desc);
                }
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

    // Balance
    public FinanceDtos.BalanceResponse getBalance(Long clientId){
        ClientBalance b = balances.findById(clientId).orElseGet(()->{ ClientBalance nb=new ClientBalance(); nb.setClientId(clientId); nb.setBalance(BigDecimal.ZERO); return balances.save(nb); });
        // reconcile: ensure all APPROVED top-ups are reflected in txns and balance
        reconcileBalance(clientId);
        // reload
        ClientBalance cur = balances.findById(clientId).orElse(b);
        return new FinanceDtos.BalanceResponse(cur.getClientId(), cur.getBalance(), cur.getUpdatedAt());
    }
    public FinanceDtos.BalanceResponse adjust(Long clientId, FinanceDtos.BalanceAdjust r){
        adjustBalance(clientId, r.delta(), r.reason());
        addTxn(clientId,"ADJUST", r.delta(), r.reason());
        return getBalance(clientId);
    }
    public Page<FinanceDtos.ClientBalanceView> listBalances(Pageable p){
        return balances.findAll(p).map(this::toClientBalanceView);
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
                balance.getBalance(),
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
        var allBalances = balances.findAll();
        BigDecimal totalBalance = allBalances.stream()
                .map(ClientBalance::getBalance)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Instant monthStart = LocalDate.now(ZoneId.systemDefault())
                .withDayOfMonth(1)
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant();

        var allTopUps = topups.findAll();
        BigDecimal monthlyTopUps = allTopUps.stream()
                .filter(t -> t.getCreatedAt() != null && !t.getCreatedAt().isBefore(monthStart))
                .filter(t -> t.getStatus() == TopUp.Status.APPROVED)
                .map(TopUp::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingTopUps = allTopUps.stream()
                .filter(t -> t.getStatus() == TopUp.Status.PENDING)
                .count();

        var allRefunds = refunds.findAll();
        BigDecimal monthlyRefunds = allRefunds.stream()
                .filter(r -> r.getCreatedAt() != null && !r.getCreatedAt().isBefore(monthStart))
                .filter(r -> r.getStatus() == RefundRequest.Status.DONE || r.getStatus() == RefundRequest.Status.APPROVED)
                .map(RefundRequest::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingRefunds = allRefunds.stream()
                .filter(r -> r.getStatus() == RefundRequest.Status.NEW || r.getStatus() == RefundRequest.Status.IN_REVIEW)
                .count();

        BigDecimal revenue = txns.findAll().stream()
                .filter(t->"CHARGE".equals(t.getType()))
                .map(FinanceTxn::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String,Object> response = new HashMap<>();
        response.put("totalBalance", totalBalance);
        response.put("monthlyTopUps", monthlyTopUps);
        response.put("monthlyRefunds", monthlyRefunds);
        response.put("pendingOperations", pendingTopUps + pendingRefunds);
        response.put("revenue", revenue);
        response.put("topUps", allTopUps.size());
        response.put("refunds", allRefunds.size());
        return response;
    }

    private void applyApprovedRefund(RefundRequest rr) {
        if (rr.getAmount() == null || rr.getClientId() == null) {
            return;
        }

        String desc = "RefundReq " + rr.getId();
        if (!txns.existsByClientIdAndTypeAndDescription(rr.getClientId(), "REFUND", desc)) {
            adjustBalance(rr.getClientId(), rr.getAmount(), "REFUND APPROVED " + rr.getId());
            addTxn(rr.getClientId(), "REFUND", rr.getAmount(), desc);
        }
    }

    // helpers
    private void adjustBalance(Long clientId, BigDecimal delta, String reason){
        ClientBalance b = balances.findById(clientId).orElseGet(()->{ClientBalance nb=new ClientBalance(); nb.setClientId(clientId); nb.setBalance(BigDecimal.ZERO); return nb;});
        b.setBalance(b.getBalance().add(delta)); balances.save(b);
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
        if (amount == null) return;
        String desc = "Order "+orderId;
        if (!txns.existsByClientIdAndTypeAndDescription(clientId, "CHARGE", desc)){
            // CHARGE txns are stored as positive amount; balance is decreased by delta
            adjustBalance(clientId, amount.negate(), "ORDER CHARGE "+orderId);
            addTxn(clientId, "CHARGE", amount, desc);
        }
    }

    public boolean hasChargeForOrder(Long clientId, Long orderId){
        return txns.existsByClientIdAndTypeAndDescription(clientId, "CHARGE", "Order "+orderId);
    }

    public void refundOrderIfCharged(Long clientId, BigDecimal amount, Long orderId){
        if (amount == null) return;
        if (!hasChargeForOrder(clientId, orderId)) return;
        String desc = "Refund Order "+orderId;
        if (!txns.existsByClientIdAndTypeAndDescription(clientId, "REFUND", desc)){
            adjustBalance(clientId, amount, "ORDER REFUND "+orderId);
            addTxn(clientId, "REFUND", amount, desc);
        }
    }

    // Ensure balance aligns with approved top-ups and ledger
    @jakarta.transaction.Transactional
    protected void reconcileBalance(Long clientId){
        // 1) For each APPROVED top-up ensure a TOPUP txn exists
        var approved = topups.findByClientIdAndStatus(clientId, TopUp.Status.APPROVED);
        for (var t : approved){
            String desc = "TopUp "+t.getId();
            if (!txns.existsByClientIdAndTypeAndDescription(clientId, "TOPUP", desc)){
                addTxn(clientId, "TOPUP", t.getAmount(), desc);
                adjustBalance(clientId, t.getAmount(), desc);
            }
        }

        // 2) Optionally recompute authoritative balance from ledger
        BigDecimal ledger = txns.sumAmountByClientId(clientId);
        ClientBalance b = balances.findById(clientId).orElseGet(()->{ ClientBalance nb=new ClientBalance(); nb.setClientId(clientId); nb.setBalance(BigDecimal.ZERO); return nb; });
        if (b.getBalance() == null || b.getBalance().compareTo(ledger) != 0){
            b.setBalance(ledger);
            balances.save(b);
        }
    }
}
