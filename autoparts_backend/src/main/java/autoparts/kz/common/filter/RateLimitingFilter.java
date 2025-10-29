package autoparts.kz.common.filter;

import autoparts.kz.common.config.RateLimitConfig;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * 🚀 Rate Limiting Filter для защиты от DDoS-атак и злоупотребления API.
 * 
 * Использует алгоритм Token Bucket для ограничения количества запросов:
 * - Общий лимит: 1000 req/min для всех эндпоинтов
 * - Поиск: 100 req/min для /api/products/search
 * - Авторизация: 10 req/min для /api/auth/login
 * - Заказы: 20 req/hour для /api/orders
 * 
 * Когда лимит исчерпан, возвращает HTTP 429 Too Many Requests с заголовками:
 * - X-Rate-Limit-Retry-After-Seconds: через сколько секунд можно повторить запрос
 * - X-Rate-Limit-Remaining: сколько токенов осталось
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    private final LettuceBasedProxyManager<String> proxyManager;

    public RateLimitingFilter(
            @Value("${spring.data.redis.host:localhost}") String redisHost,
            @Value("${spring.data.redis.port:6379}") int redisPort,
            @Value("${spring.data.redis.password:}") String redisPassword
    ) {
        // Подключаемся к Redis для распределенного rate limiting
        RedisURI.Builder uriBuilder = RedisURI.builder()
                .withHost(redisHost)
                .withPort(redisPort);
        
        // Добавляем пароль, если он указан
        if (redisPassword != null && !redisPassword.isEmpty()) {
            uriBuilder.withPassword(redisPassword.toCharArray());
        }
        
        RedisClient redisClient = RedisClient.create(uriBuilder.build());
        
        StatefulRedisConnection<String, byte[]> connection = redisClient.connect(
                RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE)
        );

        this.proxyManager = LettuceBasedProxyManager.builderFor(connection)
                .build();
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        
        String requestURI = request.getRequestURI();
        String clientIp = getClientIP(request);
        
        // Выбираем конфигурацию bucket в зависимости от эндпоинта
        BucketConfiguration bucketConfig;
        String bucketKey;
        
        if (requestURI.contains("/api/products/search")) {
            // Поисковые запросы: 100 req/min
            bucketConfig = RateLimitConfig.searchBucketConfiguration();
            bucketKey = "rate_limit:search:" + clientIp;
            log.debug("🔍 Rate limiting search request from IP: {}", clientIp);
        } else if (requestURI.contains("/api/auth/login")) {
            // Авторизация: 10 req/min
            bucketConfig = RateLimitConfig.authBucketConfiguration();
            bucketKey = "rate_limit:auth:" + clientIp;
            log.debug("🔐 Rate limiting auth request from IP: {}", clientIp);
        } else if (requestURI.contains("/api/orders") && "POST".equals(request.getMethod())) {
            // Создание заказов: 20 req/hour
            bucketConfig = RateLimitConfig.orderBucketConfiguration();
            bucketKey = "rate_limit:orders:" + clientIp;
            log.debug("🛒 Rate limiting order creation from IP: {}", clientIp);
        } else {
            // Общий лимит для остальных эндпоинтов: 1000 req/min
            bucketConfig = RateLimitConfig.defaultBucketConfiguration();
            bucketKey = "rate_limit:default:" + clientIp;
        }
        
        // Получаем или создаем bucket для данного IP
        Bucket bucket = proxyManager.builder()
                .build(bucketKey, () -> bucketConfig);
        
        // Пытаемся "съесть" 1 токен
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        
        if (probe.isConsumed()) {
            // ✅ Токен получен, запрос разрешен
            
            // Добавляем заголовки с информацией о rate limiting
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            
            // Продолжаем обработку запроса
            filterChain.doFilter(request, response);
        } else {
            // ❌ Лимит исчерпан, возвращаем 429 Too Many Requests
            
            long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000;
            
            log.warn("⛔ Rate limit exceeded for IP: {} on endpoint: {}. Retry after {} seconds", 
                    clientIp, requestURI, waitForRefill);
            
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(waitForRefill));
            response.setHeader("X-Rate-Limit-Remaining", "0");
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            
            String errorMessage = String.format(
                    "{\"error\":\"Rate limit exceeded\",\"message\":\"Too many requests. Please retry after %d seconds.\",\"retryAfter\":%d}",
                    waitForRefill, waitForRefill
            );
            
            response.getWriter().write(errorMessage);
        }
    }

    /**
     * Получает реальный IP адрес клиента, учитывая прокси и load balancer.
     * Проверяет заголовки X-Forwarded-For и X-Real-IP.
     */
    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            // Берем первый IP из списка (реальный клиент)
            return xfHeader.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        // Fallback: берем IP из запроса
        return request.getRemoteAddr();
    }
}
