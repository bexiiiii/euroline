package autoparts.kz.modules.vinLaximo.service;


import autoparts.kz.common.config.CacheConfig;
import autoparts.kz.modules.vinLaximo.XmlParser.CatXmlParser;
import autoparts.kz.modules.vinLaximo.client.LaximoSoapClient;
import autoparts.kz.modules.vinLaximo.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
@Slf4j
public class CatService {

    private final LaximoSoapClient soap;
    private final String locale;

    public CatService(LaximoSoapClient soap, @Value("${laximo.cat.locale}") String locale) {
        this.soap = soap; this.locale = locale;
    }

    // ---- Catalogs ----
    @Cacheable(cacheNames = CacheConfig.CATALOGS_CACHE, key = "'all'")
    public List<CatalogDto> listCatalogs(){
        try {
            String cmd = "ListCatalogs:Locale=" + locale;
            return CatXmlParser.parseListCatalogs(soap.execCommands(List.of(cmd)));
        } catch (Exception e) {
            // Если не удалось получить каталоги, возвращаем пустой список
            return Collections.emptyList();
        }
    }

    @Cacheable(cacheNames = CacheConfig.CATALOG_INFO_CACHE, key = "#catalog")
    public CatalogInfoDto getCatalogInfo(String catalog){
        try {
            String cmd = "GetCatalogInfo:Locale=" + locale + "|Catalog=" + catalog;
            return CatXmlParser.parseGetCatalogInfo(soap.execCommands(List.of(cmd)));
        } catch (Exception e) {
            // Если не удалось получить информацию о каталоге, возвращаем базовую информацию
            CatalogInfoDto fallback = new CatalogInfoDto();
            fallback.setCode(catalog);
            fallback.setName(catalog);
            fallback.setAttributes(Collections.emptyMap());
            return fallback;
        }
    }

    // ---- Vehicle search ----
    @Cacheable(cacheNames = CacheConfig.VEHICLE_BY_VIN_CACHE, key = "#vin + '::' + (#catalog == null ? 'ALL' : #catalog)")
    public VehicleDto findByVin(String vin, String catalog) {
        String cmd = "FindVehicleByVIN:Locale=" + locale +
                (catalog != null && !catalog.isBlank() ? "|Catalog=" + catalog : "") +
                "|VIN=" + vin + "|Localized=true";
        return CatXmlParser.parseFindVehicleByVin(soap.execCommands(List.of(cmd)));
    }

    @Cacheable(cacheNames = CacheConfig.VEHICLE_BY_FRAME_CACHE, key = "#frame + '::' + #frameNo + '::' + (#catalog == null ? 'ALL' : #catalog)")
    public VehicleDto findByFrame(String frame, String frameNo, String catalog) {
        String cmd = "FindVehicleByFrame:Locale=" + locale +
                (catalog != null && !catalog.isBlank() ? "|Catalog=" + catalog : "") +
                "|Frame=" + frame + "|FrameNo=" + frameNo + "|Localized=true";
        return CatXmlParser.parseFindVehicleByFrame(soap.execCommands(List.of(cmd)));
    }

    @Cacheable(cacheNames = CacheConfig.VEHICLE_BY_PLATE_CACHE, key = "#plate")
    public VehicleDto findByPlateNumber(String plate) {
        String cmd = "FindVehicleByPlateNumber:Locale=" + locale + "|PlateNumber=" + plate + "|Localized=true";
        return CatXmlParser.parseFindVehicleByPlateNumber(soap.execCommands(List.of(cmd)));
    }

    // ---- Wizard (GetWizard2 / Next / Finish) ----
    @Cacheable(cacheNames = CacheConfig.WIZARD_START_CACHE, key = "#catalog")
    public WizardStepDto wizardStart(String catalog){
        try {
            String cmd = "GetWizard2:Locale=" + locale + "|Catalog=" + catalog + "|Localized=true";
            return CatXmlParser.parseWizardStep(soap.execCommands(List.of(cmd)), "GetWizard2");
        } catch (Exception e) {
            // Если не удалось получить мастер, возвращаем пустой шаг
            WizardStepDto fallback = new WizardStepDto();
            fallback.setSsd("");
            fallback.setParams(Collections.emptyList());
            fallback.setFinalStep(true);
            return fallback;
        }
    }

