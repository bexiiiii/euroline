package autoparts.kz.modules.admin.api.filter;

import autoparts.kz.modules.admin.api.service.ApiKeyService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ApiKeyFilter extends OncePerRequestFilter {
    @Autowired
    ApiKeyService keys;
    @Override protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws IOException, ServletException {
        String key = req.getHeader("X-API-Key");
        if (req.getRequestURI().startsWith("/api/external/")) {
            if (key==null || !keys.verify(key)) { res.sendError(401, "Invalid API key"); return; }
        }
        chain.doFilter(req, res);
    }
}