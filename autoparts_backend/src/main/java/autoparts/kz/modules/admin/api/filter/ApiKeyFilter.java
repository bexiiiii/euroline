package autoparts.kz.modules.admin.api.filter;

import autoparts.kz.modules.admin.api.entity.ApiKey;
import autoparts.kz.modules.admin.api.service.ApiKeyService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ApiKeyFilter extends OncePerRequestFilter {

    private final ApiKeyService apiKeyService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        if (!uri.startsWith("/api/external/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String presentedKey = request.getHeader("X-App-Key");
        if (presentedKey == null || presentedKey.isBlank()) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "API key is required");
            return;
        }

        Optional<ApiKey> apiKeyOptional = apiKeyService.authenticate(presentedKey);
        if (apiKeyOptional.isEmpty()) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid API key");
            return;
        }

        ApiKey apiKey = apiKeyOptional.get();
        int status = HttpServletResponse.SC_OK;
        try {
            filterChain.doFilter(request, response);
            status = response.getStatus();
        } catch (Exception ex) {
            status = HttpServletResponse.SC_INTERNAL_SERVER_ERROR;
            apiKeyService.recordUsage(apiKey, uri, request.getMethod(), status, resolveClientIp(request));
            throw ex;
        }

        apiKeyService.recordUsage(apiKey, uri, request.getMethod(), status, resolveClientIp(request));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isBlank()) {
            return ip.split(",")[0].trim();
        }
        ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isBlank()) {
            return ip;
        }
        return request.getRemoteAddr();
    }
}
