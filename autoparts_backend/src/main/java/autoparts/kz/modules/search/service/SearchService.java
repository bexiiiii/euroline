package autoparts.kz.modules.search.service;



import autoparts.kz.modules.stockOneC.service.AvailabilityService;
import autoparts.kz.modules.stockOneC.service.InventoryOnDemandRefresher;
import autoparts.kz.modules.stockOneC.service.ProductMappingService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final ProductMappingService mapper;
    private final InventoryOnDemandRefresher refresher;
    private final AvailabilityService availability;

    @Data
    public static class SearchResult {
        private String brand;
        private String oem;
        private String sku;
        private String name; // TODO: позже добавим из Laximo
        private AvailabilityService.SkuAvailability availability;
    }

    public SearchResult searchByBrandOem(String brand, String oem, String catalog) {
        String sku = mapper.skuByBrandOem(brand, oem);
        refresher.refreshSkus(List.of(sku));
        var av = availability.getBySku(sku);

        var res = new SearchResult();
        res.setBrand(brand); res.setOem(oem); res.setSku(sku);
        res.setAvailability(av);
        res.setName(null);
        return res;
    }
}
