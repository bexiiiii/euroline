package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Manufacturer (Brand) DTO from UMAPI
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManufacturerDto {

    /**
     * Manufacturer ID
     */
    @JsonProperty("manuId")
    private Long id;

    /**
     * Manufacturer name
     */
    @JsonProperty("manuName")
    private String name;

    /**
     * Vehicle type (e.g., "P" - Passenger, "C" - Commercial, "M" - Motorbike)
     */
    @JsonProperty("linkingTargetType")
    private String vehicleType;
}
