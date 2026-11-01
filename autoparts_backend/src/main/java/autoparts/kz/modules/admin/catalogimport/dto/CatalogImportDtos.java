package autoparts.kz.modules.admin.catalogimport.dto;

import java.time.Instant;
import java.util.List;

public final class CatalogImportDtos {

    private CatalogImportDtos() {}

    public record SectionMapping(String section, String categoryName, long items) {}

    public record JobDto(Long id, String fileName, String brand, Long parentCategoryId, String status,
                         int pages, int pagesDone, int pagesWithoutText, long items, long included,
                         List<String> warnings, List<SectionMapping> sections, String error,
                         int createdCount, int updatedCount, int skippedCount,
                         String createdBy, Instant createdAt, Instant committedAt) {}

    /**
     * status: NEW — будет создан; UPDATE — обновит товар каталога с тем же брендом+артикулом;
     * ONEC — такой артикул уже есть из 1С (обновим только пустое фото); DUPLICATE — повтор в этом файле;
     * EXCLUDED — снят галочкой.
     */
    public record ItemDto(Long id, int position, int page, String section, String categoryName, String code,
                          String altCode, String name, String nameTr, String nameEn, String note, String voltage,
                          String untranslated, String imageUrl, boolean included, boolean duplicateInFile,
                          String status, Long existingProductId, Long productId) {}

    public record ItemUpdate(String name, String code, Boolean included) {}

    public record CommitResult(int created, int updated, int skipped, int categoriesCreated) {}
}
