package autoparts.kz.common.security;

import autoparts.kz.common.constants.SecurityConstants;
import autoparts.kz.modules.auth.service.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;
    private final AuthService authService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getServletPath();
        
        // Пропустить login и signup без токена
        if (isPublicEndpoint(path)) {
            log.debug("JWT Filter: пропускаем аутентификацию для публичного эндпоинта: {}", path);
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader(SecurityConstants.AUTHORIZATION_HEADER);
        
        if (!isValidAuthHeader(authHeader)) {
            log.debug("JWT Filter: отсутствует или неверный Authorization header для {}", path);
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(SecurityConstants.BEARER_PREFIX_LENGTH).trim();
            
            if (!isValidJwtFormat(jwt)) {
                log.warn("JWT Filter: токен имеет неверный формат");
                filterChain.doFilter(request, response);
                return;
            }
                
            final String username = jwtUtils.extractUsername(jwt);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                authenticateUser(request, jwt, username);
            }
        } catch (Exception e) {
            log.error("JWT Filter: ошибка при обработке токена: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
    
    private boolean isPublicEndpoint(String path) {
        return path.equals("/api/auth/login") 
            || path.equals("/api/auth/signup")
            || path.startsWith("/swagger-ui/")
            || path.startsWith("/v3/api-docs/")
            || path.startsWith("/actuator/health")
            || path.startsWith("/actuator/info");
    }
    
    private boolean isValidAuthHeader(String authHeader) {
        return authHeader != null 
            && authHeader.startsWith(SecurityConstants.BEARER_PREFIX) 
            && authHeader.length() > SecurityConstants.BEARER_PREFIX_LENGTH;
    }
    
    private boolean isValidJwtFormat(String jwt) {
        return !jwt.isEmpty() && jwt.split("\\.").length == SecurityConstants.JWT_PARTS_COUNT;
    }
    
    private void authenticateUser(HttpServletRequest request, String jwt, String username) {
        try {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
            
            if (jwtUtils.isTokenValid(jwt, userDetails)) {
                var domainUser = authService.findByEmail(username).orElse(null);
                Object principal = domainUser != null 
                    ? new SimplePrincipal(domainUser.getId(), username) 
                    : userDetails;
                    
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(principal, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                
                log.debug("JWT Filter: аутентификация успешно установлена для {}", username);
            } else {
                log.warn("JWT Filter: токен невалиден для пользователя: {}", username);
            }
        } catch (Exception e) {
            log.error("JWT Filter: ошибка аутентификации для пользователя {}: {}", username, e.getMessage());
        }
    }
}
