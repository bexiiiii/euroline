package autoparts.kz.modules.mainSearch.service;

import autoparts.kz.modules.mainSearch.dto.SearchResponse;
import autoparts.kz.modules.stockOneC.dto.StockBulkResponse;
import autoparts.kz.modules.vinLaximo.dto.DetailDto;
import autoparts.kz.modules.vinLaximo.dto.VehicleDto;
import autoparts.kz.modules.vinLaximo.service.CatService;
import autoparts.kz.modules.vinLaximo.dto.OemPartReferenceDto;
import autoparts.kz.modules.stockOneC.client.OneCClient;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class MainSearchService {

    private final CatService cat;
    private final OneCClient oneC;

    // VIN - точно 17 символов, без букв I, O, Q (расширенный паттерн)
    private static final Pattern VIN = Pattern.compile("^[A-HJ-NPR-Z0-9]{17}$", Pattern.CASE_INSENSITIVE);
    
    // Дополнительная проверка для потенциальных VIN (более мягкая)
    private static final Pattern POTENTIAL_VIN = Pattern.compile("^[A-Z0-9]{17}$", Pattern.CASE_INSENSITIVE);
    
    // FRAME - должен содержать дефис и быть в формате: 2-4 буквы, дефис, номер
    private static final Pattern FRAME = Pattern.compile("^[A-Z]{2,4}-[0-9A-Z]{6,}$", Pattern.CASE_INSENSITIVE);
    
    // Более строгий паттерн для OEM - без пробелов, минимум 5 символов
    private static final Pattern STRICT_OEM = Pattern.compile("^[A-Z0-9\\-\\.\\/]{5,25}$", Pattern.CASE_INSENSITIVE);

    public SearchResponse search(String q, String catalog) {
        String query = q.trim().toUpperCase();
        SearchResponse resp = new SearchResponse();
        resp.setQuery(query);

        // 1. VIN - точно 17 символов без пробелов (расширенная проверка)
        if (query.length() == 17) {
            boolean isStrictVin = VIN.matcher(query).matches();
            boolean isPotentialVin = POTENTIAL_VIN.matcher(query).matches();
            
            if (isStrictVin || isPotentialVin) {
                try {
                    VehicleDto v = cat.findByVin(query, catalog);
                    var sv = new SearchResponse.Vehicle();
                    sv.setVehicleId(v.getVehicleId());
                    sv.setSsd(v.getSsd());
                    sv.setCatalog(v.getCatalog());
                    sv.setBrand(v.getBrand());
                    sv.setName(v.getName());
                    resp.setVehicle(sv);
                    resp.setDetectedType(SearchResponse.DetectedType.VIN);
                    return resp;
                } catch (Exception e) {
                    // Если поиск по VIN не удался, продолжаем как обычный поиск
                    System.out.println("VIN search failed for: " + query + " - " + e.getMessage());
                }
            }
        }

        // 2. FRAME - должен содержать дефис в правильном формате
        if (FRAME.matcher(query).matches()) {
            try {
                String[] parts = query.split("-");
                String frame = parts[0];
                String frameNo = parts.length > 1 ? parts[1] : "";
                VehicleDto v = cat.findByFrame(frame, frameNo, catalog);
                var sv = new SearchResponse.Vehicle();
                sv.setVehicleId(v.getVehicleId());
                sv.setSsd(v.getSsd());
                sv.setCatalog(v.getCatalog());
                sv.setBrand(v.getBrand());
                sv.setName(v.getName());
                resp.setVehicle(sv);
                resp.setDetectedType(SearchResponse.DetectedType.FRAME);
                return resp;
            } catch (Exception e) {
                // Если поиск по FRAME не удался, продолжаем как обычный поиск
                resp.setDetectedType(SearchResponse.DetectedType.TEXT);
            }
        }

        

        boolean looksLikeOem = isLikelyOemNumber(query);
    resp.setDetectedType(looksLikeOem ? SearchResponse.DetectedType.OEM
                                      : SearchResponse.DetectedType.TEXT);

    List<DetailDto> found = List.of();
        // 1) Сначала точный OEM (если похоже на OEM)
    if (looksLikeOem) {
        try {
            List<DetailDto> exact = cat.searchDetailsByOem(query, catalog);
            if (exact != null && !exact.isEmpty()) {
                found = exact;
            }
        } catch (Exception e) {
            System.out.println("[SEARCH] exact OEM failed: " + e.getMessage());
        }
    }

    // 2) Если пока пусто — добиваем полнотекстом
    if (found.isEmpty()) {
        try {
            found = cat.searchDetails(query, catalog);
        } catch (Exception e) {
            System.out.println("[SEARCH] fulltext failed: " + e.getMessage());
            resp.setResults(List.of());
            return resp;
        }
    }

        // Собираем OEM для батча в 1С
        List<String> oems = found.stream()
                .map(DetailDto::getOem)
                .filter(Objects::nonNull)
                .distinct()
                .limit(200)
                .toList();

        StockBulkResponse stock = getStock(oems);

        var items = found.stream().map(d -> {
            var it = new SearchResponse.Item();
            it.setOem(d.getOem());
            it.setName(d.getName());
            it.setBrand(d.getBrand());
            it.setCatalog(d.getCatalog());
            it.setImageUrl(null);

            var s = stock.getByOem(d.getOem());
            if (s != null) {
                it.setPrice(s.getPrice());
                it.setCurrency(s.getCurrency());
                it.setQuantity(s.getTotalQty());
                it.setWarehouses(StockBulkResponse.toWarehouses(s));
            }

            it.setVehicleHints(Collections.emptyList());
            return it;
        }).toList();

        // ДОПОЛНЕНИЕ: если это похоже на OEM и в Laximo ничего не нашлось по самому запросу,
        // но есть запись в 1С — показываем позицию из 1С как отдельный элемент результата.
        if (looksLikeOem) {
            boolean queryExistsInFound = oems.stream().anyMatch(o -> o.equalsIgnoreCase(query));
            boolean queryExistsInItems = items.stream().anyMatch(i -> query.equalsIgnoreCase(i.getOem()));

            if (!queryExistsInFound && !queryExistsInItems) {
                try {
                    StockBulkResponse single = getStock(List.of(query));
                    if (single != null && single.getItems() != null) {
                        for (StockBulkResponse.Item s : single.getItems()) {
                            if (s.getOem() != null && s.getOem().equalsIgnoreCase(query)) {
                                SearchResponse.Item it = new SearchResponse.Item();
                                it.setOem(s.getOem());
                                it.setName(s.getOem()); // нет имени от Laximo — используем OEM
                                it.setBrand(null);
                                it.setCatalog("1C");
                                it.setImageUrl(null);
                                it.setPrice(s.getPrice());
                                it.setCurrency(s.getCurrency());
                                it.setQuantity(s.getTotalQty());
                                it.setWarehouses(StockBulkResponse.toWarehouses(s));
                                it.setVehicleHints(Collections.emptyList());

                                // Добавляем в общий список результатов
                                List<SearchResponse.Item> merged = new ArrayList<>(items);
                                merged.add(it);
                                resp.setResults(merged);
                                return resp;
                            }
                        }
                    }
                } catch (Exception ignore) {
                    // Не мешаем основному потоку
                }
            }
        }

        resp.setResults(items);
        return resp;
    }

    public Optional<OemPartReferenceDto> findPartReferences(String oem, String catalog, String locale) {
        return cat.findPartReferences(oem, catalog, locale);
    }

    /**
     * Определяет, похоже ли значение на OEM номер детали
     */
    private boolean isLikelyOemNumber(String query) {
        // Если содержит пробелы - скорее всего текстовый поиск
        if (query.contains(" ")) {
            return false;
        }
        
        // Если слишком короткий - скорее всего не OEM
        if (query.length() < 5) {
            return false;
        }
        
        // Если слишком длинный - скорее всего текст
        if (query.length() > 25) {
            return false;
        }
        
        // Если это потенциальный VIN - не OEM
        if (query.length() == 17) {
            return false;
        }
        
        // Проверяем строгий паттерн OEM
        if (STRICT_OEM.matcher(query).matches()) {
            return true;
        }
        
        // Дополнительные эвристики:
        // - содержит и буквы и цифры
        boolean hasLetters = query.matches(".*[A-Z].*");
        boolean hasNumbers = query.matches(".*[0-9].*");
        
        return hasLetters && hasNumbers;
    }

    private StockBulkResponse getStock(List<String> oems) {
        try {
            return oneC.getStockByOemBulk(oems);
        } catch (Exception e) {
            // Если запрос остатков не удался, возвращаем пустой ответ
            return new StockBulkResponse();
        }
    }
}
