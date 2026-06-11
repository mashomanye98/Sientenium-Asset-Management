/*Hlongwane Sinenhlanhla*/
package com.example.sienteniumassetmanagement.asset;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class AssetRequestDTO {

    @NotBlank(message = "Title is required!")
    private String title;

    @NotBlank(message = "Category is required!")
    @Pattern(
            regexp = "IT_EQUIPMENT|FURNITURE|VEHICLE|MACHINERY|OTHER",
            message = "Category must be one of: IT_EQUIPMENT, FURNITURE, VEHICLE, MACHINERY, OTHER"
    )
    private String category;

    @NotBlank(message = "Serial number is required!")
    private String serialNumber;

    @NotNull(message = "Acquisition date is required!")
    @PastOrPresent(message = "Acquisition date cannot be in the future")
    private LocalDate acquisitionDate;

    @NotNull(message = "Cost is required!")
    @DecimalMin(value = "0.0", inclusive = false, message = "Cost must be greater than 0")
    private BigDecimal cost;

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Condition is required!")
    @Pattern(
            regexp = "NEW|GOOD|FAIR|POOR|DAMAGED",
            message = "Condition must be one of: NEW, GOOD, FAIR, POOR, DAMAGED"
    )
    private String condition;

    private String photoPath;
}
