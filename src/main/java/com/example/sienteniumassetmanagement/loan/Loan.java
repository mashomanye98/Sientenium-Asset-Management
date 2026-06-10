package com.example.sienteniumassetmanagement.loan;

import com.example.sienteniumassetmanagement.User.entity.User;
import com.example.sienteniumassetmanagement.asset.Asset;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Entity
@Table(name = "loan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Loan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "loan_id")
    private Long loanId;

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "asset_id", nullable = false)
    private Long assetId;

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "request_date", nullable = false)
    private LocalDateTime requestDate;


    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private LoanStatus status;

    // Only set when status == APPROVED
    private LocalDateTime checkoutDate;

    @Column(name = "due_date", nullable = false)
    private LocalDateTime dueDate;

    @Column(name = "return_date", nullable = false)
    private LocalDateTime returnDate;




    // ----- Nested Enum for Status -----
    public enum LoanStatus {
        PENDING, APPROVED, REJECTED, RETURNED
    }
    // ----

    // ----- Business logic helpers -----
    public void approve() {
        if (this.status != LoanStatus.PENDING) {
            throw new IllegalStateException("Only pending loans can be approved");
        }
        if (checkoutDate == null) {
            throw new IllegalArgumentException("Checkout date must be provided");
        }
        this.status = LoanStatus.APPROVED;
        this.checkoutDate = checkoutDate;
    }

    public void reject() {
        if (this.status != LoanStatus.PENDING) {
            throw new IllegalStateException("Only pending loans can be rejected");
        }
        this.status = LoanStatus.REJECTED;
    }

    public void returnLoan(LocalDateTime returnDate) {
        if (this.status != LoanStatus.APPROVED) {
            throw new IllegalStateException("Only approved loans can be returned");
        }
        if (returnDate == null) {
            throw new IllegalArgumentException("Return date must be provided");
        }
        this.status = LoanStatus.RETURNED;
        this.returnDate = returnDate;
    }
    public boolean isOverdue() {
        if (status.equals(LoanStatus.RETURNED)) return false;
        return LocalDateTime.now().isAfter(dueDate);
    }

    // ----- Optional setters for mutable fields (if needed) -----
    public void setDueDate(LocalDateTime dueDate) {
        if (dueDate == null) {
            throw new IllegalArgumentException("Due date cannot be null");
        }
        if (dueDate.isBefore(requestDate)) {
            throw new IllegalArgumentException("Due date cannot be before request date");
        }
        this.dueDate = dueDate;
    }



}
