package autoparts.kz.modules.stockOneC.service;

import org.springframework.stereotype.Service;

@Service
public class ProductMappingService {
    public String skuByBrandOem(String brand, String oem) {
        if (brand==null || oem==null) return null;
        return brand.trim().toUpperCase() + ":" + oem.trim().toUpperCase();
    }
}