package autoparts.kz.modules.admin.catalogimport;

import autoparts.kz.modules.admin.catalogimport.dto.CatalogImportDtos.*;
import autoparts.kz.modules.admin.catalogimport.entity.CatalogImportJob;
import autoparts.kz.modules.admin.catalogimport.parser.PdfCatalogParser.ParsedCatalog;
import autoparts.kz.modules.admin.catalogimport.parser.PdfCatalogParser.ParsedItem;
import autoparts.kz.modules.admin.catalogimport.repository.CatalogImportJobRepository;
import autoparts.kz.modules.admin.catalogimport.service.PdfCatalogImportService;
import autoparts.kz.modules.category.entity.Category;
import autoparts.kz.modules.category.repository.CategoryRepository;
import autoparts.kz.modules.cml.config.AwsS3Properties;
import autoparts.kz.modules.cml.service.S3Storage;
import autoparts.kz.modules.manualProducts.entity.Product;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/** Commit распознанного каталога в products: создание, повторный импорт без дублей, товары 1С не трогаем. */
@DataJpaTest(properties = {"spring.liquibase.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.url=jdbc:h2:mem:catalogimport;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "catalog-import.image-base-url=https://shop.test"})
@ContextConfiguration(classes = CatalogImportServiceTest.Config.class)
class CatalogImportServiceTest {

    @Configuration
    @EntityScan(basePackageClasses = {Product.class, Category.class, CatalogImportJob.class})
    @EnableJpaRepositories(basePackageClasses = {CatalogImportJobRepository.class, CategoryRepository.class})
    @Import(PdfCatalogImportService.class)
    static class Config {
        @Bean ObjectMapper objectMapper() { return new ObjectMapper().findAndRegisterModules(); }
    }

    @MockBean S3Storage s3;
    @Autowired javax.sql.DataSource dataSource;

    /** H2 строит схему по сущностям (varchar 255); на проде products.description — TEXT (миграция 02). */
    @org.junit.jupiter.api.BeforeEach
    void prodColumnTypes() throws Exception {
        try (var c = dataSource.getConnection(); var st = c.createStatement()) {
            st.execute("ALTER TABLE products ALTER COLUMN description SET DATA TYPE CHARACTER LARGE OBJECT");
        }
    }
    @Autowired PdfCatalogImportService service;
    @Autowired CatalogImportJobRepository jobs;
    @Autowired CategoryRepository categories;
    @Autowired EntityManager em;

    @BeforeEach
    void s3() {
        AwsS3Properties props = new AwsS3Properties();
        props.setEndpoint("https://shop.test/storage");
        when(s3.properties()).thenReturn(props);
    }

    private static final String LED = "LED SİSTEMLİ LAMBALAR / LED SYSTEM LIGHTS";
    private static final String TRACTOR = "TRAKTÖR ve KABİN FARLARI - TRACTOR HEADLIGHTS";

    private Long parsedJob(List<ParsedItem> rows) throws Exception {
        CatalogImportJob job = new CatalogImportJob();
        job.setFileName("04 Çeray Katalog TRAKTÖR 2025.pdf");
        job.setBrand("ÇERAY");
        job.setStatus(CatalogImportJob.Status.PARSING);
        Long id = jobs.save(job).getId();
        Method save = PdfCatalogImportService.class.getDeclaredMethod("saveParsed", Long.class, ParsedCatalog.class);
        save.setAccessible(true);
        save.invoke(service, id, new ParsedCatalog(3, 0, rows, List.of()));
        return id;
    }

    private static ParsedItem row(String section, String code, String en, String img) {
        return new ParsedItem(5, section, code, null, "TR " + code, en, null, img);
    }

    @Test
    void commitCreatesProductsCategoriesAndReimportUpdatesInsteadOfDuplicating() throws Exception {
        Long id = parsedJob(List.of(
                row(TRACTOR, "712211-LH", "TRACTOR REAR COMBINATION LAMP LEFT", "catalog-import/1/p5_0.png"),
                row(LED, "202501-12V", "NEON LED REAR COMBINATION LAMP 12V", "catalog-import/1/p6_0.png"),
                row(LED, "202501-12V", "NEON LED REAR COMBINATION LAMP 12V", "catalog-import/1/p6_1.png")));

        List<ItemDto> items = service.items(id);
        assertEquals(List.of("NEW", "NEW", "DUPLICATE"), items.stream().map(ItemDto::status).toList());
        assertEquals("Фонарь задний комбинированный, для трактора, левый", items.get(0).name());
        assertEquals("Освещение тракторов и кабин", items.get(0).categoryName());
        assertTrue(items.get(0).imageUrl().startsWith("https://shop.test/api/products/catalog-images/"));

        service.updateItem(id, items.get(1).id(), new ItemUpdate("Фонарь задний LED 12V", null, null));
        CommitResult first = service.commit(id);
        assertEquals(2, first.created());
        assertEquals(3, first.categoriesCreated(), "корень бренда + 2 раздела");
        em.flush();
        em.clear();

        Product p = em.createQuery("select p from Product p where p.code = '202501-12V'", Product.class).getSingleResult();
        assertEquals("ÇERAY", p.getBrand());
        assertEquals("Фонарь задний LED 12V", p.getName());
        assertEquals("CERAY-202501-12V", p.getExternalCode());
        assertNull(p.getOneCRefKey());
        assertNull(p.getPrice());
        assertEquals("Светодиодные фонари", p.getCategory().getName());
        assertEquals("ÇERAY", p.getCategory().getParent().getName());
        assertTrue(p.getProperties().stream().anyMatch(pp -> pp.getPropertyName().equals("Напряжение")
                && pp.getPropertyValue().equals("12V")));

        // повторная загрузка того же каталога — обновление, а не дубль
        Long again = parsedJob(List.of(row(TRACTOR, "712211-lh", "TRACTOR REAR COMBINATION LAMP LEFT", null)));
        assertEquals("UPDATE", service.items(again).get(0).status());
        CommitResult second = service.commit(again);
        assertEquals(0, second.created());
        assertEquals(1, second.updated());
        em.flush();
        assertEquals(2L, em.createQuery("select count(p) from Product p", Long.class).getSingleResult());
    }

    @Test
    void oneCProductKeepsItsDataAndOnlyGetsMissingPhoto() throws Exception {
        Product onec = new Product();
        onec.setName("Фонарь 1С");
        onec.setCode("202401");
        onec.setBrand("ÇERAY");
        onec.setExternalCode("00-123");
        onec.setOneCRefKey("ref-1");
        onec.setPrice(5000);
        em.persist(onec);
        em.flush();

        Long id = parsedJob(List.of(row(LED, "202401", "POWERFUL ROUND LED DRIVING LIGHTS", "catalog-import/9/p5_0.png")));
        assertEquals("ONEC", service.items(id).get(0).status());
        service.commit(id);
        em.flush();
        em.clear();
        Product p = em.find(Product.class, onec.getId());
        assertEquals("Фонарь 1С", p.getName());
        assertEquals(5000, p.getPrice());
        assertNull(p.getCategory());
        assertNotNull(p.getImageUrl());
    }

    @Test
    void excludedRowsAreNotCommitted() throws Exception {
        Long id = parsedJob(List.of(row(LED, "202504", "NEON LED REAR LAMP DYNAMIC SIGNAL", null)));
        ItemDto it = service.items(id).get(0);
        service.updateItem(id, it.id(), new ItemUpdate(null, null, false));
        CommitResult r = service.commit(id);
        assertEquals(0, r.created());
    }

    @Test
    void sectionCategoryNameCanBeRenamed() throws Exception {
        Long id = parsedJob(List.of(row(LED, "202505", "LED SIDE MARKER LAMP", null)));
        service.updateSections(id, List.of(new SectionMapping(LED, "LED-освещение", 0)));
        service.commit(id);
        em.flush();
        assertTrue(categories.findAll().stream().anyMatch(c -> c.getName().equals("LED-освещение")));
    }
}
