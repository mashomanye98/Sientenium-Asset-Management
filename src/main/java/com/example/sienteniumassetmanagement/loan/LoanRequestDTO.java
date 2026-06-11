package com.example.sienteniumassetmanagement.loan;

import com.example.sienteniumassetmanagement.User.entity.User;
import com.example.sienteniumassetmanagement.asset.Asset;
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
    private Long loanId;
    private Long assetId;
    private Long userId;
    private LocalDateTime requestDate;
    private String status;
    private LocalDateTime checkoutDate;
    private LocalDateTime dueDate;
    private LocalDateTime returnDate;
}
