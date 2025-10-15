package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Vehicle Modification DTO from UMAPI (Passenger cars, Commercial vehicles, Motorbikes)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ModificationDto {

    /**
     * Modification ID
     */
    @JsonProperty("carId")
    private Long id;

    /**
     * Modification name/description
     */
    @JsonProperty("carName")
    private String name;

    /**
     * Model ID
     */
    @JsonProperty("modelId")
    private Long modelId;

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

    /**
     * Engine capacity (cc)
     */
    @JsonProperty("capacityCC")
    private Integer engineCapacity;

    /**
     * Engine power (kW)
     */
    @JsonProperty("powerKW")
    private Integer powerKw;

    /**
     * Engine power (HP)
     */
    @JsonProperty("powerHP")
    private Integer powerHp;

    /**
     * Fuel type
     */
    @JsonProperty("fuelType")
    private String fuelType;

    /**
     * Engine code
     */
    @JsonProperty("engineCode")
    private String engineCode;

    /**
     * Body type
     */
    @JsonProperty("bodyType")
    private String bodyType;

    /**
     * Drive type (FWD, RWD, AWD)
     */
    @JsonProperty("driveType")
    private String driveType;
}
