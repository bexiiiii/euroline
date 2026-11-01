package autoparts.kz.modules.admin.catalogimport;

import autoparts.kz.modules.admin.catalogimport.controller.CatalogImageController;
import autoparts.kz.modules.admin.catalogimport.controller.CatalogImportController;
import autoparts.kz.modules.admin.catalogimport.entity.CatalogImportJob;
import autoparts.kz.modules.admin.catalogimport.repository.CatalogImportJobRepository;
import autoparts.kz.modules.admin.catalogimport.service.PdfCatalogImportService;
import autoparts.kz.modules.category.entity.Category;
import autoparts.kz.modules.category.repository.CategoryRepository;
import autoparts.kz.modules.cml.config.AwsS3Properties;
import autoparts.kz.modules.cml.service.S3Storage;
import autoparts.kz.modules.manualProducts.entity.Product;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Сквозной сценарий админки на настоящем PDF: загрузка → фоновый разбор → превью → правка → commit →
 * публичная отдача фото. S3 заменён памятью. Запуск: -Dcatalog.pdf=/path/to/catalog.pdf
 */
@EnabledIfSystemProperty(named = "catalog.pdf", matches = ".+")
@DataJpaTest(properties = {"spring.liquibase.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.url=jdbc:h2:mem:catalogflow;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "catalog-import.image-base-url=https://shop.test"})
@ContextConfiguration(classes = CatalogImportFlowTest.Config.class)
@Transactional(propagation = Propagation.NOT_SUPPORTED) // разбор идёт в своём потоке и своих транзакциях
class CatalogImportFlowTest {

    @Configuration
    @EntityScan(basePackageClasses = {Product.class, Category.class, CatalogImportJob.class})
    @EnableJpaRepositories(basePackageClasses = {CatalogImportJobRepository.class, CategoryRepository.class})
    @Import({PdfCatalogImportService.class, CatalogImportController.class, CatalogImageController.class})
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
    @Autowired CatalogImportController controller;
    @Autowired CatalogImageController images;
    @Autowired ObjectMapper mapper;
    @Autowired EntityManager em;

    @Test
    void uploadParseEditCommitAndServeImages() throws Exception {
        Map<String, byte[]> store = new ConcurrentHashMap<>();
        AwsS3Properties props = new AwsS3Properties();
        props.setEndpoint("https://shop.test/storage");
        when(s3.properties()).thenReturn(props);
        doAnswer(inv -> store.put(inv.getArgument(0), inv.getArgument(1))).when(s3).putObject(anyString(), any(), anyString());
        when(s3.getObject(anyString())).thenAnswer(inv -> {
            byte[] b = store.get(inv.<String>getArgument(0));
            if (b == null) throw new IllegalStateException("NoSuchKey");
            return b;
        });
        MockMvc http = MockMvcBuilders.standaloneSetup(controller, images).build();

        Path pdf = Path.of(System.getProperty("catalog.pdf"));
        var upload = http.perform(multipart("/api/admin/catalog-import/jobs")
                        .file(new MockMultipartFile("file", pdf.getFileName().toString(), "application/pdf", Files.readAllBytes(pdf)))
                        .param("brand", "ÇERAY"))
                .andExpect(status().isAccepted()).andReturn();
        long id = mapper.readTree(upload.getResponse().getContentAsString()).get("id").asLong();

        JsonNode job = null;
        for (int i = 0; i < 600; i++) { // до 5 минут: большой PDF на загруженной машине
            job = mapper.readTree(http.perform(get("/api/admin/catalog-import/jobs/" + id)).andReturn().getResponse().getContentAsString());
            if (!job.get("status").asText().equals("PARSING")) break;
            Thread.sleep(500);
        }
        JsonNode parsed = job;
        assertEquals("READY", parsed.get("status").asText(), () -> "job: " + parsed);
        System.out.println("JOB " + job);

        JsonNode items = mapper.readTree(http.perform(get("/api/admin/catalog-import/jobs/" + id + "/items"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertTrue(items.size() > 50);
        JsonNode first = items.get(0);
        for (int i = 0; i < Math.min(8, items.size()); i++) {
            JsonNode it = items.get(i);
            System.out.println("ITEM " + it.get("code").asText() + " | " + it.get("name").asText() + " | " + it.get("status").asText());
        }

        // фото отдаётся публичным эндпоинтом, чужие ключи — нет
        String imageUrl = first.get("imageUrl").asText();
        String path = imageUrl.replace("https://shop.test", "");
        var img = http.perform(get(path)).andExpect(status().isOk()).andReturn().getResponse();
        assertEquals("image/png", img.getContentType());
        assertTrue(img.getContentAsByteArray().length > 1000);
        String foreign = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString("invoices/x.pdf".getBytes());
        http.perform(get("/api/products/catalog-images/" + foreign)).andExpect(status().isNotFound());

        // правка названия + commit
        http.perform(patch("/api/admin/catalog-import/jobs/" + id + "/items/" + first.get("id").asLong())
                        .contentType("application/json").content("{\"name\":\"Проверка названия\"}"))
                .andExpect(status().isOk());
        JsonNode commit = mapper.readTree(http.perform(post("/api/admin/catalog-import/jobs/" + id + "/commit"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        System.out.println("COMMIT " + commit);
        assertEquals(job.get("included").asInt(), commit.get("created").asInt());

        Long products = em.createQuery("select count(p) from Product p where p.brand = 'ÇERAY'", Long.class).getSingleResult();
        assertEquals(commit.get("created").asLong(), products);
        assertEquals(1L, em.createQuery("select count(p) from Product p where p.name = 'Проверка названия'", Long.class).getSingleResult());
    }
}
