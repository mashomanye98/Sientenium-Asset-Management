package com.example.sienteniumassetmanagement.loan;

import org.apache.catalina.User;
import org.hibernate.query.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.awt.print.Pageable;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {

    List<Loan> findByUserId(Long userId);

    List<Loan> findByAssetId(Long assetId);

//    List<Loan> findByStatus(String status);

    List<Loan> findByStatus(Loan.LoanStatus status);

    List<Loan> findByStatusAndDueDateBefore(String status, LocalDateTime date);

}
