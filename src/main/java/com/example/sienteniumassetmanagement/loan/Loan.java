package com.example.sienteniumassetmanagement.loan;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.chrono.ChronoLocalDate;


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
    private long  assetId;

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "user_id", nullable = false)
    private long userId;

    @Column(name = "request_date")
    private LocalDate    requestDate;


    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private LoanStatus status;

    // Only set when status == APPROVED
    private LocalDate checkoutDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "return_date")
    private LocalDate returnDate;



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

    public void returnLoan(LocalDate returnDate) {
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
        return LocalDateTime.now().isAfter(dueDate.atStartOfDay());
    }

    // ----- Optional setters for mutable fields (if needed) -----
    public void setDueDate(LocalDate dueDate) {
        if (dueDate == null) {
            throw new IllegalArgumentException("Due date cannot be null");
        }
        if (dueDate.isBefore(ChronoLocalDate.from(requestDate.atStartOfDay()))) {
            throw new IllegalArgumentException("Due date cannot be before request date");
        }
        this.dueDate = dueDate;
    }



}
