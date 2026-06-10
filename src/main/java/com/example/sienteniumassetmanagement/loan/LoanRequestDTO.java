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
public class LoanRequestDTO {
    private Long assetId;
    private Long userId;
    private LocalDateTime dueDate;
}
