package autoparts.kz.modules.returns.service;


import autoparts.kz.modules.returns.dto.ReturnDtos;
import autoparts.kz.modules.returns.entity.ReturnRequest;
import autoparts.kz.modules.returns.repository.ReturnRequestRepository;
import autoparts.kz.modules.returns.status.ReturnStatus;
import autoparts.kz.modules.finance.service.FinanceService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReturnService {
    private final ReturnRequestRepository repo;
    private final FinanceService finance;

    public Page<ReturnDtos.Response> list(String status, Pageable p) {
        Specification<ReturnRequest> spec = (status==null)?null:
                (root, cq, cb) -> cb.equal(root.get("status"), ReturnStatus.valueOf(status));
        return repo.findAll(spec, p).map(this::map);
    }
    public ReturnDtos.Response create(ReturnDtos.Create r){
        ReturnRequest e = ReturnRequest.builder()
                .orderId(r.orderId()).customerId(r.customerId()).reason(r.reason())
                .status(ReturnStatus.NEW).build();
        repo.save(e); return map(e);
    }
    public ReturnDtos.Response get(Long id){ return map(find(id)); }
    public ReturnDtos.Response patch(Long id, ReturnDtos.PatchStatus r){
        var e = find(id);
        e.setStatus(ReturnStatus.valueOf(r.status()));
        // On approval – credit amount back to balance (idempotent)
        if ((e.getStatus()==ReturnStatus.APPROVED || e.getStatus()==ReturnStatus.REFUNDED || e.getStatus()==ReturnStatus.PROCESSED)
                && e.getAmount()!=null && e.getAmount().signum()>0){
            try {
                finance.creditReturnByRequest(e.getCustomerId(), e.getAmount(), e.getId());
            } catch (Exception ignored) {}
        }
        repo.save(e); return map(e);
    }
    public Page<ReturnDtos.Response> listByCustomer(Long customerId, Pageable p){
        Specification<ReturnRequest> spec = (root, cq, cb) -> cb.equal(root.get("customerId"), customerId);
        return repo.findAll(spec, p).map(this::map);
    }
    public Map<String,Object> process(Long id){
        var e = find(id);
        e.setStatus(ReturnStatus.PROCESSED);
        repo.save(e);
        return Map.of("processed", true, "id", e.getId());
    }
    public Map<String,Object> stats(){
        long total = repo.count();
        long open = repo.count((root, cq, cb) -> cb.equal(root.get("status"), ReturnStatus.NEW));
        return Map.of("total", total, "new", open);
    }
    private ReturnRequest find(Long id){ return repo.findById(id).orElseThrow(() -> new EntityNotFoundException("Return not found")); }
    private ReturnDtos.Response map(ReturnRequest e){
        return new ReturnDtos.Response(e.getId(), e.getOrderId(), e.getCustomerId(), e.getReason(),
                e.getStatus().name(), e.getCreatedAt(), e.getAmount());
    }
}
