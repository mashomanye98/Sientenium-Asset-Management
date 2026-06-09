package com.example.sienteniumassetmanagement.loan;


import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LoanResponseDTO> createLoan(@RequestBody LoanRequestDTO requestDTO) {
        LoanResponseDTO loan = loanService.createLoan(requestDTO);
        return new ResponseEntity<>(loan, HttpStatus.CREATED);
    }

    @PutMapping("/{loanId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LoanResponseDTO> approveLoan(@PathVariable Long loanId) {
        LoanResponseDTO loan = loanService.approveLoan(loanId);
        return ResponseEntity.ok(loan);
    }

    @PutMapping("/{loanId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LoanResponseDTO> rejectLoan(@PathVariable Long loanId) {
        LoanResponseDTO loan = loanService.rejectLoan(loanId);
        return ResponseEntity.ok(loan);
    }

    @GetMapping("/{loanId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LoanResponseDTO> getLoanById(@PathVariable Long loanId) {
        LoanResponseDTO loan = loanService.getLoanById(loanId);
        return ResponseEntity.ok(loan);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<LoanResponseDTO>> getAllLoans() {
        List<LoanResponseDTO> loans = loanService.getAllLoans();
        return ResponseEntity.ok(loans);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<LoanResponseDTO>> getLoansByUser(@PathVariable Long userId) {
        // Add additional check: user can only view their own loans unless they're ADMIN
        List<LoanResponseDTO> loans = loanService.getLoansByUser(userId);
        return ResponseEntity.ok(loans);
    }

    @DeleteMapping("/{loanId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteLoan(@PathVariable Long loanId) {
        loanService.deleteLoan(loanId);
        return ResponseEntity.noContent().build();
    }
}

