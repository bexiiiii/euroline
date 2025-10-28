package autoparts.kz.common.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;

import java.time.Duration;

/**
 * 🚀 Конфигурация Rate Limiting для защиты от DDoS-атак и злоупотребления API.
 * 
 * Использует Bucket4j с Redis backend для распределенного rate limiting.
 * Это позволяет масштабировать приложение горизонтально без потери счетчиков.
 */
@Configuration
@RequiredArgsConstructor
public class RateLimitConfig {

    private final RedisConnectionFactory redisConnectionFactory;

    /**
     * Создает Rate Limit Bucket для общих API запросов.
     * Лимит: 1000 запросов в минуту на IP адрес.
     * 
     * Используется для защиты всех публичных эндпоинтов от массовых атак.
     */
    public static BucketConfiguration defaultBucketConfiguration() {
        return BucketConfiguration.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(1000) // Максимум токенов в bucket
                        .refillGreedy(1000, Duration.ofMinutes(1)) // Пополнение 1000 токенов каждую минуту
                        .build())
                .build();
    }

    /**
     * Создает Rate Limit Bucket для поисковых запросов.
     * Лимит: 100 запросов в минуту на IP адрес.
     * 
     * Поисковые запросы более ресурсоемкие, поэтому лимит ниже.
     */
    public static BucketConfiguration searchBucketConfiguration() {
        return BucketConfiguration.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(100) // Максимум токенов
                        .refillGreedy(100, Duration.ofMinutes(1)) // Пополнение каждую минуту
                        .build())
                .build();
    }

    /**
     * Создает Rate Limit Bucket для операций авторизации.
     * Лимит: 10 попыток входа в минуту на IP адрес.
     * 
     * Защита от brute-force атак на логин.
     */
    public static BucketConfiguration authBucketConfiguration() {
        return BucketConfiguration.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(10) // Только 10 попыток
                        .refillGreedy(10, Duration.ofMinutes(1)) // Пополнение каждую минуту
                        .build())
                .build();
    }

    /**
     * Создает Rate Limit Bucket для операций заказов.
     * Лимит: 20 заказов в час на пользователя.
     * 
     * Защита от создания спам-заказов.
     */
    public static BucketConfiguration orderBucketConfiguration() {
        return BucketConfiguration.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(20) // Максимум 20 заказов
                        .refillGreedy(20, Duration.ofHours(1)) // Пополнение каждый час
                        .build())
                .build();
    }
}
