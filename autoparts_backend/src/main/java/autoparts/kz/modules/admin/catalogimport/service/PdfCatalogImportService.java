package autoparts.kz.modules.admin.catalogimport.service;

import autoparts.kz.common.config.CacheConfig;
import autoparts.kz.modules.admin.catalogimport.dto.CatalogImportDtos.*;
import autoparts.kz.modules.admin.catalogimport.entity.CatalogImportItem;
import autoparts.kz.modules.admin.catalogimport.entity.CatalogImportJob;
import autoparts.kz.modules.admin.catalogimport.entity.CatalogImportJob.Status;
import autoparts.kz.modules.admin.catalogimport.parser.CatalogNameTranslator;
import autoparts.kz.modules.admin.catalogimport.parser.PdfCatalogParser;
import autoparts.kz.modules.admin.catalogimport.repository.CatalogImportItemRepository;
import autoparts.kz.modules.admin.catalogimport.repository.CatalogImportJobRepository;
import autoparts.kz.modules.category.entity.Category;
import autoparts.kz.modules.category.repository.CategoryRepository;
import autoparts.kz.modules.cml.service.S3Storage;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.manualProducts.entity.ProductProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.*;

/**
 * Импорт PDF-каталогов поставщиков: PDF → (фоновый разбор) строки с фото в S3 → превью/правка в админке →
 * commit в products. Повторный импорт не плодит дубли: товар ищется по бренду + артикулу.
 * Товары 1С (onec_ref_key) не перезаписываются — им только подставляется фото, если его не было.
 */
@Service
public class PdfCatalogImportService {

    private static final Logger log = LoggerFactory.getLogger(PdfCatalogImportService.class);
    public static final String KEY_PREFIX = "catalog-import/";
    private static final int MAX_VALUE = 255;

