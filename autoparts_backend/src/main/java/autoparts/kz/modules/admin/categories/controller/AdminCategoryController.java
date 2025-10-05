package autoparts.kz.modules.admin.categories.controller;

import autoparts.kz.modules.admin.categories.dto.AdminCategoryDto;
import autoparts.kz.modules.admin.categories.dto.AdminCategoryRequest;
import autoparts.kz.modules.admin.categories.dto.CategoryReorderRequest;
import autoparts.kz.modules.admin.categories.service.AdminCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final AdminCategoryService categoryService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AdminCategoryDto>> list(
            @PageableDefault(size = 20, sort = {"sortOrder", "name"}) Pageable pageable) {
        return ResponseEntity.ok(categoryService.list(pageable));
    }

    @GetMapping("/tree")
    public ResponseEntity<List<AdminCategoryDto>> tree() {
        return ResponseEntity.ok(categoryService.tree());
    }

    @GetMapping("/root")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminCategoryDto>> rootCategories() {
        return ResponseEntity.ok(categoryService.rootCategories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminCategoryDto> get(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.get(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminCategoryDto> create(@Valid @RequestBody AdminCategoryRequest request) {
        return ResponseEntity.ok(categoryService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminCategoryDto> update(@PathVariable Long id,
                                                    @Valid @RequestBody AdminCategoryRequest request) {
        return ResponseEntity.ok(categoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/reorder")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> reorder(@Valid @RequestBody CategoryReorderRequest request) {
        categoryService.reorder(request.getCategoryIds());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminCategoryDto> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.toggleStatus(id));
    }
}
