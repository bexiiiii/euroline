package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Manufacturer (Brand) DTO from UMAPI v2 autocatalog /Manufacturers.
 * Reads UMAPI field names via @JsonAlias, serializes to our camelCase names.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ManufacturerDto {

    @JsonAlias("MFA_ID")
    private Long id;

    @JsonAlias("MANUFACTURER")
    private String name;

    @JsonAlias("MANUFACTURER_RU")
    private String nameRu;

    @JsonAlias("COUNTRY")
    private String country;

    /**
     * Comma-separated UMAPI vehicle types, e.g. "Engine,PC"
     */
    @JsonAlias("TYPE")
    private String types;

    @JsonAlias("IS_LOGO")
    private Integer hasLogo;
}
