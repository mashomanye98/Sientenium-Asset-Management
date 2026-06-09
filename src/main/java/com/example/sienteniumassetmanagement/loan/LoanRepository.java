package com.example.sienteniumassetmanagement.loan;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByUserId(Long userId);
    List<Loan> findByAssetId(Long assetId);
    List<Loan> findByStatus(String status);

    @Query("SELECT l FROM Loan l WHERE l.status = 'approved' AND l.returnDate IS NULL AND l.dueDate < :now")
    List<Loan> findOverdueLoans(@Param("now") LocalDateTime now);

    @Query("SELECT l FROM Loan l WHERE l.userId = :userId AND l.status = :status")
    List<Loan> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);
}