    // Overload supporting VIN and custom locale (if provided)
    @Cacheable(cacheNames = CacheConfig.WIZARD_START_CACHE, key = "#catalog + '::' + (#vin == null ? 'NO_VIN' : #vin) + '::' + (#overrideLocale == null ? 'DEFAULT' : #overrideLocale)")
    public WizardStepDto wizardStart(String catalog, String vin, String overrideLocale){
        String useLocale = (overrideLocale != null && !overrideLocale.isBlank()) ? overrideLocale : this.locale;
        try {
            StringBuilder sb = new StringBuilder("GetWizard2:Locale=").append(useLocale)
                    .append("|Catalog=").append(catalog).append("|Localized=true");
            if (vin != null && !vin.isBlank()) sb.append("|VIN=").append(vin);
            return CatXmlParser.parseWizardStep(soap.execCommands(List.of(sb.toString())), "GetWizard2");
        } catch (Exception e) {
            WizardStepDto fallback = new WizardStepDto();
            fallback.setSsd("");
            fallback.setParams(Collections.emptyList());
            fallback.setFinalStep(true);
            return fallback;
        }
    }

    public WizardStepDto wizardNext(String catalog, String ssd, Map<String,String> selections){
        try {
            StringBuilder sb = new StringBuilder("GetWizardNextStep2:Locale=").append(locale)
                    .append("|Catalog=").append(catalog).append("|Localized=true");
            if (ssd != null && !ssd.isBlank()) {
                sb.append("|ssd=").append(ssd);
            }
            selections.forEach((k,v)-> sb.append("|").append(k).append("=").append(v));
            return CatXmlParser.parseWizardStep(soap.execCommands(List.of(sb.toString())), "GetWizardNextStep2");
        } catch (Exception e) {
            // Если не удалось получить следующий шаг, возвращаем финальный шаг
            WizardStepDto fallback = new WizardStepDto();
            fallback.setSsd(ssd);
            fallback.setParams(Collections.emptyList());
            fallback.setFinalStep(true);
            return fallback;
        }
    }

    // Overload accepting explicit single selection key/value and custom locale
    public WizardStepDto wizardNext(String catalog, String ssd, String selKey, String selValue, String overrideLocale){
        String useLocale = (overrideLocale != null && !overrideLocale.isBlank()) ? overrideLocale : this.locale;
        try {
            if (selKey == null || selKey.isBlank()) {
                throw new IllegalArgumentException("Selection key is required");
            }
            StringBuilder sb = new StringBuilder("GetWizardNextStep2:Locale=").append(useLocale)
                    .append("|Catalog=").append(catalog).append("|Localized=true");
            if (ssd != null && !ssd.isBlank()) sb.append("|ssd=").append(ssd);
            sb.append("|").append(selKey).append("=").append(selValue == null ? "" : selValue);
            return CatXmlParser.parseWizardStep(soap.execCommands(List.of(sb.toString())), "GetWizardNextStep2");
        } catch (Exception e) {
            WizardStepDto fallback = new WizardStepDto();
            fallback.setSsd(ssd);
            fallback.setParams(Collections.emptyList());
            fallback.setFinalStep(true);
            return fallback;
        }
    }

    public VehicleDto wizardFinish(String catalog, String ssd, Map<String,String> selections){
        try {
            if (ssd == null || ssd.isBlank()) {
                throw new IllegalArgumentException("Parameter 'ssd' is required for wizard finish");
            }
            StringBuilder sb = new StringBuilder("FindVehicleByWizard2:Locale=").append(locale)
                    .append("|Catalog=").append(catalog).append("|ssd=").append(ssd).append("|Localized=true");
            selections.forEach((k,v)-> sb.append("|").append(k).append("=").append(v));
            return CatXmlParser.parseFindVehicleByWizard2(soap.execCommands(List.of(sb.toString())));
        } catch (Exception e) {
            // Если завершение мастера не удалось, выбрасываем исключение
            throw new RuntimeException("Не удалось завершить подбор автомобиля через мастер: " + e.getMessage(), e);
        }
    }

    // Overload without selections and with optional locale override
    public VehicleDto wizardFinish(String catalog, String ssd, String overrideLocale){
        if (ssd == null || ssd.isBlank()) {
            throw new IllegalArgumentException("Parameter 'ssd' is required for wizard finish");
        }
        String useLocale = (overrideLocale != null && !overrideLocale.isBlank()) ? overrideLocale : this.locale;
        StringBuilder sb = new StringBuilder("FindVehicleByWizard2:Locale=").append(useLocale)
                .append("|Catalog=").append(catalog).append("|ssd=").append(ssd).append("|Localized=true");
        return CatXmlParser.parseFindVehicleByWizard2(soap.execCommands(List.of(sb.toString())));
    }

