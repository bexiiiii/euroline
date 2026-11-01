package autoparts.kz.modules.mainSearch.service;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class GuestSearchLimiterTest {
    final Set<String> stored = new HashSet<>();
    GuestSearchLimiter limiter;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        SetOperations<String, String> ops = mock(SetOperations.class);
        when(redis.opsForSet()).thenReturn(ops);
        when(ops.isMember(anyString(), anyString())).thenAnswer(i -> stored.contains((String) i.getArgument(1)));
        when(ops.size(anyString())).thenAnswer(i -> (long) stored.size());
        when(ops.add(anyString(), any())).thenAnswer(i -> {
            for (int a = 1; a < i.getArguments().length; a++) {
                Object v = i.getArguments()[a];
                if (v instanceof String[] arr) stored.addAll(java.util.List.of(arr)); else stored.add((String) v);
            }
            return 1L;
        });
        limiter = new GuestSearchLimiter(redis, 1, 24, "127.0.0.1");
    }

    private HttpServletRequest from(String ip) {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Real-IP")).thenReturn(ip);
        return request;
    }

    @Test void firstSearchAndItsRepeatsAreFreeSecondQueryIsBlocked() {
        assertTrue(limiter.allowGuest(from("5.5.5.5"), "WABCO 4410329212"));
        assertTrue(limiter.allowGuest(from("5.5.5.5"), "wabco  4410329212"));
        assertFalse(limiter.allowGuest(from("5.5.5.5"), "20424109"));
    }

    @Test void serverAndPrivateAddressesAreNotLimited() {
        assertTrue(limiter.allowGuest(from("127.0.0.1"), "a1"));
        assertTrue(limiter.allowGuest(from("172.18.0.5"), "a2"));
        assertTrue(limiter.allowGuest(from("172.18.0.5"), "a3"));
    }
}
