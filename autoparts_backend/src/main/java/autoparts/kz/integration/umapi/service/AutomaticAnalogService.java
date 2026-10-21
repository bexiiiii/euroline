package autoparts.kz.integration.umapi.service;

import autoparts.kz.common.util.ArticleNormalizationUtil;
import autoparts.kz.integration.umapi.client.UmapiClient;
import autoparts.kz.integration.umapi.config.UmapiProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;
import java.util.function.Supplier;

/** Shared original-number discovery, not a guarantee of fit and not transitive cross closure. */
@Service
public class AutomaticAnalogService {
    public record Match(String article, String brand, String name, String imageUrl, List<String> oeReferences) {}
    public record Snapshot(List<Match> matches, boolean loading, boolean partial) {
        public static Snapshot empty() { return new Snapshot(List.of(), false, false); }
    }
    private static class Job {
        volatile Snapshot snapshot = new Snapshot(List.of(), true, false);
        volatile long expiresAt = Long.MAX_VALUE;
    }
    private final UmapiClient client;
    private final OeCatalogCache cache;
    private final ObjectMapper mapper;
    private final String locale;
    private final Map<String, Job> jobs = new ConcurrentHashMap<>();
    // A global bound, not one executor per visitor. Queued jobs do not block HTTP threads.
    private final ThreadPoolExecutor worker = new ThreadPoolExecutor(2, 2, 30, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(32), runnable -> {
                Thread thread = new Thread(runnable, "umapi-oe-discovery"); thread.setDaemon(true); return thread;
            }, new ThreadPoolExecutor.AbortPolicy());

    public AutomaticAnalogService(UmapiClient client, OeCatalogCache cache, ObjectMapper mapper, UmapiProperties properties) {
        this.client = client; this.cache = cache; this.mapper = mapper; this.locale = properties.getLocale();
    }

    public synchronized Snapshot lookup(String article, String brand) {
        String number = normalize(article), manufacturer = brandKey(brand);
        if (number.isBlank() || manufacturer.isBlank()) return Snapshot.empty();
        String key = locale + ":" + mapper.valueToTree(List.of(manufacturer, number));
        long now = System.currentTimeMillis();
        jobs.entrySet().removeIf(entry -> entry.getValue().expiresAt <= now);
        Job existing = jobs.get(key);
        if (existing != null) return existing.snapshot;
        JsonNode saved = cache.read("result:" + key);
        if (saved != null) try { return mapper.treeToValue(saved, Snapshot.class); } catch (Exception ignored) { }
        if (jobs.size() >= 256) return new Snapshot(List.of(), false, true);
        Job job = new Job(); jobs.put(key, job);
        try { worker.execute(() -> discover(number, manufacturer, key, job)); }
        catch (RejectedExecutionException e) {
            job.snapshot = new Snapshot(List.of(), false, true);
            job.expiresAt = now + 30_000;
        }
        return job.snapshot;
    }

    private JsonNode cached(String key, Supplier<JsonNode> fetch) {
        String scopedKey = locale + ":" + key;
        JsonNode value = cache.read(scopedKey);
        if (value != null) return value;
        value = fetch.get();
        if (value == null || !value.isObject() || value.has("error") || value.has("statusCode"))
            throw new IllegalStateException("Invalid catalog response");
        // Validate successful shapes before caching; a malformed 200 is not 'no analogs'.
        if (key.startsWith("oe:") && (!value.path("data").isArray() || !value.path("rows").isNumber()))
            throw new IllegalStateException("Invalid OE page");
        if (key.startsWith("article:") && !value.path("ART_ID").isNumber())
            throw new IllegalStateException("Invalid article details");
        if (key.startsWith("identity:") && !value.has("article"))
            throw new IllegalStateException("Invalid article identity");
        cache.write(scopedKey, value);
        return value;
    }

