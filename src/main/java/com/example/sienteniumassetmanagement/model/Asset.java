package com.example.sienteniumassetmanagement.model;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Setter
@Getter
@Entity
@Table(name = "asset")
public class Asset {
    // Primary Key
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long assetId;

    private String title;
    private String category;
    private String serialNumber;
    private LocalDate acquisitionDate;
    private BigDecimal cost;
    private String location;
    private String condition;
    private String photoPath;
    private String status; // available / loaned / retired

    // Constructors
    public Asset() {}

    public Asset(String title, String category, String serialNumber, LocalDate acquisitionDate,
                 BigDecimal cost, String location, String condition, String photoPath, String status) {
        this.title = title;
        this.category = category;
        this.serialNumber = serialNumber;
        this.acquisitionDate = acquisitionDate;
        this.cost = cost;
        this.location = location;
        this.condition = condition;
        this.photoPath = photoPath;
        this.status = status;
    }

}
