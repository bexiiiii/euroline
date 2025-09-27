package autoparts.kz.modules.cart.dto;

import lombok.Data;

@Data
public class AddByOemRequest {
    private String oem;       // артикул/код детали (обязателен)
    private String name;      // название (если известно)
    private String brand;     // бренд (если известен)
    private Integer price;    // цена (если известна)
    private String imageUrl;  // изображение (опционально)
    private int quantity;     // количество
}

