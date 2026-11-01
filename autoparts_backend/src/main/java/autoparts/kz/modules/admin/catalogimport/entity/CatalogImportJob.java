package autoparts.kz.modules.admin.catalogimport.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** Загрузка PDF-каталога поставщика: разбор в фоне → превью/правка → commit в products. */
@Getter
@Setter
@Entity
@Table(name = "catalog_import_jobs")
public class CatalogImportJob {

    public enum Status { PARSING, READY, COMMITTING, DONE, FAILED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "source_key")
    private String sourceKey;

    @Column(nullable = false)
    private String brand;

    @Column(name = "parent_category_id")
    private Long parentCategoryId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    private int pages;

    @Column(name = "pages_done")
    private int pagesDone;

    @Column(name = "pages_without_text")
    private int pagesWithoutText;

    /** JSON-массив строк. */
    @Column(columnDefinition = "TEXT")
    private String warnings;

    /** JSON: [{section, categoryName}] — раздел каталога → категория сайта (правится в превью). */
    @Column(columnDefinition = "TEXT")
    private String sections;

    @Column(columnDefinition = "TEXT")
    private String error;

    @Column(name = "created_count")
    private int createdCount;

    @Column(name = "updated_count")
    private int updatedCount;

    @Column(name = "skipped_count")
    private int skippedCount;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "committed_at")
    private Instant committedAt;

    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
