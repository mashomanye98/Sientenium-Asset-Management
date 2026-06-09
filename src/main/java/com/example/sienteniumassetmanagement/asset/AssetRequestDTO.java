/*Hlongwane Sinenhlanhla*/
package com.example.sienteniumassetmanagement.asset;

import jakarta.validation.constraints.*;

import java.math.*;
import java.time.*;
import lombok.*;

@Getter
@Setter
public class AssetRequestDTO {

    @NotBlank
    private String title;

    @NotBlank
    private String category;

    @NotBlank
    private String serialNumber;

    private LocalDate acquisitionDate;
    private BigDecimal cost;
    private String location;
    private String condition;
    private String photoPath;

}
