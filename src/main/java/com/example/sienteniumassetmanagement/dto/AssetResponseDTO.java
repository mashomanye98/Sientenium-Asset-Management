/*Hlongwane Sinenhlanhla*/
package com.example.sienteniumassetmanagement.dto;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.*;

@Getter
@Setter
public class AssetResponseDTO {

    private Long assetId;
    private String title;
    private String category;
    private String serialNumber;
    private LocalDate acquisitionDate;
    private BigDecimal cost;
    private String location;
    private String condition;
    private String photoPath;
    private String status;

}