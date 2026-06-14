package com.example.sienteniumassetmanagement.loan;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.Objects;

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

    // Keep FK columns as Long. Replace with @ManyToOne if you want full entity relations.
    @Column(name = "asset_id", nullable = false)
    private Long assetId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "request_date")
    private LocalDate requestDate;


    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private LoanStatus status = LoanStatus.PENDING;

    // Only set when status == APPROVED
    @Column(name = "checkout_date")
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
    /**
     * Approve the loan providing a checkout date and optional due date.
     */
    public void approve(@NotNull LocalDate checkoutDate, LocalDate dueDate) {
        if (this.status != LoanStatus.PENDING) {
            throw new IllegalStateException("Only pending loans can be approved");
        }
        Objects.requireNonNull(checkoutDate, "Checkout date must be provided");
        if (requestDate != null && checkoutDate.isBefore(requestDate)) {
            throw new IllegalArgumentException("Checkout date cannot be before request date");
        }
        if (dueDate != null) {
            if (dueDate.isBefore(checkoutDate)) {
                throw new IllegalArgumentException("Due date cannot be before checkout date");
            }
            if (requestDate != null && dueDate.isBefore(requestDate)) {
                throw new IllegalArgumentException("Due date cannot be before request date");
            }
            this.dueDate = dueDate;
        }
        this.checkoutDate = checkoutDate;
        this.status = LoanStatus.APPROVED;
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
        Objects.requireNonNull(returnDate, "Return date must be provided");
        if (checkoutDate != null && returnDate.isBefore(checkoutDate)) {
            throw new IllegalArgumentException("Return date cannot be before checkout date");
        }
        this.returnDate = returnDate;
        this.status = LoanStatus.RETURNED;
    }

    public boolean isOverdue() {
        if (this.status == null || this.status == LoanStatus.RETURNED) return false;
        if (this.dueDate == null) return false;
        return LocalDate.now().isAfter(this.dueDate);
    }

    // ----- Optional setters for mutable fields (if needed) -----
    public void setDueDate(LocalDate dueDate) {
        if (dueDate == null) {
            throw new IllegalArgumentException("Due date cannot be null");
        }
        if (requestDate == null) {
            throw new IllegalStateException("Request date must be set before setting due date");
        }
        if (dueDate.isBefore(requestDate)) {
            throw new IllegalArgumentException("Due date cannot be before request date");
        }
        this.dueDate = dueDate;
    }

}