    // Валидация SSD параметра для Laximo
    private String validateSsd(String ssd) {
        if (ssd == null || ssd.trim().isEmpty()) {
            // Только если SSD пустой, используем базовый fallback
            return "0306043004010302"; // Базовый SSD
        }
        
        // Если SSD начинается с $ или содержит base64 символы, это реальный SSD от Laximo
        if (ssd.startsWith("$") || ssd.contains("=") || ssd.contains("+") || ssd.contains("/")) {
            // Это настоящий SSD от Laximo API, не трогаем его
            return ssd;
        }
        
        // Для простых hex строк применяем старую логику
        String cleaned = ssd.replaceAll("[^0-9A-Fa-f]", "").toUpperCase();
        
        // Laximo API обычно принимает SSD длиной до 16-32 символов
        if (cleaned.length() > 32) {
            cleaned = cleaned.substring(0, 32);
        }
        
        // Если слишком короткий, используем базовый
        if (cleaned.length() < 8) {
            return "0306043004010302";
        }
        
        return cleaned;
    }

    // ---- Categories / Units / UnitInfo / Details / ImageMap / Filters ----
    @Cacheable(cacheNames = CacheConfig.CATEGORIES_CACHE, key = "#catalog + '::' + #vehicleId + '::' + #ssd")
    public List<CategoryDto> listCategories(String catalog, String vehicleId, String ssd) {
        ssd = validateSsd(ssd); // Валидируем SSD
        String cmd = "ListCategories:Locale=" + locale +
                "|Catalog=" + catalog + "|VehicleId=" + vehicleId + "|ssd=" + ssd;
        return CatXmlParser.parseListCategories(soap.execCommands(List.of(cmd)));
    }

    @Cacheable(cacheNames = CacheConfig.UNITS_CACHE, key = "#catalog + '::' + #vehicleId + '::' + #ssd + '::' + #categoryId")
    public List<UnitDto> listUnits(String catalog, String vehicleId, String ssd, long categoryId) {
        String cmd = "ListUnits:Locale=" + locale +
                "|Catalog=" + catalog + "|VehicleId=" + vehicleId + "|ssd=" + ssd +
                "|CategoryId=" + categoryId;
        return CatXmlParser.parseListUnits(soap.execCommands(List.of(cmd)));
    }

    @Cacheable(cacheNames = CacheConfig.UNIT_INFO_CACHE, key = "#catalog + '::' + #ssd + '::' + #unitId")
    public UnitInfoDto getUnitInfo(String catalog, long unitId, String ssd) {
        String cmd = "GetUnitInfo:Locale=" + locale + "|Catalog=" + catalog +
                "|UnitId=" + unitId + "|ssd=" + ssd + "|Localized=true";
        return CatXmlParser.parseUnitInfo(soap.execCommands(List.of(cmd)));
    }

    @Cacheable(cacheNames = CacheConfig.UNIT_DETAILS_CACHE, key = "#catalog + '::' + #ssd + '::' + #unitId")
    public List<DetailDto> listDetailsByUnit(String catalog, String ssd, Integer unitId) {
        System.out.println("DEBUG listDetailsByUnit: catalog=" + catalog + ", unitId=" + unitId + ", ssd=" + ssd);
        String cmd = "ListDetailsByUnit:Locale=" + locale + "|Catalog=" + catalog +
                "|UnitId=" + unitId + "|ssd=" + ssd + "|Localized=true";
        List<DetailDto> details = CatXmlParser.parseDetails(soap.execCommands(List.of(cmd)));
        
        // Set the unitId for all details since they belong to this unit
        for (DetailDto detail : details) {
            detail.setUnitId(unitId.longValue());
            detail.setCatalog(catalog);
        }
        
        return details;
    }

    @Cacheable(cacheNames = CacheConfig.IMAGE_MAP_CACHE, key = "#catalog + '::' + #ssd + '::' + #unitId")
    public List<ImageMapDto> listImageMapByUnit(String catalog, long unitId, String ssd) {
        String cmd = "ListImageMapByUnit:Locale=" + locale + "|Catalog=" + catalog +
                "|UnitId=" + unitId + "|ssd=" + ssd;
        return CatXmlParser.parseImageMap(soap.execCommands(List.of(cmd)));
    }

    // Raw version for debugging - returns XML response directly
    public String listImageMapByUnitRaw(String catalog, long unitId, String ssd) {
        String cmd = "ListImageMapByUnit:Locale=" + locale + "|Catalog=" + catalog +
                "|UnitId=" + unitId + "|ssd=" + ssd;
        String result = soap.execCommands(List.of(cmd));
        return result != null ? result : "";
    }

    @Cacheable(cacheNames = CacheConfig.FILTER_BY_UNIT_CACHE, key = "#catalog + '::' + #vehicleId + '::' + #ssd + '::' + #unitId + '::' + #filter")
    public List<FilterOptionDto> getFilterByUnit(String catalog, long unitId, String vehicleId, String ssd, String filter) {
        String cmd = "GetFilterByUnit:Locale=" + locale + "|Catalog=" + catalog +
                "|UnitId=" + unitId + "|VehicleId=" + vehicleId + "|ssd=" + ssd +
                "|filter=" + filter;
        return CatXmlParser.parseFilter(soap.execCommands(List.of(cmd)), "GetFilterByUnit");
    }

