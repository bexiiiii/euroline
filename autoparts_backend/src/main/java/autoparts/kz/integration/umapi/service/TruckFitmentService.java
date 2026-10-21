package autoparts.kz.integration.umapi.service;

import autoparts.kz.common.util.ArticleNormalizationUtil;
import autoparts.kz.integration.umapi.client.UmapiClient;
import autoparts.kz.integration.umapi.config.UmapiProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;
import java.util.function.Supplier;
import java.util.regex.Pattern;

/** Segment evidence belongs to this exact part, never inherited from an OE neighbour. */
@Service
public class TruckFitmentService {
    public record Result(String status, String reason, List<String> evidence) {
        static Result unknown(String reason) { return new Result("UNKNOWN", reason, List.of()); }
        static Result pending() { return new Result("PENDING", "Проверяем применяемость в каталоге", List.of()); }
    }
    private static class Job {
        volatile Result result = Result.pending();
        volatile long expires = Long.MAX_VALUE;
    }
    // Deliberately not a whitelist of parts, brands or model names. Only explicit type fields.
    private static final Pattern TARGET = Pattern.compile("(?iu)(грузов|самосвал|седельн|полуприцеп|прицеп|\\btruck\\b|\\blorry\\b|\\btrailer\\b|semi[- ]?trailer|tractor unit)");
    private static final Pattern OTHER = Pattern.compile("(?iu)(автобус|микроавтобус|легков|\\bbus\\b|\\bcoach\\b|\\bminibus\\b|passenger car)");
    private final UmapiClient client;
    private final OeCatalogCache cache;
    private final ObjectMapper mapper;
    private final String locale;
    private final Map<String, Job> jobs = new ConcurrentHashMap<>();
    private final ThreadPoolExecutor workers = new ThreadPoolExecutor(2, 2, 30, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(512), task -> {
                Thread thread = new Thread(task, "umapi-truck-fitment"); thread.setDaemon(true); return thread;
            }, new ThreadPoolExecutor.AbortPolicy());

    public TruckFitmentService(UmapiClient client, OeCatalogCache cache, ObjectMapper mapper, UmapiProperties properties) {
        this.client = client; this.cache = cache; this.mapper = mapper; this.locale = properties.getLocale();
    }

    public synchronized Result lookup(String article, String brand) {
        String number = ArticleNormalizationUtil.normalize(article), maker = brandKey(brand);
        if (number.isBlank() || maker.isBlank()) return Result.unknown("Не определена точная деталь");
        String key = locale + ":" + mapper.valueToTree(List.of(maker, number));
        long now = System.currentTimeMillis();
        jobs.entrySet().removeIf(entry -> entry.getValue().expires <= now);
        Job existing = jobs.get(key);
        if (existing != null) return existing.result;
        JsonNode stored = cache.read("fitment-v1:" + key);
        if (stored != null) try {
            Result result = mapper.treeToValue(stored, Result.class);
            if (Set.of("TRUCK_TRAILER", "NON_TARGET", "UNKNOWN").contains(result.status())) return result;
        } catch (Exception ignored) { }
        if (jobs.size() >= 2048) return Result.unknown("Проверка временно недоступна: очередь заполнена");
        Job job = new Job(); jobs.put(key, job);
        try { workers.execute(() -> discover(number, maker, key, job)); }
        catch (RejectedExecutionException ignored) {
            job.result = Result.unknown("Проверка временно недоступна: очередь заполнена"); job.expires = now + 30_000;
        }
        return job.result;
    }

    private JsonNode cached(String key, String idField, Supplier<JsonNode> fetch) {
        String scoped = locale + ":" + key;
        JsonNode value = cache.read(scoped);
        boolean fetched = value == null;
        if (fetched) value = fetch.get();
        if (value == null || !value.isObject() || value.has("error") || value.has("statusCode") || !value.hasNonNull(idField))
            throw new IllegalStateException("Invalid fitment payload");
        if (fetched) cache.write(scoped, value);
        return value;
    }

