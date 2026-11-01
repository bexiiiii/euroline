package autoparts.kz.modules.admin.catalogimport.service;

import java.util.Locale;

/** Раздел PDF-каталога (боковой заголовок страницы, TR/EN) → предлагаемое название категории сайта. */
public final class CatalogSections {

    private CatalogSections() {}

    public static String suggest(String section) {
        if (section == null || section.isBlank()) return "Прочее";
        String s = section.toUpperCase(Locale.forLanguageTag("tr"));
        if (s.contains("WORK LAMP") || s.contains("ÇALIŞMA LAMBA")) return "Фары рабочего света";
        if (s.contains("LED SYSTEM") || s.contains("LED SİSTEMLİ")) return "Светодиодные фонари";
        if (s.contains("TRACTOR") || s.contains("TRAKTÖR")) return "Освещение тракторов и кабин";
        if (s.contains("EARTH MOVER") || s.contains("İŞ MAKİNA") || s.contains("FORKLIFT")) {
            return "Освещение спецтехники и погрузчиков";
        }
        if (s.contains("TRUCK") || s.contains("KAMYON") || s.contains("TRAILER")) {
            return "Фонари для грузовиков и прицепов";
        }
        // неизвестный раздел: английская часть заголовка ("... / LED SYSTEM LIGHTS")
        String[] parts = section.split(" / | - ");
        String en = parts[parts.length - 1].trim();
        if (en.isEmpty()) en = section.trim();
        String lower = en.toLowerCase(Locale.ROOT);
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}
