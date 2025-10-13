package autoparts.kz.common.config;


import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.*;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class CacheConfig {

    // Константы для имен кешей
    public static final String CATEGORY_TREE_CACHE = "categoryTree";
    public static final String UNIT_DETAILS_CACHE = "unitDetails";
    public static final String CATEGORIES_CACHE = "categories";
    public static final String UNITS_CACHE = "units";
    public static final String CATALOGS_CACHE = "catalogs";
    public static final String CATALOG_INFO_CACHE = "catalogInfo";
    public static final String UNIT_INFO_CACHE = "unitInfo";
    public static final String IMAGE_MAP_CACHE = "imageMap";
    public static final String FILTER_BY_UNIT_CACHE = "filterByUnit";
    public static final String ADMIN_NOTIFICATION_HISTORY_CACHE = "adminNotificationHistory";
    public static final String ADMIN_ANALYTICS_SUMMARY_CACHE = "adminAnalyticsSummary";

    @Bean
    public RedisCacheManager redisCacheManager(RedisConnectionFactory cf) {
        // Настраиваем ObjectMapper
        ObjectMapper om = new ObjectMapper();
        om.registerModule(new JavaTimeModule());
        om.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        GenericJackson2JsonRedisSerializer jsonSer = new GenericJackson2JsonRedisSerializer(om);

        RedisSerializationContext.SerializationPair<Object> valueSer =
                RedisSerializationContext.SerializationPair.fromSerializer(jsonSer);

        // Базовая конфигурация кеша
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .serializeValuesWith(valueSer)
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .entryTtl(Duration.ofMinutes(30)) // TTL по умолчанию 30 минут
                .disableCachingNullValues();

        // Специфические настройки для разных кешей
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // Дерево категорий - кешируем на 1 час (структура меняется редко)
        cacheConfigurations.put(CATEGORY_TREE_CACHE, 
            defaultConfig.entryTtl(Duration.ofHours(1)));
        
        // Детали узлов - кешируем на 30 минут
        cacheConfigurations.put(UNIT_DETAILS_CACHE, 
            defaultConfig.entryTtl(Duration.ofMinutes(30)));
        
        // Список категорий - кешируем на 1 час
        cacheConfigurations.put(CATEGORIES_CACHE, 
            defaultConfig.entryTtl(Duration.ofHours(1)));
        
        // Список юнитов - кешируем на 1 час
        cacheConfigurations.put(UNITS_CACHE, 
            defaultConfig.entryTtl(Duration.ofHours(1)));
        
        // Каталоги - кешируем на 24 часа (практически статичные данные)
        cacheConfigurations.put(CATALOGS_CACHE, 
            defaultConfig.entryTtl(Duration.ofHours(24)));
        
        // Информация о каталоге - кешируем на 12 часов
        cacheConfigurations.put(CATALOG_INFO_CACHE, 
            defaultConfig.entryTtl(Duration.ofHours(12)));
        
        // Информация о юните - кешируем на 2 часа
        cacheConfigurations.put(UNIT_INFO_CACHE, 
            defaultConfig.entryTtl(Duration.ofHours(2)));
        
        // Карта изображений - кешируем на 6 часов (редко меняется)
        cacheConfigurations.put(IMAGE_MAP_CACHE, 
            defaultConfig.entryTtl(Duration.ofHours(6)));
        
        // Фильтры для юнита - кешируем на 1 час
        cacheConfigurations.put(FILTER_BY_UNIT_CACHE, 
            defaultConfig.entryTtl(Duration.ofHours(1)));

        // История админских уведомлений — короткий TTL, чтобы снизить конкуренцию
        cacheConfigurations.put(ADMIN_NOTIFICATION_HISTORY_CACHE,
            defaultConfig.entryTtl(Duration.ofMinutes(1)));

        // Сводная аналитика — кешируем на 1 минуту
        cacheConfigurations.put(ADMIN_ANALYTICS_SUMMARY_CACHE,
            defaultConfig.entryTtl(Duration.ofMinutes(1)));

        return RedisCacheManager.builder(cf)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }
}