    private void discover(String article, String brand, String key, Job job) {
        Map<String, Match> matches = new LinkedHashMap<>();
        boolean partial = false;
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(90);
        try {
            JsonNode identity = cached("identity:" + mapper.valueToTree(List.of(brand, article)),
                    () -> client.getCrossArticleInfo(article, brand));
            if (!samePart(identity.path("article").asText(), identity.path("brand").asText(), article, brand))
                throw new IllegalStateException("Catalog identity mismatch");
            long id = identity.path("catalogId").asLong(0);
            if (id > 0) {
                JsonNode source = cached("article:" + id, () -> client.getArticleDetails(id));
                if (!samePart(source.path("ARTICLE_NR").asText(), source.path("BRAND").asText(), article, brand))
                    throw new IllegalStateException("Catalog details mismatch");
                Set<String> visitedOe = new HashSet<>();
                for (JsonNode oe : source.path("OE_CODES")) {
                    String oeNumber = normalize(oe.path("DISPLAY_NR").asText());
                    String oeBrand = brandKey(oe.path("BRAND").asText());
                    if (oeNumber.isBlank() || oeBrand.isBlank() || oe.path("IS_ADDITIV").asInt(0) != 0) continue;
                    if (!visitedOe.add(oeBrand + "|" + oeNumber)) continue;
                    if (visitedOe.size() > 64 || matches.size() >= 600 || System.nanoTime() > deadline || Thread.currentThread().isInterrupted()) {
                        partial = true; break;
                    }
                    Set<String> seenRows = new HashSet<>();
                    for (int offset = 0; offset < 500; offset += 100) {
                        if (System.nanoTime() > deadline) { partial = true; break; }
                        int pageOffset = offset;
                        JsonNode page = cached("oe:" + oeNumber + ":" + offset, () -> client.getOeCandidates(oeNumber, pageOffset));
                        JsonNode rows = page.path("data");
                        int before = seenRows.size();
                        for (JsonNode candidate : rows) {
                            seenRows.add(candidate.path("ART_ID").asText() + "|" + candidate.path("ARL_BRA_BRAND").asText());
                            if (!"OENumber".equals(candidate.path("ARL_TYPE").asText())
                                    || !oeNumber.equals(normalize(candidate.path("ARL_DISPLAY_NR").asText()))
                                    || !oeBrand.equals(brandKey(candidate.path("ARL_BRA_BRAND").asText()))
                                    || !compatibleCategoryAndCriteria(source, candidate)) continue;
                            String number = candidate.path("ARTICLE_NR").asText(), maker = candidate.path("BRAND").asText();
                            if (number.isBlank() || maker.isBlank() || samePart(number, maker, article, brand)) continue;
                            String partKey = brandKey(maker) + "|" + normalize(number);
                            String evidence = oeBrand + " " + oeNumber;
                            Match previous = matches.get(partKey);
                            if (previous == null) {
                                if (matches.size() >= 600) { partial = true; continue; }
                                String image = candidate.path("MEDIA_FILE").asText("");
                                matches.put(partKey, new Match(number, maker, candidate.path("COMPLETE_DES").asText(number),
                                        image.isBlank() ? null : "/" + candidate.path("SUP_ID").asText() + "/" + image,
                                        List.of(evidence)));
                            } else if (!previous.oeReferences().contains(evidence)) {
                                List<String> evidenceList = new ArrayList<>(previous.oeReferences()); evidenceList.add(evidence);
                                matches.put(partKey, new Match(previous.article(), previous.brand(), previous.name(), previous.imageUrl(), List.copyOf(evidenceList)));
                            }
                        }
                        job.snapshot = new Snapshot(List.copyOf(matches.values()), true, partial);
                        int total = page.path("rows").asInt();
                        if (offset + 100 >= total) break;
                        // Short pages can be provider-deduplicated. Use offset/rows, not data.length.
                        if (rows.isEmpty() || seenRows.size() == before || offset == 400) { partial = true; break; }
                    }
                }
            }
        } catch (Exception ignored) {
            // Do not cache upstream failure as an empty successful result or log credentials/payloads.
            partial = true;
        }
        Snapshot result = new Snapshot(List.copyOf(matches.values()), false, partial);
        if (!partial) cache.write("result:" + key, mapper.valueToTree(result));
        job.snapshot = result;
        job.expiresAt = System.currentTimeMillis() + (partial ? 30_000 : TimeUnit.MINUTES.toMillis(10));
    }

    static boolean compatibleCategoryAndCriteria(JsonNode source, JsonNode candidate) {
        Set<Long> groups = new HashSet<>();
        source.path("PRODUCTS").forEach(p -> { if (p.path("PT_ID").asLong() > 0) groups.add(p.path("PT_ID").asLong()); });
        boolean sameGroup = false;
        for (JsonNode p : candidate.path("PRODUCTS")) if (groups.contains(p.path("PT_ID").asLong())) sameGroup = true;
        if (!sameGroup) return false;
        Map<Long, Set<String>> a = criteria(source), b = criteria(candidate);
        for (Long criterion : a.keySet()) {
            if (b.containsKey(criterion) && Collections.disjoint(a.get(criterion), b.get(criterion))) return false;
        }
        return true;
    }

    private static Map<Long, Set<String>> criteria(JsonNode article) {
        Map<Long, Set<String>> result = new HashMap<>();
        for (JsonNode c : article.path("CRITERIAS")) {
            String value = c.path("VALUE").asText("").trim().toUpperCase(Locale.ROOT);
            long id = c.path("CRI_ID").asLong();
            if (id > 0 && !value.isBlank()) result.computeIfAbsent(id, ignored -> new HashSet<>()).add(value);
        }
        return result;
    }

    private static boolean samePart(String a, String b, String article, String brand) {
        return normalize(a).equals(normalize(article)) && brandKey(b).equals(brandKey(brand));
    }
    private static String normalize(String value) { return ArticleNormalizationUtil.normalize(value); }
    private static String brandKey(String value) { return value == null ? "" : value.trim().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT); }
    @PreDestroy public void close() { worker.shutdownNow(); }
}
