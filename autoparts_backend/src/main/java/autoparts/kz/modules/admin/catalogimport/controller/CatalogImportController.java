package autoparts.kz.modules.admin.catalogimport.controller;

import autoparts.kz.modules.admin.catalogimport.dto.CatalogImportDtos.*;
import autoparts.kz.modules.admin.catalogimport.service.PdfCatalogImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/** Админка: загрузка PDF-каталога поставщика → превью/правка распознанных товаров → загрузка в базу. */
@RestController
@RequestMapping("/api/admin/catalog-import")
@RequiredArgsConstructor
public class CatalogImportController {

    private final PdfCatalogImportService service;

    @PostMapping("/jobs")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public JobDto upload(@RequestParam("file") MultipartFile file,
                         @RequestParam("brand") String brand,
                         @RequestParam(value = "parentCategoryId", required = false) Long parentCategoryId,
                         Authentication auth) throws IOException {
        return service.start(file.getBytes(), file.getOriginalFilename(), brand, parentCategoryId,
                auth != null ? auth.getName() : null);
    }

    @GetMapping("/jobs")
    public List<JobDto> list() {
        return service.list();
    }

    @GetMapping("/jobs/{id}")
    public JobDto get(@PathVariable Long id) {
        return service.get(id);
    }

    @GetMapping("/jobs/{id}/items")
    public List<ItemDto> items(@PathVariable Long id) {
        return service.items(id);
    }

    @PatchMapping("/jobs/{id}/items/{itemId}")
    public ItemDto updateItem(@PathVariable Long id, @PathVariable Long itemId, @RequestBody ItemUpdate body) {
        return service.updateItem(id, itemId, body);
    }

    @PutMapping("/jobs/{id}/sections")
    public JobDto updateSections(@PathVariable Long id, @RequestBody List<SectionMapping> body) {
        return service.updateSections(id, body);
    }

    @PostMapping("/jobs/{id}/commit")
    public CommitResult commit(@PathVariable Long id) {
        return service.commit(id);
    }

    @DeleteMapping("/jobs/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
