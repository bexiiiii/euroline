package autoparts.kz.modules.finance.controller;



import autoparts.kz.modules.finance.entity.ClientBalance;
import autoparts.kz.modules.finance.repository.ClientBalanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/finance-admin")
@RequiredArgsConstructor
public class FinanceBalanceController {
    private final ClientBalanceRepository repo;

    @GetMapping("/balances")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<ClientBalance> list(@RequestParam(defaultValue="0") int page,
                                    @RequestParam(defaultValue="50") int size,
                                    @RequestParam(defaultValue="updatedAt,desc") String sort) {
        String[] s = sort.split(",");
        Pageable p = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(s.length>1?s[1]:"desc"), s[0]));
        return repo.findAll(p);
    }
}
