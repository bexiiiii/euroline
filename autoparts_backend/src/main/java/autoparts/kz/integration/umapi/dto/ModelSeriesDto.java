package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Model series DTO from UMAPI v2 autocatalog /ModelSeries.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ModelSeriesDto {

    @JsonAlias("MS_ID")
    private Long id;

    @JsonAlias("MODEL_SERIES")
    private String name;

    @JsonAlias("MFA_ID")
    private Long manufacturerId;

    @JsonAlias("MANUFACTURER")
    private String manufacturerName;

    /**
     * Production start, yyyy-MM-dd
     */
    @JsonAlias("CI_FROM")
    private String dateFrom;

    /**
     * Production end, yyyy-MM-dd (empty while still produced)
     */
    @JsonAlias("CI_TO")
    private String dateTo;

    @JsonAlias("TYPE")
    private String types;
}
