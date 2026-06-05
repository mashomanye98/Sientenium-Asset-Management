package com.example.sienteniumassetmanagement.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
/*Mashomanye  Masemola

 */
@Setter
@Getter
@Entity
@Table(name = "loan")
public class Loan {
    // Getters and Setters
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long loanId;

   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "asset_id")
    private Asset asset;

   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "user_id")
    private User user;

    private LocalDateTime requestDate;
    private String status; // pending/approved/rejected
    private LocalDateTime checkoutDate;
    private LocalDateTime dueDate;
    private LocalDateTime returnDate;

    // Constructors
    public Loan() {}

    public Loan(Asset assetId, User userId, LocalDateTime requestDate, String status,
                LocalDateTime dueDate) {
        this.asset = assetId;
        this.user = userId;
        this.requestDate = requestDate;
        this.status = status;
        this.dueDate = dueDate;
    }

}
