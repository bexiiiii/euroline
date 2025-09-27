package autoparts.kz.modules.admin.categories.service;

import autoparts.kz.common.config.CacheConfig;
import autoparts.kz.modules.admin.categories.dto.AdminCategoryDto;
import autoparts.kz.modules.admin.categories.dto.AdminCategoryRequest;
import autoparts.kz.modules.category.entity.Category;
import autoparts.kz.modules.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminCategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public Page<AdminCategoryDto> list(Pageable pageable) {
        Pageable pageRequest = ensureSort(pageable);
        Page<Category> page = categoryRepository.findAll(pageRequest);
        Map<Long, Long> productCounts = loadProductCounts(page.getContent());
        List<AdminCategoryDto> content = page.getContent().stream()
                .map(category -> toDto(category, productCounts.getOrDefault(category.getId(), 0L), false))
                .collect(Collectors.toList());
        return new PageImpl<>(content, pageRequest, page.getTotalElements());
    }

    @Cacheable(cacheNames = CacheConfig.CATEGORY_TREE_CACHE)
    @Transactional(readOnly = true)
    public List<AdminCategoryDto> tree() {
        List<Category> all = categoryRepository.findAllByOrderBySortOrderAscNameAsc();
        Map<Long, Category> byId = all.stream().collect(Collectors.toMap(Category::getId, c -> c));
        Map<Long, List<Category>> byParent = new HashMap<>();
        List<Category> roots = new ArrayList<>();

        for (Category category : all) {
            if (category.getParent() == null) {
                roots.add(category);
            } else {
                byParent.computeIfAbsent(category.getParent().getId(), k -> new ArrayList<>()).add(category);
            }
        }

        Map<Long, Long> productCounts = loadProductCounts(all);
        return roots.stream()
                .map(root -> buildTree(root, byParent, productCounts))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminCategoryDto get(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Категория не найдена"));
        long productCount = loadProductCounts(Collections.singletonList(category))
                .getOrDefault(category.getId(), 0L);
        return toDto(category, productCount, false);
    }

    @CacheEvict(cacheNames = CacheConfig.CATEGORY_TREE_CACHE, allEntries = true)
    public AdminCategoryDto create(AdminCategoryRequest request) {
        validateRequest(request, null);
        Category category = new Category();
        applyRequestToEntity(category, request);
        Category saved = categoryRepository.save(category);
        return toDto(saved, 0L, false);
    }

    @CacheEvict(cacheNames = CacheConfig.CATEGORY_TREE_CACHE, allEntries = true)
    public AdminCategoryDto update(Long id, AdminCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Категория не найдена"));
        validateRequest(request, id);
        applyRequestToEntity(category, request);
        Category saved = categoryRepository.save(category);
        long productCount = loadProductCounts(Collections.singletonList(saved))
                .getOrDefault(saved.getId(), 0L);
        return toDto(saved, productCount, false);
    }

    @CacheEvict(cacheNames = CacheConfig.CATEGORY_TREE_CACHE, allEntries = true)
    public void delete(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Категория не найдена"));
        if (!category.getChildren().isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Нельзя удалить категорию с подкатегориями");
        }
        if (!category.getProducts().isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Нельзя удалить категорию с привязанными товарами");
        }
        categoryRepository.delete(category);
    }

    @CacheEvict(cacheNames = CacheConfig.CATEGORY_TREE_CACHE, allEntries = true)
    public AdminCategoryDto toggleStatus(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Категория не найдена"));
        category.setIsActive(Boolean.FALSE.equals(category.getIsActive()));
        Category saved = categoryRepository.save(category);
        long productCount = loadProductCounts(Collections.singletonList(saved))
                .getOrDefault(saved.getId(), 0L);
        return toDto(saved, productCount, false);
    }

    @CacheEvict(cacheNames = CacheConfig.CATEGORY_TREE_CACHE, allEntries = true)
    public void reorder(List<Long> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Список категорий пуст");
        }
        List<Category> categories = categoryRepository.findAllByIdIn(categoryIds);
        Map<Long, Category> byId = categories.stream()
                .collect(Collectors.toMap(Category::getId, c -> c));
        int order = 0;
        for (Long id : categoryIds) {
            Category category = byId.get(id);
            if (category != null) {
                category.setSortOrder(order++);
            }
        }
        categoryRepository.saveAll(byId.values());
    }

    @Transactional(readOnly = true)
    public List<AdminCategoryDto> rootCategories() {
        List<Category> roots = categoryRepository.findByParentIsNullOrderBySortOrderAscNameAsc();
        Map<Long, Long> productCounts = loadProductCounts(roots);
        return roots.stream()
                .map(root -> toDto(root, productCounts.getOrDefault(root.getId(), 0L), false))
                .collect(Collectors.toList());
    }

    private AdminCategoryDto buildTree(Category category,
                                       Map<Long, List<Category>> byParent,
                                       Map<Long, Long> productCounts) {
        AdminCategoryDto dto = toDto(category, productCounts.getOrDefault(category.getId(), 0L), true);
        List<Category> children = byParent.getOrDefault(category.getId(), Collections.emptyList());
        children.sort(Comparator.comparing(Category::getSortOrder).thenComparing(Category::getName));
        dto.setSubcategories(children.stream()
                .map(child -> buildTree(child, byParent, productCounts))
                .collect(Collectors.toList()));
        return dto;
    }

    private Pageable ensureSort(Pageable pageable) {
        if (pageable == null) {
            return PageRequest.of(0, 20, Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.asc("name")));
        }
        if (pageable.getSort().isSorted()) {
            return pageable;
        }
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.asc("name")));
    }

    private Map<Long, Long> loadProductCounts(Collection<Category> categories) {
        if (categories == null || categories.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Long> ids = categories.stream()
                .map(Category::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (ids.isEmpty()) {
            return Collections.emptyMap();
        }
        return categoryRepository.countProducts(ids).stream()
                .collect(Collectors.toMap(CategoryRepository.ProductCountProjection::getCategoryId,
                        CategoryRepository.ProductCountProjection::getProductCount));
    }

    private void applyRequestToEntity(Category category, AdminCategoryRequest request) {
        category.setName(request.getName());
        category.setSlug(slugify(request.getSlug()));
        category.setDescription(request.getDescription());
        category.setImageUrl(request.getImageUrl());
        category.setSortOrder(request.getSortOrder());
        category.setIsActive(request.getIsActive() == null ? Boolean.TRUE : request.getIsActive());

        if (request.getParentId() != null) {
            if (category.getId() != null && request.getParentId().equals(category.getId())) {
                throw new ResponseStatusException(BAD_REQUEST, "Категория не может быть родителем самой себя");
            }
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Родительская категория не найдена"));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }
    }

    private void validateRequest(AdminCategoryRequest request, Long id) {
        if (!StringUtils.hasText(request.getSlug())) {
            request.setSlug(slugify(request.getName()));
        }
        categoryRepository.findBySlug(request.getSlug())
                .filter(existing -> !Objects.equals(existing.getId(), id))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(BAD_REQUEST, "Категория со slug уже существует");
                });
    }

    private AdminCategoryDto toDto(Category category, Long productCount, boolean includeParent) {
        AdminCategoryDto dto = new AdminCategoryDto();
        dto.setId(category.getId());
        dto.setParentId(category.getParent() != null ? category.getParent().getId() : null);
        dto.setName(category.getName());
        dto.setSlug(category.getSlug());
        dto.setDescription(category.getDescription());
        dto.setIsActive(category.getIsActive());
        dto.setSortOrder(category.getSortOrder());
        dto.setImageUrl(category.getImageUrl());
        dto.setProductCount(productCount == null ? 0L : productCount);
        dto.setCreatedAt(category.getCreatedAt());
        dto.setUpdatedAt(category.getUpdatedAt());
        if (!includeParent) {
            dto.setSubcategories(Collections.emptyList());
        }
        return dto;
    }

    private String slugify(String value) {
        if (!StringUtils.hasText(value)) {
            throw new ResponseStatusException(BAD_REQUEST, "Slug обязателен");
        }
        String trimmed = value.trim();
        String normalized = Normalizer.normalize(trimmed, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String slug = normalized.toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{IsAlnum}-]+", "-")
                .replaceAll("-{2,}", "-")
                .replaceAll("^-|-$", "");
        if (!StringUtils.hasText(slug)) {
            throw new ResponseStatusException(BAD_REQUEST, "Не удалось сформировать slug");
        }
        return slug;
    }
}