    @Cacheable(cacheNames = CacheConfig.FILTER_BY_DETAIL_CACHE, key = "#catalog + '::' + #vehicleId + '::' + #ssd + '::' + #detailId")
    public List<FilterOptionDto> getFilterByDetail(String catalog, long detailId, String vehicleId, String ssd) {
        String cmd = "GetFilterByDetail:Locale=" + locale + "|Catalog=" + catalog +
                "|DetailId=" + detailId + "|VehicleId=" + vehicleId + "|ssd=" + ssd;
        return CatXmlParser.parseFilter(soap.execCommands(List.of(cmd)), "GetFilterByDetail");
    }


    // ---- search by name ----
    @Cacheable(cacheNames = CacheConfig.FULLTEXT_DETAILS_CACHE, key = "#query + '::' + (#catalog==null?'ALL':#catalog)")
    public List<DetailDto> searchDetails(String query, String catalog) {
    // Нормализация + кодирование
    String raw = query == null ? "" : query.trim();
    String encoded = URLEncoder.encode(raw, StandardCharsets.UTF_8);

    if (catalog != null && !catalog.isBlank()) {
        String cmd = "FindDetail:Locale=" + locale
                + "|Catalog=" + catalog
                + "|SearchText=" + encoded
                + "|Localized=true";

        String xml = soap.execCommands(List.of(cmd));
        System.out.println("FT cmd=" + cmd);
        System.out.println("FT xml head=" + xml.substring(0, Math.min(800, xml.length())));
        List<DetailDto> result = CatXmlParser.parseFulltextDetails(xml);
        System.out.println("FT parsed count=" + result.size());
        return result;
    } else {
        var cats = listCatalogs();
        List<String> cmds = cats.stream()
                .filter(c -> c.getFeatures() != null
                        && c.getFeatures().stream()
                           .anyMatch(f -> "fulltextsearch".equalsIgnoreCase(f.getName())))
                .map(c -> "FindDetail:Locale=" + locale
                        + "|Catalog=" + c.getCode()
                        + "|SearchText=" + encoded
                        + "|Localized=true")
                .toList();

        System.out.println("FT multi cmds=" + cmds.size());
        String xml = soap.execCommands(cmds);
        List<DetailDto> result = CatXmlParser.parseFulltextDetails(xml);
        System.out.println("FT parsed count=" + result.size());
        return result;
    }
}


    // Поиск деталей по точному OEM номеру (использует FindDetailByNumber или аналог)
   private String normalizeOem(String raw) {
    if (raw == null) return null;
    String s = raw.trim().toUpperCase(Locale.ROOT);
    // уберём разделители, которые часто мешают точному матчингу
    return s.replaceAll("[\\s\\-\\.\\/\\\\_]", "");
}

    public List<DetailDto> searchDetailsByOem(String oem, String catalog) {
        return searchDetailsByOem(oem, catalog, null);
    }