    private final CatalogImportJobRepository jobs;
    private final CatalogImportItemRepository items;
    private final CategoryRepository categories;
    private final S3Storage s3;
    private final ObjectMapper json;
    private final TransactionTemplate tx;
    private final String imageBaseUrl;
    // один поток: разбор тяжёлый (рендер/картинки), параллельные загрузки встают в очередь
    private final ExecutorService worker = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "catalog-import");
        t.setDaemon(true);
        return t;
    });

    @PersistenceContext
    private EntityManager em;

    public PdfCatalogImportService(CatalogImportJobRepository jobs, CatalogImportItemRepository items,
                                CategoryRepository categories, S3Storage s3, ObjectMapper json,
                                PlatformTransactionManager txManager,
                                @Value("${catalog-import.image-base-url:}") String imageBaseUrl) {
        this.jobs = jobs;
        this.items = items;
        this.categories = categories;
        this.s3 = s3;
        this.json = json;
        this.tx = new TransactionTemplate(txManager);
        this.imageBaseUrl = resolveBaseUrl(imageBaseUrl, s3.properties() != null ? s3.properties().getEndpoint() : null);
    }

    @PreDestroy
    void shutdown() {
        worker.shutdownNow();
    }

    // ------------------------------------------------------------------ upload / parse

    public JobDto start(byte[] pdf, String fileName, String brand, Long parentCategoryId, String user) {
        if (pdf == null || pdf.length < 5 || !new String(pdf, 0, 5, StandardCharsets.ISO_8859_1).startsWith("%PDF")) {
            throw new ResponseStatusException(BAD_REQUEST, "Нужен PDF-файл");
        }
        if (brand == null || brand.isBlank()) throw new ResponseStatusException(BAD_REQUEST, "Укажите бренд");
        if (parentCategoryId != null && !categories.existsById(parentCategoryId)) {
            throw new ResponseStatusException(BAD_REQUEST, "Категория не найдена");
        }
        CatalogImportJob job = new CatalogImportJob();
        job.setFileName(fileName == null || fileName.isBlank() ? "catalog.pdf" : fileName);
        job.setBrand(brand.trim());
        job.setParentCategoryId(parentCategoryId);
        job.setStatus(Status.PARSING);
        job.setCreatedBy(user);
        job = jobs.save(job);
        Long id = job.getId();

        String sourceKey = KEY_PREFIX + id + "/source.pdf";
        try {
            s3.putObject(sourceKey, pdf, "application/pdf");
            job.setSourceKey(sourceKey);
            job = jobs.save(job);
        } catch (Exception e) {
            log.warn("Catalog import {}: не удалось сохранить исходный PDF: {}", id, e.getMessage());
        }
        worker.submit(() -> runParse(id, pdf));
        return toDto(job);
    }

    void runParse(Long jobId, byte[] pdf) {
        try {
            PdfCatalogParser.ParsedCatalog parsed = new PdfCatalogParser().parse(pdf,
                    (png, page, index) -> {
                        String key = KEY_PREFIX + jobId + "/p" + page + "_" + index + ".png";
                        s3.putObject(key, png, "image/png");
                        return key;
                    },
                    (done, total) -> tx.executeWithoutResult(s -> jobs.updateProgress(jobId, done, total)));
            tx.executeWithoutResult(s -> saveParsed(jobId, parsed));
            log.info("Catalog import {}: {} строк, {} предупреждений", jobId, parsed.items().size(), parsed.warnings().size());
        } catch (Exception e) {
            log.error("Catalog import {} failed", jobId, e);
            tx.executeWithoutResult(s -> jobs.findById(jobId).ifPresent(j -> {
                j.setStatus(Status.FAILED);
                j.setError(e.getClass().getSimpleName() + ": " + e.getMessage());
                jobs.save(j);
            }));
        }
    }

    void saveParsed(Long jobId, PdfCatalogParser.ParsedCatalog parsed) {
        CatalogImportJob job = jobs.findById(jobId).orElseThrow();
        CatalogNameTranslator translator = new CatalogNameTranslator();
        Set<String> seen = new HashSet<>();
        Map<String, String> sections = new LinkedHashMap<>();
        List<CatalogImportItem> rows = new ArrayList<>();
        int pos = 0;
        for (PdfCatalogParser.ParsedItem p : parsed.items()) {
            CatalogNameTranslator.Result ru = translator.translate(p.nameEn(), p.nameTr());
            CatalogImportItem it = new CatalogImportItem();
            it.setJobId(jobId);
            it.setPosition(pos++);
            it.setPage(p.page());
            it.setSection(cut(p.section(), 500));
            it.setCode(cut(p.code(), 100));
            it.setAltCode(cut(p.altCode(), 100));
            it.setName(cut(withCodeVoltage(ru.name(), p.code()), MAX_VALUE));
            it.setNameTr(cut(p.nameTr(), 500));
            it.setNameEn(cut(p.nameEn(), 500));
            it.setNote(p.note());
            it.setVoltage(cut(voltageOf(p, ru), 100));
            it.setUntranslated(ru.leftovers().isEmpty() ? null : cut(String.join(", ", ru.leftovers()), 500));
            it.setImageKey(p.imageRef());
            it.setImageUrl(p.imageRef() == null ? null : imageUrl(p.imageRef()));
            boolean dup = !seen.add(normalize(p.code()));
            it.setDuplicateInFile(dup);
            it.setIncluded(!dup);
            rows.add(it);
            sections.putIfAbsent(sectionKey(p.section()), CatalogSections.suggest(p.section()));
        }
        items.saveAll(rows);
        job.setPages(parsed.pages());
        job.setPagesDone(parsed.pages());
        job.setPagesWithoutText(parsed.pagesWithoutText());
        job.setWarnings(write(parsed.warnings()));
        job.setSections(write(sections.entrySet().stream()
                .map(e -> new SectionMapping(e.getKey(), e.getValue(), 0)).toList()));
        job.setStatus(Status.READY);
        jobs.save(job);
    }

    private static final java.util.regex.Pattern CODE_VOLTAGE =
            java.util.regex.Pattern.compile("(?<![0-9])(\\d{1,3}(?:[-/]\\d{1,3})?)V$");

    /** Варианты "202501-12V"/"202501-24V" отличаются только артикулом — добавляем напряжение в название. */
    static String withCodeVoltage(String name, String code) {
        var m = CODE_VOLTAGE.matcher(code == null ? "" : code.trim());
        if (!m.find()) return name;
        String v = m.group(1) + "V";
        return name.contains(v) ? name : name + ", " + v;
    }

    private static String voltageOf(PdfCatalogParser.ParsedItem p, CatalogNameTranslator.Result ru) {
        Set<String> v = new LinkedHashSet<>(ru.voltages());
        String all = (p.code() + " " + Objects.toString(p.note(), "")).toUpperCase(Locale.ROOT);
        var m = java.util.regex.Pattern.compile("\\b(\\d{1,3}(?:[-/]\\d{1,3})?) ?(?:V|VOLT)\\b").matcher(all);
        while (m.find()) v.add(m.group(1) + "V");
        return v.isEmpty() ? null : String.join(", ", v);
    }

    // ------------------------------------------------------------------ read / edit

    @Transactional(readOnly = true)
    public List<JobDto> list() {
        return jobs.findTop50ByOrderByIdDesc().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public JobDto get(Long id) {
        return toDto(job(id));
    }

    @Transactional(readOnly = true)
    public List<ItemDto> items(Long jobId) {
        CatalogImportJob job = job(jobId);
        List<CatalogImportItem> rows = items.findByJobIdOrderByPositionAsc(jobId);
        Map<String, Product> existing = existingProducts(job.getBrand(),
                rows.stream().map(CatalogImportItem::getCode).toList());
        Map<String, String> sectionNames = sectionNames(job);
        return rows.stream().map(it -> toDto(it, existing.get(normalize(it.getCode())), sectionNames)).toList();
    }

    @Transactional
    public ItemDto updateItem(Long jobId, Long itemId, ItemUpdate upd) {
        CatalogImportJob job = editable(jobId);
        CatalogImportItem it = items.findById(itemId).filter(i -> i.getJobId().equals(jobId))
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Строка не найдена"));
        if (upd.name() != null) {
            if (upd.name().isBlank()) throw new ResponseStatusException(BAD_REQUEST, "Название пустое");
            it.setName(cut(upd.name().trim(), MAX_VALUE));
        }
        if (upd.included() != null) it.setIncluded(upd.included());
        boolean codeChanged = false;
        if (upd.code() != null) {
            String code = upd.code().trim().replaceAll("\\s+", " ").toUpperCase(Locale.forLanguageTag("tr"));
            if (code.isEmpty()) throw new ResponseStatusException(BAD_REQUEST, "Артикул пустой");
            codeChanged = !code.equals(it.getCode());
            it.setCode(cut(code, 100));
        }
        items.save(it);
        if (codeChanged) recomputeDuplicates(jobId);
        Map<String, Product> existing = existingProducts(job.getBrand(), List.of(it.getCode()));
        return toDto(it, existing.get(normalize(it.getCode())), sectionNames(job));
    }

    @Transactional
    public JobDto updateSections(Long jobId, List<SectionMapping> mapping) {
        CatalogImportJob job = editable(jobId);
        Map<String, String> current = sectionNames(job);
        for (SectionMapping m : mapping) {
            if (m.categoryName() != null && !m.categoryName().isBlank() && current.containsKey(m.section())) {
                current.put(m.section(), cut(m.categoryName().trim(), MAX_VALUE));
            }
        }
        job.setSections(write(current.entrySet().stream().map(e -> new SectionMapping(e.getKey(), e.getValue(), 0)).toList()));
        return toDto(jobs.save(job));
    }

    private void recomputeDuplicates(Long jobId) {
        Set<String> seen = new HashSet<>();
        for (CatalogImportItem it : items.findByJobIdOrderByPositionAsc(jobId)) {
            boolean dup = !seen.add(normalize(it.getCode()));
            if (dup != it.isDuplicateInFile()) {
                it.setDuplicateInFile(dup);
                if (dup) it.setIncluded(false);
                items.save(it);
            }
        }
    }

    // ------------------------------------------------------------------ commit

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.CATEGORY_TREE_CACHE, allEntries = true)
    public CommitResult commit(Long jobId) {
        CatalogImportJob job = job(jobId);
        if (job.getStatus() != Status.READY && job.getStatus() != Status.DONE) {
            throw new ResponseStatusException(CONFLICT, "Каталог ещё не разобран или уже загружается");
        }
        List<CatalogImportItem> rows = items.findByJobIdOrderByPositionAsc(jobId).stream()
                .filter(i -> i.isIncluded() && !i.isDuplicateInFile()).toList();
        Map<String, Product> existing = existingProducts(job.getBrand(),
                rows.stream().map(CatalogImportItem::getCode).toList());

        int[] categoriesCreated = {0};
        Category root = job.getParentCategoryId() != null
                ? categories.findById(job.getParentCategoryId()).orElse(null) : null;
        if (root == null) root = category(slug(job.getBrand()), job.getBrand(), null, categoriesCreated);
        Map<String, String> sectionNames = sectionNames(job);
        Map<String, Category> bySection = new HashMap<>();
        String brandSlug = slug(job.getBrand());

        int created = 0, updated = 0, skipped = 0;
        for (CatalogImportItem it : rows) {
            String sectionName = sectionNames.getOrDefault(sectionKey(it.getSection()), CatalogSections.suggest(it.getSection()));
            Category parent = root;
            Category cat = bySection.computeIfAbsent(sectionName,
                    n -> category(brandSlug + "-" + slug(n), n, parent, categoriesCreated));
            String imageUrl = it.getImageKey() == null ? null : imageUrl(it.getImageKey());

            Product p = existing.get(normalize(it.getCode()));
            if (p != null && p.getOneCRefKey() != null) {
                // товар 1С: название/цены/категорию ведёт 1С — только фото, если его нет
                if ((p.getImageUrl() == null || p.getImageUrl().isBlank()) && imageUrl != null) {
                    p.setImageUrl(imageUrl);
                    updated++;
                } else {
                    skipped++;
                }
                it.setProductId(p.getId());
                continue;
            }
            boolean isNew = p == null;
            if (isNew) {
                p = new Product();
                p.setCode(it.getCode());
                p.setBrand(job.getBrand());
                p.setExternalCode(cut(brandSlug.toUpperCase(Locale.ROOT) + "-" + it.getCode(), 100));
                p.setIsWeekly(false);
                p.setReservedStock(0);
            }
            p.setName(it.getName());
            p.setDescription(description(it));
            if (imageUrl != null) p.setImageUrl(imageUrl);
            // один артикул бывает в нескольких каталогах (LED и спецтехника) — категорию задаёт первый импорт
            if (isNew || p.getCategory() == null) p.setCategory(cat);
            replaceProperties(p, it, job);
            if (isNew) em.persist(p);
            existing.put(normalize(it.getCode()), p);
            it.setProductId(p.getId());
            if (isNew) created++; else updated++;
        }
        em.flush();
        for (CatalogImportItem it : rows) {
            if (it.getProductId() == null) {
                Product p = existing.get(normalize(it.getCode()));
                if (p != null) it.setProductId(p.getId());
            }
        }
        items.saveAll(rows);

        job.setStatus(Status.DONE);
        job.setCreatedCount(created);
        job.setUpdatedCount(updated);
        job.setSkippedCount(skipped);
        job.setCommittedAt(Instant.now());
        job.setError(null);
        jobs.save(job);
        log.info("Catalog import {} committed: created={}, updated={}, skipped={}, categories={}",
                jobId, created, updated, skipped, categoriesCreated[0]);
        return new CommitResult(created, updated, skipped, categoriesCreated[0]);
    }

    private static String description(CatalogImportItem it) {
        StringBuilder sb = new StringBuilder();
        if (it.getNameEn() != null) sb.append(it.getNameEn());
        if (it.getNameTr() != null) sb.append(sb.length() > 0 ? "\n" : "").append(it.getNameTr());
        if (it.getNote() != null) sb.append(sb.length() > 0 ? "\n" : "").append(it.getNote());
        return sb.length() == 0 ? null : sb.toString();
    }

    private void replaceProperties(Product p, CatalogImportItem it, CatalogImportJob job) {
        p.getProperties().clear();
        addProperty(p, "Название (EN)", it.getNameEn());
        addProperty(p, "Название (TR)", it.getNameTr());
        addProperty(p, "Напряжение", it.getVoltage());
        addProperty(p, "Примечание", it.getNote());
        addProperty(p, "Артикул в каталоге (EN)", it.getAltCode());
        addProperty(p, "Раздел каталога", it.getSection());
        addProperty(p, "Каталог", job.getFileName() + ", стр. " + it.getPage());
    }

    private static void addProperty(Product p, String name, String value) {
        if (value == null || value.isBlank()) return;
        ProductProperty prop = new ProductProperty();
        prop.setProduct(p);
        prop.setPropertyName(name);
        prop.setPropertyValue(cut(value, MAX_VALUE));
        p.getProperties().add(prop);
    }

    private Category category(String slug, String name, Category parent, int[] created) {
        Optional<Category> found = categories.findBySlug(slug);
        if (found.isPresent()) return found.get();
        Category c = new Category();
        c.setSlug(slug);
        c.setName(name);
        c.setParent(parent);
        c.setIsActive(true);
        c.setSortOrder(0);
        created[0]++;
        return categories.save(c);
    }

    // ------------------------------------------------------------------ delete

    public void delete(Long jobId) {
        CatalogImportJob job = job(jobId);
        if (job.getStatus() == Status.PARSING || job.getStatus() == Status.COMMITTING) {
            throw new ResponseStatusException(CONFLICT, "Дождитесь окончания разбора");
        }
        boolean committed = job.getCommittedAt() != null;
        tx.executeWithoutResult(s -> {
            items.deleteByJobId(jobId);
            jobs.deleteById(jobId);
        });
        if (!committed) {
            // фото ещё не привязаны к товарам — чистим хранилище
            try {
                s3.listObjects(KEY_PREFIX + jobId + "/").forEach(o -> s3.deleteObject(o.key()));
            } catch (Exception e) {
                log.warn("Catalog import {}: не удалось удалить файлы: {}", jobId, e.getMessage());
            }
        }
    }

    // ------------------------------------------------------------------ helpers

    /** Существующие товары бренда по артикулам (без учёта регистра). */
    private Map<String, Product> existingProducts(String brand, Collection<String> codes) {
        Map<String, Product> res = new HashMap<>();
        if (codes.isEmpty()) return res;
        List<String> upper = codes.stream().map(PdfCatalogImportService::normalize).distinct().toList();
        for (int i = 0; i < upper.size(); i += 500) {
            List<Product> found = em.createQuery(
                            "SELECT p FROM Product p WHERE UPPER(p.brand) = :brand AND UPPER(p.code) IN :codes", Product.class)
                    .setParameter("brand", brand.trim().toUpperCase(Locale.ROOT))
                    .setParameter("codes", upper.subList(i, Math.min(upper.size(), i + 500)))
                    .getResultList();
            for (Product p : found) {
                // 1С-товар приоритетнее при дублях
                res.merge(normalize(p.getCode()), p, (a, b) -> a.getOneCRefKey() != null ? a : b);
            }
        }
        return res;
    }

    private CatalogImportJob job(Long id) {
        return jobs.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Импорт не найден"));
    }

    private CatalogImportJob editable(Long id) {
        CatalogImportJob job = job(id);
        if (job.getStatus() != Status.READY && job.getStatus() != Status.DONE) {
            throw new ResponseStatusException(CONFLICT, "Каталог ещё разбирается");
        }
        return job;
    }

    private Map<String, String> sectionNames(CatalogImportJob job) {
        Map<String, String> res = new LinkedHashMap<>();
        for (SectionMapping m : read(job.getSections(), new TypeReference<List<SectionMapping>>() {}, List.<SectionMapping>of())) {
            res.put(m.section(), m.categoryName());
        }
        return res;
    }

    private JobDto toDto(CatalogImportJob j) {
        List<CatalogImportItem> rows = j.getStatus() == Status.PARSING ? List.of()
                : items.findByJobIdOrderByPositionAsc(j.getId());
        Map<String, Long> perSection = rows.stream()
                .collect(Collectors.groupingBy(i -> sectionKey(i.getSection()), Collectors.counting()));
        List<SectionMapping> sections = sectionNames(j).entrySet().stream()
                .map(e -> new SectionMapping(e.getKey(), e.getValue(), perSection.getOrDefault(e.getKey(), 0L)))
                .toList();
        return new JobDto(j.getId(), j.getFileName(), j.getBrand(), j.getParentCategoryId(), j.getStatus().name(),
                j.getPages(), j.getPagesDone(), j.getPagesWithoutText(), rows.size(),
                rows.stream().filter(i -> i.isIncluded() && !i.isDuplicateInFile()).count(),
                read(j.getWarnings(), new TypeReference<List<String>>() {}, List.of()), sections, j.getError(),
                j.getCreatedCount(), j.getUpdatedCount(), j.getSkippedCount(), j.getCreatedBy(), j.getCreatedAt(),
                j.getCommittedAt());
    }

    private ItemDto toDto(CatalogImportItem it, Product existing, Map<String, String> sectionNames) {
        String status;
        if (it.isDuplicateInFile()) status = "DUPLICATE";
        else if (!it.isIncluded()) status = "EXCLUDED";
        else if (existing == null) status = "NEW";
        else status = existing.getOneCRefKey() != null ? "ONEC" : "UPDATE";
        return new ItemDto(it.getId(), it.getPosition(), it.getPage(), it.getSection(),
                sectionNames.getOrDefault(sectionKey(it.getSection()), CatalogSections.suggest(it.getSection())),
                it.getCode(), it.getAltCode(), it.getName(), it.getNameTr(), it.getNameEn(), it.getNote(),
                it.getVoltage(), it.getUntranslated(), it.getImageUrl(), it.isIncluded(), it.isDuplicateInFile(),
                status, existing == null ? null : existing.getId(), it.getProductId());
    }

    public String imageUrl(String key) {
        String id = Base64.getUrlEncoder().withoutPadding().encodeToString(key.getBytes(StandardCharsets.UTF_8));
        return imageBaseUrl + "/api/products/catalog-images/" + id;
    }

    /** Без явной настройки: origin публичного S3-эндпоинта (на проде это домен сайта, /api проксируется на backend). */
    static String resolveBaseUrl(String configured, String s3Endpoint) {
        if (configured != null && !configured.isBlank()) return configured.replaceAll("/+$", "");
        if (s3Endpoint == null) return "";
        try {
            URI u = URI.create(s3Endpoint);
            return u.getScheme() + "://" + u.getHost() + (u.getPort() > 0 ? ":" + u.getPort() : "");
        } catch (Exception e) {
            return "";
        }
    }

    private static String sectionKey(String section) {
        return section == null ? "" : section;
    }

    static String normalize(String code) {
        return code == null ? "" : code.trim().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT);
    }

    static String slug(String value) {
        String n = Normalizer.normalize(value.trim(), Normalizer.Form.NFD).replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String s = n.toLowerCase(Locale.ROOT).replace('ı', 'i')
                .replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}]+", "-").replaceAll("^-|-$", "");
        return s.isEmpty() ? "catalog" : s;
    }

    private static String cut(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }

    private String write(Object o) {
        try {
            return json.writeValueAsString(o);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private <T> T read(String s, TypeReference<T> type, T fallback) {
        if (s == null || s.isBlank()) return fallback;
        try {
            return json.readValue(s, type);
        } catch (Exception e) {
            return fallback;
        }
    }
}