    private void discover(String article, String brand, String key, Job job) {
        try {
            JsonNode identity = cached("identity:" + mapper.valueToTree(List.of(brand, article)), "article",
                    () -> client.getCrossArticleInfo(article, brand));
            if (!samePart(identity.path("article").asText(), identity.path("brand").asText(), article, brand))
                throw new IllegalStateException("Identity mismatch");
            long id = identity.path("catalogId").asLong();
            Result result;
            if (id <= 0) result = Result.unknown("В каталоге нет карточки применяемости");
            else {
                JsonNode detail = cached("article:" + id, "ART_ID", () -> client.getArticleDetails(id));
                if (detail.path("ART_ID").asLong() != id || !samePart(detail.path("ARTICLE_NR").asText(), detail.path("BRAND").asText(), article, brand))
                    throw new IllegalStateException("Article mismatch");
                JsonNode links = detail.path("LINK").deepCopy();
                if (!links.isObject()) throw new IllegalStateException("Missing applicability");
                result = classify(links);
                // Some article links omit type fields. Resolve a bounded number of linked vehicles/axles.
                int reads = 0;
                if ("UNKNOWN".equals(result.status())) for (String kind : List.of("CV", "Axle")) {
                    for (JsonNode link : links.path(kind)) {
                        if (reads >= 3 || "TRUCK_TRAILER".equals(result.status())) break;
                        String idField = kind.equals("CV") ? "CV_ID" : "AXL_ID";
                        long linkedId = link.path(idField).asLong();
                        if (linkedId <= 0 || !(link instanceof ObjectNode object)) continue;
                        if (typeVerdict(link, kind) != 0) continue;
                        reads++;
                        JsonNode vehicle = cached("fitment-" + kind + ":" + linkedId, idField,
                                () -> kind.equals("CV") ? client.getCommercialVehicleDetails(linkedId) : client.getAxleDetails(linkedId));
                        if (vehicle.path(idField).asLong() != linkedId) throw new IllegalStateException("Vehicle mismatch");
                        for (String field : List.of("PLATFORM_TYPE", "AXLE_STYLE", "AXLE_TYPE", "AXLE_BODY"))
                            if (vehicle.hasNonNull(field)) object.set(field, vehicle.get(field));
                        result = classify(links);
                    }
                }
            }
            cache.write("fitment-v1:" + key, mapper.valueToTree(result));
            job.result = result; job.expires = System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(10);
        } catch (Exception ignored) {
            // Failure is not 'passenger' and is never persisted as a successful classification.
            job.result = Result.unknown("Не удалось проверить применяемость. Повторите поиск позже");
            job.expires = System.currentTimeMillis() + 30_000;
        }
    }

    static Result classify(JsonNode links) {
        if (!links.isObject() || links.isEmpty()) return Result.unknown("В каталоге не указана применяемость");
        boolean knownOther = false, unresolved = false;
        for (Iterator<String> names = links.fieldNames(); names.hasNext();) {
            String kind = names.next(); JsonNode rows = links.path(kind);
            if (!rows.isArray()) { unresolved = true; continue; }
            for (JsonNode row : rows) {
                if (kind.equals("PC") || kind.equals("Motorcycle")) {
                    if (row.path(kind.equals("PC") ? "PC_ID" : "MTB_ID").asLong() > 0) knownOther = true;
                    else unresolved = true;
                } else if (kind.equals("CV") || kind.equals("Axle")) {
                    long id = row.path(kind.equals("CV") ? "CV_ID" : "AXL_ID").asLong();
                    int verdict = id > 0 ? typeVerdict(row, kind) : 0;
                    if (verdict > 0) {
                        String type = kind.equals("CV") ? row.path("PLATFORM_TYPE").asText("")
                                : typeText(row, kind);
                        return new Result("TRUCK_TRAILER", "Есть грузовая или прицепная применяемость в UMAPI",
                                List.of("UMAPI " + kind + " #" + id + ": " + type));
                    }
                    if (verdict < 0) knownOther = true; else unresolved = true;
                } else unresolved = true; // Engine or unknown linkage never proves vehicle segment.
            }
        }
        return knownOther && !unresolved ? new Result("NON_TARGET", "Указана только применяемость вне грузовиков и прицепов", List.of())
                : Result.unknown("Недостаточно данных о типе транспорта");
    }

    private static String typeText(JsonNode row, String kind) {
        return kind.equals("CV") ? row.path("PLATFORM_TYPE").asText("")
                : row.path("AXLE_STYLE").asText("") + " " + row.path("AXLE_TYPE").asText("") + " " + row.path("AXLE_BODY").asText("");
    }
    private static int typeVerdict(JsonNode row, String kind) {
        String type = typeText(row, kind);
        // Conflicting/compound type labels stay unknown rather than overriding a bus with 'truck'.
        boolean target = TARGET.matcher(type).find(), other = OTHER.matcher(type).find();
        return target && !other ? 1 : other && !target ? -1 : 0;
    }
    private static boolean samePart(String a, String b, String article, String brand) {
        return ArticleNormalizationUtil.normalize(a).equals(article) && brandKey(b).equals(brand);
    }
    private static String brandKey(String s) { return s == null ? "" : s.trim().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT); }
    @PreDestroy public void close() { workers.shutdownNow(); }
}
