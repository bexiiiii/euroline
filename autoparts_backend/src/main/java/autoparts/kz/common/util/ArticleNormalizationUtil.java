package autoparts.kz.common.util;

/**
 * Утилита для нормализации артикулов запчастей
 * Используется для унификации поиска по артикулам из разных источников (UMAPI, 1C, Laximo)
 */
public class ArticleNormalizationUtil {

    /**
     * Нормализует артикул для поиска
     * - Убирает пробелы
     * - Убирает дефисы
     * - Убирает точки
     * - Убирает слэши
     * - Приводит к верхнему регистру
     * 
     * @param article исходный артикул
     * @return нормализованный артикул
     */
    public static String normalize(String article) {
        if (article == null || article.trim().isEmpty()) {
            return "";
        }
        
        return article.trim()
                .replaceAll("[\\s\\-\\.\\/]", "") // убираем пробелы, дефисы, точки, слэши
                .toUpperCase(); // uppercase
    }

    /**
     * Проверяет соответствие двух артикулов после нормализации
     * 
     * @param article1 первый артикул
     * @param article2 второй артикул
     * @return true если артикулы идентичны после нормализации
     */
    public static boolean matches(String article1, String article2) {
        if (article1 == null || article2 == null) {
            return false;
        }
        
        String normalized1 = normalize(article1);
        String normalized2 = normalize(article2);
        
        return normalized1.equals(normalized2);
    }

    /**
     * Форматирует артикул для отображения (оставляет оригинальный формат)
     * 
     * @param article исходный артикул
     * @return отформатированный артикул
     */
    public static String formatForDisplay(String article) {
        if (article == null || article.trim().isEmpty()) {
            return "";
        }
        
        return article.trim().toUpperCase();
    }
}
