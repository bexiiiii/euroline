package autoparts.kz.modules.stockOneC.dto;


import autoparts.kz.modules.mainSearch.dto.SearchResponse;
import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class StockBulkResponse {

    private List<Item> items = new ArrayList<>();

    @Data
    public static class Item {
        private String oem;
        private BigDecimal price;
        private String currency;
        private Integer totalQty;
        private List<Warehouse> warehouses = new ArrayList<>();
    }

    @Data
    public static class Warehouse {
        private String code;
        private String name;
        private String address;
        private Integer qty;
    }

    /** Удобный доступ к item по OEM */
    public Item getByOem(String oem) {
        if (oem == null) return null;
        for (Item it : items) {
            if (oem.equalsIgnoreCase(it.getOem())) return it;
        }
        return null;
    }

    /** Преобразование склада из 1С к DTO поиска */
    public static List<SearchResponse.Warehouse> toWarehouses(Item it) {
        if (it == null || it.getWarehouses() == null) return List.of();
        List<SearchResponse.Warehouse> out = new ArrayList<>();
        for (Warehouse w : it.getWarehouses()) {
            SearchResponse.Warehouse ww = new SearchResponse.Warehouse();
            ww.setCode(w.getCode());
            ww.setName(w.getName());
            ww.setAddress(w.getAddress());
            ww.setQty(w.getQty());
            out.add(ww);
        }
        return out;
    }
}
