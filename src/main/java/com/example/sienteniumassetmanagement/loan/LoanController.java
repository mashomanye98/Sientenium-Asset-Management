package com.example.sienteniumassetmanagement.loan;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/loans", "/api/loans"})
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    // CREATE LOAN
    @PostMapping
    public ResponseEntity<LoanResponseDTO> createLoan(@Valid @RequestBody LoanRequestDTO requestDTO) {
        LoanResponseDTO loan = loanService.createLoan(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(loan);
    }

    @GetMapping("/approved")
    public ResponseEntity<List<LoanResponseDTO>> getApprovedLoans() {
        return ResponseEntity.ok(loanService.getApprovedLoans());
    }

    @GetMapping("/rejected")
    public ResponseEntity<List<LoanResponseDTO>> getRejectedLoans() {
        return ResponseEntity.ok(loanService.getRejectedLoans());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<LoanResponseDTO>> getPendingLoans() {
        return ResponseEntity.ok(loanService.getPendingLoans());
    }

    // GET OVERDUE LOANS
    @GetMapping("/overdue")
    public ResponseEntity<List<LoanResponseDTO>> getOverdueLoans() {
        return ResponseEntity.ok(loanService.getOverdueLoans());
    }

    // APPROVE LOAN
    @PutMapping("/{loanId}/approve")
    public ResponseEntity<LoanResponseDTO> approveLoan(@PathVariable Long loanId) {
        return ResponseEntity.ok(loanService.approveLoan(loanId));
    }

    // REJECT LOAN
    @PutMapping("/{loanId}/reject")
    public ResponseEntity<LoanResponseDTO> rejectLoan(@PathVariable Long loanId) {
        return ResponseEntity.ok(loanService.rejectLoan(loanId));
    }

    // 🔥 ADD THIS - RETURN LOAN
    @PutMapping("/{loanId}/return")
    public ResponseEntity<LoanResponseDTO> returnLoan(@PathVariable Long loanId) {
        return ResponseEntity.ok(loanService.returnLoan(loanId));
    }

    // GET SINGLE LOAN
    @GetMapping("/{loanId}")
    public ResponseEntity<LoanResponseDTO> getLoanById(@PathVariable Long loanId) {
        return ResponseEntity.ok(loanService.getLoanById(loanId));
    }

    // GET ALL LOANS
    @GetMapping
    public ResponseEntity<List<LoanResponseDTO>> getAllLoans() {
        return ResponseEntity.ok(loanService.getAllLoans());
    }

    // GET USER LOANS
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<LoanResponseDTO>> getLoansByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(loanService.getLoansByUser(userId));
    }

    // DELETE LOAN
    @DeleteMapping("/{loanId}")
    public ResponseEntity<Void> deleteLoan(@PathVariable Long loanId) {
        loanService.deleteLoan(loanId);
        return ResponseEntity.noContent().build();
    }
}
