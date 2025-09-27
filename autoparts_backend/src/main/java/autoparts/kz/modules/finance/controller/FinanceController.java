package autoparts.kz.modules.finance.controller;


import autoparts.kz.modules.finance.dto.FinanceDtos;
import autoparts.kz.modules.finance.entity.FinanceTxn;
import autoparts.kz.modules.finance.entity.RefundRequest;
import autoparts.kz.modules.finance.service.FinanceService;
import autoparts.kz.common.security.SimplePrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
public class FinanceController {
    private final FinanceService svc;

    // top-ups
    @GetMapping("/top-ups") @PreAuthorize("hasRole('ADMIN')")
    public Page<FinanceDtos.TopUpResponse> topUps(@RequestParam(required=false) String status,
                                                  @RequestParam(defaultValue="0") int page,
                                                  @RequestParam(defaultValue="20") int size){
        return svc.listTopUps(status, PageRequest.of(page,size, Sort.by("createdAt").descending()));
    }
    @PostMapping("/top-ups") public FinanceDtos.TopUpResponse createTopUp(@RequestBody FinanceDtos.TopUpCreate r){ return svc.createTopUp(r); }
    @GetMapping("/top-ups/{id}") @PreAuthorize("hasRole('ADMIN')") public FinanceDtos.TopUpResponse getTopUp(@PathVariable Long id){ return svc.getTopUp(id); }
    @PatchMapping("/top-ups/{id}") @PreAuthorize("hasRole('ADMIN')") public FinanceDtos.TopUpResponse patchTopUp(@PathVariable Long id, @RequestBody FinanceDtos.PatchStatus s){ return svc.patchTopUp(id, s); }

    // balances
    @GetMapping("/balances") @PreAuthorize("hasRole('ADMIN')")
    public Page<FinanceDtos.ClientBalanceView> balances(@RequestParam(defaultValue="0") int page,
                                                        @RequestParam(defaultValue="50") int size){
        return svc.listBalances(PageRequest.of(page,size, Sort.by("updatedAt").descending()));
    }
    @GetMapping("/balances/{id}") @PreAuthorize("hasRole('ADMIN')") public FinanceDtos.BalanceResponse balance(@PathVariable Long id){ return svc.getBalance(id); }
    @PostMapping("/balances/{id}/adjust") @PreAuthorize("hasRole('ADMIN')") public FinanceDtos.BalanceResponse adjust(@PathVariable Long id, @RequestBody FinanceDtos.BalanceAdjust r){ return svc.adjust(id, r); }

    // my balance
    @GetMapping("/my/balance")
    public FinanceDtos.BalanceResponse myBalance(@org.springframework.security.core.annotation.AuthenticationPrincipal SimplePrincipal principal){
        return svc.getBalance(principal.id());
    }

    // transactions
    @GetMapping("/transactions") @PreAuthorize("hasRole('ADMIN')")
    public Page<FinanceTxn> txns(@RequestParam(required=false) Long clientId,
                                 @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="50") int size){
        return svc.listTxns(clientId, PageRequest.of(page,size, Sort.by("createdAt").descending()));
    }

    // my transactions (for authenticated user)
    @GetMapping("/my/transactions")
    public Page<FinanceTxn> myTxns(@org.springframework.security.core.annotation.AuthenticationPrincipal SimplePrincipal principal,
                                   @RequestParam(defaultValue="0") int page,
                                   @RequestParam(defaultValue="50") int size){
        return svc.listTxns(principal.id(), PageRequest.of(page,size, Sort.by("createdAt").descending()));
    }

    // my top-ups (for authenticated user)
    @GetMapping("/my/top-ups")
    public Page<FinanceDtos.TopUpResponse> myTopUps(@org.springframework.security.core.annotation.AuthenticationPrincipal SimplePrincipal principal,
                                                    @RequestParam(defaultValue="0") int page,
                                                    @RequestParam(defaultValue="20") int size){
        return svc.listTopUpsByClient(principal.id(), PageRequest.of(page,size, Sort.by("createdAt").descending()));
    }

    @PostMapping("/my/top-ups")
    public FinanceDtos.TopUpResponse createMyTopUp(@org.springframework.security.core.annotation.AuthenticationPrincipal SimplePrincipal principal,
                                                   @RequestBody FinanceDtos.TopUpCreate r){
        return svc.createTopUp(new FinanceDtos.TopUpCreate(principal.id(), r.amount(), r.paymentMethod(), r.adminComment()));
    }

    // upload receipt for my top-up
    @PostMapping("/my/top-ups/{id}/receipt")
    public autoparts.kz.modules.finance.entity.TopUp uploadReceipt(@org.springframework.security.core.annotation.AuthenticationPrincipal SimplePrincipal principal,
                                                                   @PathVariable Long id,
                                                                   @RequestParam("file") MultipartFile file) throws java.io.IOException {
        var t = svc.getTopUp(id);
        if (!t.clientId().equals(principal.id())) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Not your top-up");
        }
        java.nio.file.Path dir = java.nio.file.Paths.get("storage/receipts/topups");
        java.nio.file.Files.createDirectories(dir);
        String original = file.getOriginalFilename()==null?"receipt":file.getOriginalFilename();
        java.nio.file.Path path = dir.resolve("topup_"+id+"_"+System.currentTimeMillis()+"_"+original);
        java.nio.file.Files.copy(file.getInputStream(), path, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

        var entity = svc.findTopUpEntity(id);
        entity.setReceiptUrl("/files/receipts/topups/"+path.getFileName());
        return svc.saveTopUpEntity(entity);
    }

    // refunds
    @GetMapping("/refund-requests") @PreAuthorize("hasRole('ADMIN')")
    public Page<RefundRequest> refundReqs(@RequestParam(required=false) String status,
                                          @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size){
        return svc.listRefunds(status, PageRequest.of(page,size, Sort.by("createdAt").descending()));
    }
    @PostMapping("/refund-requests") public RefundRequest refundCreate(@RequestBody RefundRequest r){ return svc.createRefund(r); }
    @PatchMapping("/refund-requests/{id}") @PreAuthorize("hasRole('ADMIN')") public RefundRequest refundPatch(@PathVariable Long id, @RequestBody FinanceDtos.PatchStatus s){ return svc.patchRefund(id, s); }
    @GetMapping("/refund-history") @PreAuthorize("hasRole('ADMIN')") public Page<RefundRequest> refundHistory(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="50") int size){ return svc.listRefunds(null, PageRequest.of(page,size)); }

    // stats
    @GetMapping("/stats") @PreAuthorize("hasRole('ADMIN')") public Map<String,Object> stats(){ return svc.stats(); }
}
