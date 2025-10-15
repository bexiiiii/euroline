package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Model Series DTO from UMAPI
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ModelSeriesDto {

    /**
     * Model ID
     */
    @JsonProperty("modelId")
    private Long id;

    /**
     * Model name
     */
    @JsonProperty("modelName")
    private String name;

    /**
     * Manufacturer ID
     */
    @JsonProperty("manuId")
    private Long manufacturerId;

    /**
     * Manufacturer name
     */
    @JsonProperty("manuName")
    private String manufacturerName;

    /**
     * Year from
     */
    @JsonProperty("yearOfConstrFrom")
    private Integer yearFrom;

    /**
     * Year to
     */
    @JsonProperty("yearOfConstrTo")
    private Integer yearTo;
}
