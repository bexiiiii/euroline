package autoparts.kz.modules.admin.catalogimport.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Строка каталога, распознанная из PDF (артикул + названия + фото), до/после commit. */
@Getter
@Setter
@Entity
@Table(name = "catalog_import_items")
public class CatalogImportItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false)
    private int page;

    private String section;

    @Column(nullable = false)
    private String code;

    /** Артикул из английской половины таблицы, если в каталоге он отличается (опечатка). */
    @Column(name = "alt_code")
    private String altCode;

    /** Название на сайте (русский перевод, правится в превью). */
    @Column(nullable = false)
    private String name;

    @Column(name = "name_tr")
    private String nameTr;

    @Column(name = "name_en")
    private String nameEn;

    @Column(columnDefinition = "TEXT")
    private String note;

    private String voltage;

    /** Слова, оставленные без перевода (модели техники и т.п.) — подсказка проверить название. */
    private String untranslated;

    @Column(name = "image_key")
    private String imageKey;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(nullable = false)
    private boolean included = true;

    @Column(name = "duplicate_in_file", nullable = false)
    private boolean duplicateInFile;

    @Column(name = "product_id")
    private Long productId;
}
