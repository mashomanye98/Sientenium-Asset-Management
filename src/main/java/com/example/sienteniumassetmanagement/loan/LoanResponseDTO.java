package com.example.sienteniumassetmanagement.loan;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoanResponseDTO {
    private Long loanId;
    private Long assetId;
    private String assetName;        // NEW: Asset name
    private String assetCategory;    // NEW: Asset category
    private Long userId;
    private String userName;         // NEW: User full name
    private String userDepartment;   // NEW: User department
    private LocalDateTime requestDate;
    private String status;
    private LocalDateTime checkoutDate;
    private LocalDateTime dueDate;
    private LocalDateTime returnDate;
}