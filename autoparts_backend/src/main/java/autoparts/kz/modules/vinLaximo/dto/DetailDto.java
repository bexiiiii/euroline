package autoparts.kz.modules.vinLaximo.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Data
@JsonInclude(JsonInclude.Include.ALWAYS)
public class DetailDto {
    private long detailId;
    private String oem;
    private String name;
    private Integer qty;       // количество на авто (если отдает CAT)
    private String applicability; // текст применимости/фильтра (если есть)

    // новые поля для витрины поиска
    private String brand;
    private String catalog;
    
    // ========= ПОЛНЫЙ НАБОР АТРИБУТОВ =========
    
    // Изображения и схемы
    private String imageUrl;          // URL изображения детали (imageurl/largeimageurl от Unit)
    private String largeImageUrl;     // Большое изображение
    private String codeOnImage;       // Номер на схеме (codeonimage)
    private List<String> images;      // Список дополнительных изображений
    
    // Описания и заметки
    private String note;              // Основная заметка (addnote)
    private String additionalNote;    // Дополнительные заметки 
    private String footnote;          // Сноски
    private String description;       // Подробное описание
    private String componentCode;     // Код компонента (componentcode)
    
    // OEM и заменяемые номера
    private String replacedOem;       // Заменяемые OEM номера (replacedoem)
    private List<String> alternativeOems; // Альтернативные OEM
    
    // Технические характеристики
    private String price;             // Цена (если доступна)
    private String weight;            // Вес детали
    private String dimensions;        // Размеры
    private String match;             // Тип соответствия (match="t")
    
    // Контекстная информация от Unit
    private String unitName;          // Название узла
    private String unitCode;          // Код узла
    private Long unitId;              // ID узла
    private String unitSsd;           // SSD узла
    
    // Контекстная информация от Category
    private String categoryName;      // Название категории
    private Long categoryId;          // ID категории
    private String categoryCode;      // Код категории
    private String categorySsd;       // SSD категории
    
    // Атрибуты общего назначения
    private Map<String, String> allAttributes; // Все атрибуты в виде key-value
    private String rawXml;            // Сырой XML элемента для дебага
}
