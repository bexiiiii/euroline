package autoparts.kz.modules.stockOneC.service;



import autoparts.kz.modules.stockOneC.entity.Stock;
import autoparts.kz.modules.stockOneC.repository.StockRepo;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final StockRepo stockRepo;

    @Data
    public static class SkuAvailability {
        private String sku;
        private int total;
        private List<Row> warehouses = new ArrayList<>();
        @Data public static class Row { public String warehouseCode; public int available; public String address; }
    }

    // @Cacheable(cacheNames = "availability", key = "#sku")
    public SkuAvailability getBySku(String sku) {
        List<Stock> list = stockRepo.findBySku(sku);
        SkuAvailability a = new SkuAvailability();
        a.setSku(sku);
        int total = 0;
        for (Stock s : list){
            var r = new SkuAvailability.Row();
            r.warehouseCode = s.getWarehouse().getCode();
            r.available = s.getAvailableQty();
            r.address = s.getWarehouse().getAddress();
            a.getWarehouses().add(r);
            total += s.getAvailableQty();
        }
        a.setTotal(total);
        return a;
    }
}