    public List<DetailDto> searchDetailsByOem(String oem, String catalog, String overrideLocale) {
        // 0) Нормализуем вход: без encode — SoapXml.xmlEscape уже экранирует
        String num = oem == null ? "" : oem.trim();
        if (num.isBlank()) {
            return List.of();
        }

        String useLocale = (overrideLocale != null && !overrideLocale.isBlank()) ? overrideLocale : this.locale;

        // helper: лог шапки ответа
        java.util.function.BiConsumer<String, String> logHead = (tag, xml) -> {
            String head = xml == null ? "null" : xml.substring(0, Math.min(800, xml.length()));
            System.out.println("[OEM] " + tag + " head: " + head.replaceAll("\\s+"," ").trim());
        };

        // 1) FindPartReferences (самое “универсальное” имя)
        String cmd1 = "FindPartReferences:Locale=" + useLocale
                + (catalog != null && !catalog.isBlank() ? "|Catalog=" + catalog : "")
                + "|OEM=" + num + "|Localized=true";
        String xml1 = soap.execCommands(List.of(cmd1));
        logHead.accept("FindPartReferences", xml1);
        List<DetailDto> r1 = CatXmlParser.parseOemPartReferences(xml1);
        System.out.println("[OEM] FindPartReferences parsed size=" + (r1==null?0:r1.size()));
        if (r1 != null && !r1.isEmpty()) return r1;

        // 2) FindDetailByNumber — пробуем разные имена параметра
        String[] numberKeys = {"OEM","Number","DetailNumber","PartNumber"};
        for (String key : numberKeys) {
            String cmd2 = "FindDetailByNumber:Locale=" + useLocale
                    + (catalog != null && !catalog.isBlank() ? "|Catalog=" + catalog : "")
                    + "|" + key + "=" + num
                    + "|Localized=true";
            String xml2 = soap.execCommands(List.of(cmd2));
            logHead.accept("FindDetailByNumber(" + key + ")", xml2);

            List<DetailDto> r2a = CatXmlParser.parseOemPartReferences(xml2);
            if (r2a != null && !r2a.isEmpty()) return r2a;

            List<DetailDto> r2b = CatXmlParser.parseFulltextDetails(xml2);
            if (r2b != null && !r2b.isEmpty()) return r2b;
        }

        // 3) Вариант, когда каталог требует явный Brand
        if (catalog != null && !catalog.isBlank()) {
            String[] brands = {"SCANIA","MAN","VOLVO","MERCEDES"}; // можешь подставлять только нужный
            for (String brand : brands) {
                String cmd3 = "FindDetailByNumber:Locale=" + useLocale
                        + "|Catalog=" + catalog
                        + "|Brand=" + brand
                        + "|OEM=" + num
                        + "|Localized=true";
                String xml3 = soap.execCommands(List.of(cmd3));
                logHead.accept("FindDetailByNumber(Brand=" + brand + ")", xml3);

                List<DetailDto> r3a = CatXmlParser.parseOemPartReferences(xml3);
                if (r3a != null && !r3a.isEmpty()) return r3a;
            }
        }

        // 4) Фоллбэк: полнотекст
        String cmd4 = "FindDetail:Locale=" + useLocale
                + (catalog != null && !catalog.isBlank() ? "|Catalog=" + catalog : "")
                + "|SearchText=" + num
                + "|Localized=true";
        String xml4 = soap.execCommands(List.of(cmd4));
        logHead.accept("FindDetail(SearchText)", xml4);
        return CatXmlParser.parseFulltextDetails(xml4);
    }

    public Optional<OemPartReferenceDto> findPartReferences(String oem) {
        return findPartReferences(oem, null, null);
    }

    public Optional<OemPartReferenceDto> findPartReferences(String oem, String catalog, String overrideLocale) {
        String normalizedTarget = normalizeOem(oem);
        if (normalizedTarget == null || normalizedTarget.isBlank()) {
            return Optional.empty();
        }

        String useLocale = (overrideLocale != null && !overrideLocale.isBlank()) ? overrideLocale : this.locale;

        java.util.function.BiConsumer<String, String> logHead = (tag, xml) -> {
            String head = xml == null ? "null" : xml.substring(0, Math.min(800, xml.length()));
            System.out.println("[OEM-REF] " + tag + " head: " + head.replaceAll("\\s+"," ").trim());
        };

        String cmd1 = "FindPartReferences:Locale=" + useLocale
                + (catalog != null && !catalog.isBlank() ? "|Catalog=" + catalog : "")
                + "|OEM=" + normalizedTarget + "|Localized=true";
        Optional<OemPartReferenceDto> r1 = execPartReferences("FindPartReferences", cmd1, normalizedTarget, logHead);
        if (r1.isPresent()) {
            attachManufacturers(r1.get(), normalizedTarget, catalog, useLocale, logHead);
            return r1;
        }

        String[] numberKeys = {"OEM","Number","DetailNumber","PartNumber"};
        for (String key : numberKeys) {
            String cmd2 = "FindDetailByNumber:Locale=" + useLocale
                    + (catalog != null && !catalog.isBlank() ? "|Catalog=" + catalog : "")
                    + "|" + key + "=" + normalizedTarget
                    + "|Localized=true";
            Optional<OemPartReferenceDto> r2 = execPartReferences("FindDetailByNumber(" + key + ")", cmd2, normalizedTarget, logHead);
            if (r2.isPresent()) {
                attachManufacturers(r2.get(), normalizedTarget, catalog, useLocale, logHead);
                return r2;
            }
        }

        if (catalog != null && !catalog.isBlank()) {
            String[] brands = {"SCANIA","MAN","VOLVO","MERCEDES"};
            for (String brand : brands) {
                String cmd3 = "FindDetailByNumber:Locale=" + useLocale
                        + "|Catalog=" + catalog
                        + "|Brand=" + brand
                        + "|OEM=" + normalizedTarget
                        + "|Localized=true";
                Optional<OemPartReferenceDto> r3 = execPartReferences("FindDetailByNumber(Brand=" + brand + ")", cmd3, normalizedTarget, logHead);
                if (r3.isPresent()) {
                    attachManufacturers(r3.get(), normalizedTarget, catalog, useLocale, logHead);
                    return r3;
                }
            }
        }

        String cmd4 = "FindDetail:Locale=" + useLocale
                + (catalog != null && !catalog.isBlank() ? "|Catalog=" + catalog : "")
                + "|SearchText=" + normalizedTarget
                + "|Localized=true";
        Optional<OemPartReferenceDto> r4 = execPartReferences("FindDetail(SearchText)", cmd4, normalizedTarget, logHead);
        if (r4.isPresent()) {
            attachManufacturers(r4.get(), normalizedTarget, catalog, useLocale, logHead);
            return r4;
        }

        return buildFromFindOem(normalizedTarget, catalog, useLocale, logHead);
    }

