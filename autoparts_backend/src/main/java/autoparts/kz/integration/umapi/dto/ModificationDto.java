package autoparts.kz.integration.umapi.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Vehicle modification DTO from UMAPI v2 autocatalog:
 * /Passangers (PC_ID), /CommercialVehicles (CV_ID), /Motorbikes (MTB_ID).
 * Numeric technical values come as strings like "150.0000" for passenger cars.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ModificationDto {

    @JsonAlias({"PC_ID", "CV_ID", "MTB_ID"})
    private Long id;

    @JsonAlias({"PASSENGER_CAR", "COMMERCIAL_VEHICLE", "MOTORBIKE"})
    private String name;

    @JsonAlias("MS_ID")
    private Long modelId;

    @JsonAlias("MODEL_SERIES")
    private String modelName;

    @JsonAlias("MFA_ID")
    private Long manufacturerId;

    @JsonAlias("MANUFACTURER")
    private String manufacturerName;

    @JsonAlias("CI_FROM")
    private String dateFrom;

    @JsonAlias("CI_TO")
    private String dateTo;

    /**
     * Engine capacity, cc
     */
    @JsonAlias("CAPACITY_TECH")
    private String capacityCc;

    /**
     * Engine capacity, liters
     */
    @JsonAlias("CAPACITY_LT")
    private String capacityLt;

    @JsonAlias({"POWER_KW", "POWER_KW_START"})
    private String powerKw;

    @JsonAlias({"POWER_PS", "POWER_PS_START"})
    private String powerHp;

    @JsonAlias("FUEL_TYPE")
    private String fuelType;

    @JsonAlias("ENGINE_TYPE")
    private String engineType;

    @JsonAlias("BODY_TYPE")
    private String bodyType;

    @JsonAlias({"DRIVE_TYPE", "FUEL_DRIVE_TYPE"})
    private String driveType;

    @JsonAlias("TYPE")
    private String types;
}
