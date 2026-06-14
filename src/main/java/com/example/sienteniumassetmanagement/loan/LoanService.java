package com.example.sienteniumassetmanagement.loan;

import com.example.sienteniumassetmanagement.User.entity.User;
import com.example.sienteniumassetmanagement.User.repository.UserRepository;
import com.example.sienteniumassetmanagement.asset.Asset;
import com.example.sienteniumassetmanagement.asset.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.server.ResponseStatusException;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    @Transactional
    public LoanResponseDTO createLoan(LoanRequestDTO requestDTO) {
        Asset asset = assetRepository.findById(requestDTO.getAssetId())
                .orElseThrow(() -> new EntityNotFoundException("Asset not found"));

        User user = userRepository.findById(requestDTO.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        LocalDate reqDate = requestDTO.getRequestDate() != null
                ? requestDTO.getRequestDate().toLocalDate() : LocalDate.now();

        Loan loan = new Loan();
        loan.setAssetId(requestDTO.getAssetId());
        loan.setUserId(requestDTO.getUserId());
        loan.setRequestDate(reqDate);
        loan.setStatus(Loan.LoanStatus.PENDING);

        if (requestDTO.getDueDate() != null) {
            LocalDate due = requestDTO.getDueDate().toLocalDate();
            if (due.isBefore(reqDate)) {
                throw new IllegalArgumentException("Due date cannot be before request date");
            }
            loan.setDueDate(due);
        }

        Loan savedLoan = loanRepository.save(loan);
        return convertToDTO(savedLoan);
    }

    public LoanResponseDTO approveLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        // Use business method which validates dates and state
        loan.approve(LocalDate.now(), loan.getDueDate());
        Loan updatedLoan = loanRepository.save(loan);
        return convertToDTO(updatedLoan);
    }

    public LoanResponseDTO rejectLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        loan.reject();
        Loan updatedLoan = loanRepository.save(loan);
        return convertToDTO(updatedLoan);
    }

    public LoanResponseDTO returnLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        loan.returnLoan(LocalDate.now());
        Loan updatedLoan = loanRepository.save(loan);
        return convertToDTO(updatedLoan);
    }

    public LoanResponseDTO getLoanById(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));
        return convertToDTO(loan);
    }

    public List<LoanResponseDTO> getAllLoans() {
        return loanRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<LoanResponseDTO> getLoansByUser(Long userId) {
        return loanRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<LoanResponseDTO> getOverdueLoans() {
        return loanRepository.findByStatusAndDueDateBefore(Loan.LoanStatus.APPROVED, LocalDate.now()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<LoanResponseDTO> getApprovedLoans() {
        return loanRepository.findByStatus(Loan.LoanStatus.APPROVED)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<LoanResponseDTO> getRejectedLoans() {
        return loanRepository.findByStatus(Loan.LoanStatus.REJECTED)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<LoanResponseDTO> getPendingLoans() {
        return loanRepository.findByStatus(Loan.LoanStatus.PENDING)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public void deleteLoan(Long loanId) {
        loanRepository.deleteById(loanId);
    }

    private LoanResponseDTO convertToDTO(Loan loan) {
        LoanResponseDTO dto = new LoanResponseDTO();
        dto.setLoanId(loan.getLoanId());
        dto.setAssetId(loan.getAssetId());
        dto.setUserId(loan.getUserId());
        dto.setRequestDate(loan.getRequestDate() != null ? loan.getRequestDate().atStartOfDay() : null);
        dto.setStatus(loan.getStatus() != null ? String.valueOf(loan.getStatus()) : null);
        dto.setCheckoutDate(loan.getCheckoutDate() != null ? loan.getCheckoutDate().atStartOfDay() : null);
        dto.setDueDate(loan.getDueDate() != null ? loan.getDueDate().atStartOfDay() : null);
        dto.setReturnDate(loan.getReturnDate() != null ? loan.getReturnDate().atStartOfDay() : null);
        return dto;
    }
}
