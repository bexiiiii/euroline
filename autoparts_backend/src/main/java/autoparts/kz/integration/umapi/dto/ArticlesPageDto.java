package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Page of /Articles results, same shape as UMAPI: {"rows", "limit", "offset", "data": [...], "filtrs": [...]}; filters are dropped.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ArticlesPageDto {

    private Long rows;

    private Integer limit;

    private Long offset;

    private List<ArticleDto> data;
}