    private Optional<OemPartReferenceDto> execPartReferences(String tag,
                                                             String command,
                                                             String normalizedTarget,
                                                             java.util.function.BiConsumer<String, String> logHead) {
        String xml;
        try {
            xml = soap.execCommands(List.of(command));
        } catch (RuntimeException ex) {
            if (isRecoverableOemLookupError(ex)) {
                System.out.println("[OEM-REF] " + tag + " failed but recoverable: " + ex.getMessage());
                return Optional.empty();
            }
            throw ex;
        }
        logHead.accept(tag, xml);
        List<OemPartReferenceDto> parsed = CatXmlParser.parseOemPartReferencesDetailed(xml);
        return selectOemReference(parsed, normalizedTarget);
    }

    private Optional<OemPartReferenceDto> selectOemReference(List<OemPartReferenceDto> parsed, String normalizedTarget) {
        if (parsed == null || parsed.isEmpty()) {
            return Optional.empty();
        }

        if (normalizedTarget != null && !normalizedTarget.isBlank()) {
            for (OemPartReferenceDto dto : parsed) {
                String normalized = normalizeOem(dto.getOem());
                if (normalized != null && normalized.equals(normalizedTarget)) {
                    if (dto.getOem() == null || dto.getOem().isBlank()) {
                        dto.setOem(normalizedTarget);
                    }
                    return Optional.of(dto);
                }
            }
        }

        OemPartReferenceDto first = parsed.get(0);
        if (first.getOem() == null || first.getOem().isBlank()) {
            first.setOem(normalizedTarget);
        }
        return Optional.of(first);
    }

