package autoparts.kz.modules.news.mapper;

import autoparts.kz.modules.news.dto.NewsRequestDto;
import autoparts.kz.modules.news.dto.NewsResponseDto;
import autoparts.kz.modules.news.entity.News;

public final class NewsMapper {

    private NewsMapper() {
    }

    public static News toEntity(NewsRequestDto dto) {
        News news = new News();
        updateEntity(dto, news);
        return news;
    }

    public static void updateEntity(NewsRequestDto dto, News target) {
        target.setTitle(normalizeRequired(dto.getTitle()));
        target.setDescription(normalizeOptional(dto.getDescription()));
        target.setCoverImageUrl(normalizeOptional(dto.getCoverImageUrl()));
        target.setContent(normalizeRequired(dto.getContent()));
        target.setPublished(dto.isPublished());
    }

    public static NewsResponseDto toResponse(News entity) {
        NewsResponseDto dto = new NewsResponseDto();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setCoverImageUrl(entity.getCoverImageUrl());
        dto.setContent(entity.getContent());
        dto.setPublished(entity.isPublished());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    private static String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String normalizeRequired(String value) {
        return value == null ? null : value.trim();
    }
}
