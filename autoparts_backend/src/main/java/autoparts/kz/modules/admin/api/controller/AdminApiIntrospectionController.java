package autoparts.kz.modules.admin.api.controller;


import autoparts.kz.modules.admin.api.entity.ApiEndpointMeta;
import autoparts.kz.modules.admin.api.repository.ApiEndpointMetaRepository;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.*;

@RestController
@RequestMapping("/api/admin/api")
public class AdminApiIntrospectionController {

    private final RequestMappingHandlerMapping mapping;
    private final ApiEndpointMetaRepository metaRepo;
    private final MeterRegistry metrics;

    public AdminApiIntrospectionController(
            @Qualifier("requestMappingHandlerMapping") RequestMappingHandlerMapping mapping,
            ApiEndpointMetaRepository metaRepo,
            MeterRegistry metrics
    ) {
        this.mapping = mapping;
        this.metaRepo = metaRepo;
        this.metrics = metrics;
    }

    // Фактический список эндпоинтов приложения
    @GetMapping("/endpoints")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String,String>> endpoints() {
        List<Map<String,String>> res = new ArrayList<>();
        for (Map.Entry<RequestMappingInfo, HandlerMethod> e : mapping.getHandlerMethods().entrySet()) {
            var info = e.getKey();
            var patterns = info.getPathPatternsCondition()==null? Set.<String>of() : info.getPathPatternsCondition().getPatternValues();
            var methods = info.getMethodsCondition().isEmpty()? Set.of("GET","POST","PUT","PATCH","DELETE") : info.getMethodsCondition().getMethods().stream().map(Enum::name).collect(java.util.stream.Collectors.toSet());
            for (String p : patterns) for (String m : methods) {
                res.add(Map.of("method", m, "path", p));
            }
        }
        res.sort(Comparator.comparing(a->a.get("path")));
        return res;
    }

    // CRUD «описаний»
    @PostMapping("/endpoints")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiEndpointMeta create(@RequestBody ApiEndpointMeta m){ return metaRepo.save(m); }

    @PutMapping("/endpoints/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiEndpointMeta update(@PathVariable Long id, @RequestBody ApiEndpointMeta m){
        m.setId(id); return metaRepo.save(m);
    }

    // Статистика API (на основе Micrometer)
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> stats() {
        var timers = metrics.find("http.server.requests").timers();
        List<Map<String,Object>> items = new ArrayList<>();
        for (var t: timers) {
            var uri = t.getId().getTag("uri");
            var method = t.getId().getTag("method");
            if (uri==null || method==null) continue;
            items.add(Map.of(
                    "method", method,
                    "uri", uri,
                    "count", t.count(),
                    "meanMs", t.mean(java.util.concurrent.TimeUnit.MILLISECONDS),
                    "p95Ms", t.percentile(0.95, java.util.concurrent.TimeUnit.MILLISECONDS)
            ));
        }
        return Map.of("httpRequests", items);
    }
}
