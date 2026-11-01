package autoparts.kz.modules.mainSearch.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Гость (без входа) может сделать один поиск в сутки с одного IP, дальше — 429 и просьба войти.
 * Повторы того же запроса (выбор бренда, догрузка аналогов) лимит не тратят.
 * Запросы самого сервера (SSR витрины) не ограничиваются.
 */
@Slf4j
@Component
public class GuestSearchLimiter {

    public static final String LIMIT_CODE = "GUEST_SEARCH_LIMIT";

    private final StringRedisTemplate redis;
    private final int freeSearches;
    private final Duration window;
    private final Set<String> exemptIps;

    public GuestSearchLimiter(
            StringRedisTemplate redis,
            @Value("${guest-search.free-searches:1}") int freeSearches,
            @Value("${guest-search.window-hours:24}") long windowHours,
            @Value("${guest-search.exempt-ips:127.0.0.1,::1,0:0:0:0:0:0:0:1,94.131.95.220}") String exemptIps
    ) {
        this.redis = redis;
        this.freeSearches = freeSearches;
        this.window = Duration.ofHours(windowHours);
        this.exemptIps = Arrays.stream(exemptIps.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toSet());
    }

    /** @return false — лимит гостя исчерпан, нужно войти или зарегистрироваться. */
    public boolean allowGuest(HttpServletRequest request, String query) {
        String ip = clientIp(request);
        if (ip == null || isExempt(ip)) {
            return true;
        }
        String normalized = query == null ? "" : query.trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", " ");
        String key = "guest_search:" + ip;
        try {
            if (Boolean.TRUE.equals(redis.opsForSet().isMember(key, normalized))) {
                return true; // тот же запрос: смена бренда, аналоги, обновление страницы
            }
            Long used = redis.opsForSet().size(key);
            if (used != null && used >= freeSearches) {
                return false;
            }
            redis.opsForSet().add(key, normalized);
            redis.expire(key, window);
        } catch (Exception e) {
            // Redis недоступен — поиск важнее лимита
            log.warn("Guest search limiter unavailable: {}", e.getMessage());
        }
        return true;
    }

    public org.springframework.http.ResponseEntity<java.util.Map<String, String>> limitResponse() {
        return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS)
                .body(java.util.Map.of(
                        "code", LIMIT_CODE,
                        "message", "Бесплатный поиск без входа уже использован. Войдите или зарегистрируйтесь, чтобы продолжить."));
    }

    // nginx перезаписывает X-Real-IP адресом клиента; X-Forwarded-For клиент может подделать.
    static String clientIp(HttpServletRequest request) {
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    private boolean isExempt(String ip) {
        return exemptIps.contains(ip) || ip.startsWith("10.") || ip.startsWith("192.168.")
                || ip.matches("^172\\.(1[6-9]|2\\d|3[01])\\..*");
    }
}
