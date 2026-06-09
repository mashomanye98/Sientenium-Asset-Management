//package com.example.sienteniumassetmanagement.loan;
//
//import com.example.sienteniumassetmanagement.asset.Asset;
//import com.example.sienteniumassetmanagement.user.User;
//import jakarta.persistence.*;
//import lombok.*;
//import org.springframework.data.annotation.CreatedDate;
//import org.springframework.data.annotation.LastModifiedDate;
//
//import java.time.LocalDateTime;
//
//@Entity
//@Table(name = "loan",
//        indexes = {
//                @Index(name = "idx_loan_status", columnList = "status"),
//                @Index(name = "idx_loan_due_date", columnList = "due_date"),
//                @Index(name = "idx_loan_user_id", columnList = "user_id"),
//                @Index(name = "idx_loan_asset_id", columnList = "asset_id")
//        })
//@Getter
//@Setter
//@NoArgsConstructor
//@AllArgsConstructor
//public class Loan {
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    @Column(name = "loan_id")
//    private Long loanId;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "asset_id", nullable = false)
//    private Asset asset;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "user_id", nullable = false)
//    private User user;
//
//    @Column(name = "request_date", nullable = false)
//    private LocalDateTime requestDate;
//
//
//    @Enumerated(EnumType.STRING)
//    @Column(name = "status", nullable = false, length = 20)
//    private LoanStatus status;
//
//    // Only set when status == APPROVED
//    private LocalDateTime checkoutDate;
//
//    @Column(name = "due_date", nullable = false)
//    private LocalDateTime dueDate;
//
//    // Only set when status == RETURNED
//    private LocalDateTime returnDate;
//
//    // Auditing fields (requires @EnableJpaAuditing)
//    @CreatedDate
//    @Column(updatable = false)
//    private LocalDateTime createdAt;
//
//    @LastModifiedDate
//    private LocalDateTime updatedAt;
//
//
//
//    // ----- Nested Enum for Status -----
//    public enum LoanStatus {
//        PENDING, APPROVED, REJECTED, RETURNED
//    }
//    // ----
//
//    // ----- Business logic helpers -----
//    public void approve(LocalDateTime checkoutDate) {
//        if (this.status != LoanStatus.PENDING) {
//            throw new IllegalStateException("Only pending loans can be approved");
//        }
//        if (checkoutDate == null) {
//            throw new IllegalArgumentException("Checkout date must be provided");
//        }
//        this.status = LoanStatus.APPROVED;
//        this.checkoutDate = checkoutDate;
//    }
//
//    public void reject() {
//        if (this.status != LoanStatus.PENDING) {
//            throw new IllegalStateException("Only pending loans can be rejected");
//        }
//        this.status = LoanStatus.REJECTED;
//    }
//
//    public void returnLoan(LocalDateTime returnDate) {
//        if (this.status != LoanStatus.APPROVED) {
//            throw new IllegalStateException("Only approved loans can be returned");
//        }
//        if (returnDate == null) {
//            throw new IllegalArgumentException("Return date must be provided");
//        }
//        this.status = LoanStatus.RETURNED;
//        this.returnDate = returnDate;
//    }
//
//    // ----- Optional setters for mutable fields (if needed) -----
//    public void setDueDate(LocalDateTime dueDate) {
//        if (dueDate == null) {
//            throw new IllegalArgumentException("Due date cannot be null");
//        }
//        if (dueDate.isBefore(requestDate)) {
//            throw new IllegalArgumentException("Due date cannot be before request date");
//        }
//        this.dueDate = dueDate;
//    }
//
//
//
//}
