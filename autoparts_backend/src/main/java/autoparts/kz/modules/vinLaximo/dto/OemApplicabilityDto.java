package autoparts.kz.modules.vinLaximo.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@lombok.Data
public class OemApplicabilityDto {
    @lombok.Data
    public static class Category {
        private long categoryId;
        private String name;
        private String ssd;
        private List<Unit> units = new ArrayList<>();
    }
    @lombok.Data
    public static class Unit {
        private long unitId;
        private String code;
        private String name;
        private String imageUrl;
        private List<Detail> details = new ArrayList<>();
    }
    @lombok.Data
    public static class Detail {
        private String oem;
        private String name;
        private String codeOnImage;
        private Map<String,String> attrs; // amount, replacedoem и т.д.
    }
    private List<Category> categories = new ArrayList<>();
}