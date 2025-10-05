package autoparts.kz.modules.news.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class NewsResponseDto {
    private Long id;
    private String title;
    private String description;
    private String coverImageUrl;
    private String content;
    private boolean published;
    private Instant createdAt;
    private Instant updatedAt;
}