package autoparts.kz.modules.news.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NewsRequestDto {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be at most 255 characters")
    private String title;

    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;

    @Size(max = 2048, message = "Cover image URL must be at most 2048 characters")
    private String coverImageUrl;

    @NotBlank(message = "Content is required")
    private String content;

    @JsonAlias("isPublished")
    private boolean published;
}
