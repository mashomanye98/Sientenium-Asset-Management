package com.example.sienteniumassetmanagement.loan;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {

    List<Loan> findByUserId(Long userId);

    List<Loan> findByAssetId(Long assetId);

    List<Loan> findByStatus(Loan.LoanStatus status);

    List<Loan> findByStatusAndDueDateBefore(Loan.LoanStatus status, LocalDate date);

}