    private boolean isRecoverableOemLookupError(Throwable error) {
        Throwable current = error;
        while (current != null) {
            String message = current.getMessage();
            if (message != null) {
                String upper = message.toUpperCase(Locale.ROOT);
                if (upper.contains("E_UNKNOWNCOMMAND") || upper.contains("UNKNOWN COMMAND") || upper.contains("UNKNOWNCOMMAND")) {
                    return true;
                }
                if (upper.contains("E_INVALIDPARAMETER") || upper.contains("INVALIDPARAMETER")) {
                    return true;
                }
                if (upper.contains("E_ACCESSDENIED") || upper.contains("ACCESSDENIED")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }

    private Optional<OemPartReferenceDto> buildFromFindOem(String normalizedTarget,
                                                            String catalog,
                                                            String useLocale,
                                                            java.util.function.BiConsumer<String, String> logHead) {
        List<OemManufacturerDetailDto> manufacturers = fetchFindOem(normalizedTarget, catalog, useLocale, logHead);
        if (manufacturers.isEmpty()) {
            return Optional.empty();
        }
        OemPartReferenceDto dto = new OemPartReferenceDto();
        dto.setOem(normalizedTarget);
        String fallbackName = manufacturers.stream()
                .map(OemManufacturerDetailDto::getName)
                .filter(name -> name != null && !name.isBlank())
                .findFirst()
                .orElse(null);
        dto.setName(fallbackName);
        dto.setManufacturers(manufacturers);
        return Optional.of(dto);
    }

    private void attachManufacturers(OemPartReferenceDto dto,
                                     String normalizedTarget,
                                     String catalog,
                                     String useLocale,
                                     java.util.function.BiConsumer<String, String> logHead) {
        if (dto.getManufacturers() != null && !dto.getManufacturers().isEmpty()) {
            return;
        }
        List<OemManufacturerDetailDto> manufacturers = fetchFindOem(normalizedTarget, catalog, useLocale, logHead);
        if (manufacturers.isEmpty()) {
            return;
        }
        dto.setManufacturers(manufacturers);
        if (dto.getName() == null || dto.getName().isBlank()) {
            manufacturers.stream()
                    .map(OemManufacturerDetailDto::getName)
                    .filter(name -> name != null && !name.isBlank())
                    .findFirst()
                    .ifPresent(dto::setName);
        }
    }

    private List<OemManufacturerDetailDto> fetchFindOem(String normalizedTarget,
                                                        String catalog,
                                                        String useLocale,
                                                        java.util.function.BiConsumer<String, String> logHead) {
        String[] optionsOrder = {"crosses", "images", ""};
        for (String option : optionsOrder) {
            StringBuilder cmd = new StringBuilder("FindOEM:Locale=").append(useLocale)
                    .append("|OEM=").append(normalizedTarget);
            if ("crosses".equals(option)) {
                cmd.append("|ReplacementTypes=default");
            }
            if (option != null && !option.isBlank()) {
                cmd.append("|Options=").append(option);
            }

            try {
                String xml = soap.execCommands(List.of(cmd.toString()));
                logHead.accept("FindOEM" + (option == null || option.isBlank() ? "" : "(" + option + ")"), xml);
                List<OemManufacturerDetailDto> parsed = CatXmlParser.parseFindOem(xml);
                if (!parsed.isEmpty() || "".equals(option)) {
                    return parsed;
                }
                // If parsed is empty and we requested crosses, continue to try images/default
            } catch (RuntimeException ex) {
                if (isRecoverableOemLookupError(ex)) {
                    System.out.println("[OEM-REF] FindOEM" + (option == null || option.isBlank() ? "" : "(" + option + ")")
                            + " failed but recoverable: " + ex.getMessage());
                    continue;
                }
                throw ex;
            }
        }
        return List.of();
    }
    

    @Cacheable(cacheNames = CacheConfig.VEHICLE_INFO_CACHE, key = "#catalog + '::' + #vehicleId + '::' + #ssd")
    public VehicleDto getVehicleInfo(String catalog, String vehicleId, String ssd) {
        String cmd = "GetVehicleInfo:Locale=" + locale +
                "|Catalog=" + catalog + "|VehicleId=" + vehicleId + "|ssd=" + ssd + "|Localized=true";
        return CatXmlParser.parseGetVehicleInfo(soap.execCommands(List.of(cmd)));
    }

    @Cacheable(cacheNames = CacheConfig.QUICK_GROUPS_CACHE, key = "#catalog + '::' + #vehicleId + '::' + #ssd")
    public List<QuickGroupDto> listQuickGroups(String catalog, String vehicleId, String ssd) {
        String cmd = "ListQuickGroup:Locale=" + locale +
                "|Catalog=" + catalog + "|VehicleId=" + vehicleId + "|ssd=" + ssd + "|Localized=true";
        String xmlResponse = soap.execCommands(List.of(cmd));
        System.out.println("=== QuickGroups XML Response START ===");
        System.out.println(xmlResponse);
        System.out.println("=== QuickGroups XML Response END ===");
        
        List<QuickGroupDto> result = CatXmlParser.parseQuickGroups(xmlResponse);
        System.out.println("=== Parsed QuickGroups count: " + result.size() + " ===");
        for (QuickGroupDto group : result) {
            System.out.println("Parsed group: id=" + group.getId() + ", name=" + group.getName());
        }
        return result;
    }

    @Cacheable(cacheNames = CacheConfig.QUICK_DETAILS_CACHE, key = "#catalog + '::' + #vehicleId + '::' + #ssd + '::' + #groupId")
    public List<DetailDto> listQuickDetails(String catalog, String vehicleId, String ssd, long groupId) {
        String cmd = "ListQuickDetail:Locale=" + locale +
                "|Catalog=" + catalog + "|VehicleId=" + vehicleId + "|ssd=" + ssd +
                "|QuickGroupId=" + groupId + "|Localized=true";
        return CatXmlParser.parseQuickDetails(soap.execCommands(List.of(cmd)));
    }

    // Временный метод для отладки - возвращает сырой XML
    public String listQuickDetailsRaw(String catalog, String vehicleId, String ssd, long groupId) {
        String cmd = "ListQuickDetail:Locale=" + locale +
                "|Catalog=" + catalog + "|VehicleId=" + vehicleId + "|ssd=" + ssd +
                "|QuickGroupId=" + groupId + "|Localized=true";
        return soap.execCommands(List.of(cmd));
    }

    public String execCustomOperationRaw(String catalog, String ssd, String operation, Map<String,String> fields) {
        StringBuilder sb = new StringBuilder("ExecCustomOperation:Locale=").append(locale)
                .append("|Catalog=").append(catalog)
                .append("|operation=").append(operation);
        if (ssd != null && !ssd.isBlank()) sb.append("|ssd=").append(ssd);
        if (fields != null) fields.forEach((k,v) -> sb.append("|").append(k).append("=").append(v));
        return soap.execCommands(List.of(sb.toString())); // вернём сырой <response> — фронт/сервис может распарсить.
    }
    
    // ---- RAW DEBUG METHODS ----
    
    // Получить сырой XML от ListCatalogs
    public String listCatalogsRaw() {
        String cmd = "ListCatalogs:Locale=" + locale;
        return soap.execCommands(List.of(cmd));
    }
    
    // Получить сырой XML от GetCatalogInfo
    public String getCatalogInfoRaw(String catalog) {
        String cmd = "GetCatalogInfo:Locale=" + locale + "|Catalog=" + catalog;
        return soap.execCommands(List.of(cmd));
    }
    
    // Получить сырой XML от GetWizard2 (wizard start)
    public String wizardStartRaw(String catalog) {
        String cmd = "GetWizard2:Locale=" + locale + "|Catalog=" + catalog + "|Localized=true";
        return soap.execCommands(List.of(cmd));
    }
    
    // Получить сырой XML от GetWizardNextStep2 
    public String wizardNextRaw(String catalog, String ssd, Map<String,String> selections) {
        StringBuilder sb = new StringBuilder("GetWizardNextStep2:Locale=").append(locale)
                .append("|Catalog=").append(catalog).append("|Localized=true");
        if (ssd != null && !ssd.isBlank()) {
            sb.append("|ssd=").append(ssd);
        }
        selections.forEach((k,v)-> sb.append("|").append(k).append("=").append(v));
        return soap.execCommands(List.of(sb.toString()));
    }
    
    // Получить сырой XML от FindVehicleByWizard2 (wizard finish)
    public String wizardFinishRaw(String catalog, String ssd, Map<String,String> selections) {
        StringBuilder sb = new StringBuilder("FindVehicleByWizard2:Locale=").append(locale)
                .append("|Catalog=").append(catalog).append("|ssd=").append(ssd).append("|Localized=true");
        selections.forEach((k,v)-> sb.append("|").append(k).append("=").append(v));
        return soap.execCommands(List.of(sb.toString()));
    }
    @Cacheable(cacheNames = CacheConfig.CATEGORY_TREE_CACHE, key = "#catalog + '::' + #vehicleId + '::' + #ssd")
    public List<CategoryNodeDto> tree(String catalog, String vehicleId, String ssd) {
        ssd = validateSsd(ssd); // Валидируем SSD
        var cats = listCategories(catalog, vehicleId, ssd);
        Map<Long, CategoryNodeDto> map = new LinkedHashMap<>();
        for (var c : cats) {
            CategoryNodeDto n = new CategoryNodeDto();
            n.setId(c.getId()); n.setParentId(c.getParentId());
            n.setCode(c.getCode()); n.setName(c.getName());
            // подгрузим юниты этой категории
            try {
                n.setUnits(listUnits(catalog, vehicleId, ssd, c.getId()));
            } catch (Exception e) {
                n.setUnits(List.of());
            }
            map.put(n.getId(), n);
        }
        // если нужно древовидно вернуть (вложенность) — тут можно собрать children, но вы просили категории+юниты.
        return new ArrayList<>(map.values());
    }

    // Получить модели автомобилей для каталога
    public List<VehicleModelDto> getVehicleModels(String catalog) {
        try {
            WizardStepDto step = wizardStart(catalog);
            if (step != null && step.getParams() != null && !step.getParams().isEmpty()) {
                // Выбираем параметр с наибольшим количеством значений (обычно это "Код"/модель)
                WizardParamDto bestParam = null;
                int bestCount = -1;
                for (WizardParamDto p : step.getParams()) {
                    int count = (p != null && p.getValues() != null) ? p.getValues().size() : 0;
                    if (count > bestCount) { bestCount = count; bestParam = p; }
                }
                if (bestParam != null && bestParam.getValues() != null && !bestParam.getValues().isEmpty()) {
                    List<VehicleModelDto> models = new ArrayList<>();
                    for (WizardValueDto value : bestParam.getValues()) {
                        models.add(new VehicleModelDto(value.getCode(), value.getLabel()));
                    }
                    return models;
                }
            }
            return List.of();
        } catch (Exception e) {
            return List.of();
        }
    }


    //
    public List<ApplicableVehicleDto> findApplicableVehiclesByOem(String catalog, String oem) {
        String cmd = "FindApplicableVehicles:OEM=" + oem
                + "|Catalog=" + catalog
                + "|Locale=" + locale;
        try {
            String xml = soap.execCommands(List.of(cmd));
            return CatXmlParser.parseFindApplicableVehicles(xml);
        } catch (Exception e) {
            log.warn("Failed to fetch applicable vehicles for catalog {} and OEM {}: {}", catalog, oem, e.getMessage());
            return List.of();
        }
    }

    //
    public OemApplicabilityDto getOemPartApplicability(String catalog, String ssd, String oem) {
        String cmd = "GetOEMPartApplicability:Catalog=" + catalog
                + "|OEM=" + oem
                + "|ssd=" + ssd
                + "|Locale=" + locale;
        String xml = soap.execCommands(List.of(cmd));
        return CatXmlParser.parseOemPartApplicability(xml);
    }


}
