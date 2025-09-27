package autoparts.kz.modules.returns.controller;


import autoparts.kz.modules.returns.dto.ReturnDtos;
import autoparts.kz.modules.returns.service.ReturnService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/returns")
@RequiredArgsConstructor
public class ReturnController {
    private final ReturnService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<ReturnDtos.Response> list(@RequestParam(required = false) String status,
                                          @RequestParam(defaultValue="0") int page,
                                          @RequestParam(defaultValue="20") int size){
        return service.list(status, PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }
    @PostMapping public ReturnDtos.Response create(@RequestBody ReturnDtos.Create r){ return service.create(r); }
    @GetMapping("/{id}") public ReturnDtos.Response get(@PathVariable Long id){ return service.get(id); }
    @PatchMapping("/{id}/status") @PreAuthorize("hasRole('ADMIN')")
    public ReturnDtos.Response patch(@PathVariable Long id, @RequestBody ReturnDtos.PatchStatus r){ return service.patch(id, r); }
    @PostMapping("/{id}/process") @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> process(@PathVariable Long id){ return service.process(id); }
    @GetMapping("/stats") @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> stats(){ return service.stats(); }

    // My returns for authenticated user
    @GetMapping("/my")
    public Page<ReturnDtos.Response> myReturns(@org.springframework.security.core.annotation.AuthenticationPrincipal autoparts.kz.common.security.SimplePrincipal principal,
                                               @RequestParam(defaultValue="0") int page,
                                               @RequestParam(defaultValue="20") int size){
        return service.listByCustomer(principal.id(), PageRequest.of(page,size, Sort.by("createdAt").descending()));
    }
}
