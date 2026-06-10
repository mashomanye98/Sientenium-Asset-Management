package com.example.sienteniumassetmanagement.loan;

import com.example.sienteniumassetmanagement.User.entity.User;
import com.example.sienteniumassetmanagement.User.repository.UserRepository;
import com.example.sienteniumassetmanagement.asset.Asset;
import com.example.sienteniumassetmanagement.asset.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    public LoanResponseDTO createLoan(LoanRequestDTO requestDTO) {
        Asset asset = assetRepository.findById(requestDTO.getAssetId())
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        User user = userRepository.findById(requestDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Loan loan = new Loan();
        loan.setAssetId(requestDTO.getAssetId());
        loan.setUserId(requestDTO.getUserId());
        loan.setRequestDate(LocalDateTime.now());
        // FIXED: Changed "Loan.LoanStatus.PENDING" to "LoanStatus.PENDING"
        loan.setStatus(Loan.LoanStatus.PENDING);
        loan.setDueDate(requestDTO.getDueDate());

        Loan savedLoan = loanRepository.save(loan);
        return convertToDTO(savedLoan);
    }

    public LoanResponseDTO approveLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        // FIXED: Changed "Loan.LoanStatus.APPROVED" to "LoanStatus.APPROVED"
        loan.setStatus(Loan.LoanStatus.APPROVED);
        loan.setCheckoutDate(LocalDateTime.now());
        Loan updatedLoan = loanRepository.save(loan);
        return convertToDTO(updatedLoan);
    }

    public LoanResponseDTO rejectLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        // FIXED: Changed "Loan.LoanStatus.REJECTED" to "LoanStatus.REJECTED"
        loan.setStatus(Loan.LoanStatus.REJECTED);
        Loan updatedLoan = loanRepository.save(loan);
        return convertToDTO(updatedLoan);
    }

    public LoanResponseDTO returnLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        // FIXED: Changed "Loan.LoanStatus.RETURNED" to "LoanStatus.RETURNED"
        loan.setStatus(Loan.LoanStatus.RETURNED);
        loan.setReturnDate(LocalDateTime.now());
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

//    public List<LoanResponseDTO> getLoansByStatus(LoanStatus status) {
//        // FIXED: Changed parameter from String to LoanStatus
//        return loanRepository.findByStatus(String.valueOf(status)).stream()
//                .map(this::convertToDTO)
//                .collect(Collectors.toList());
//    }
//
//    public List<LoanResponseDTO> getOverdueLoans() {
//        // FIXED: Changed "APPROVED" to LoanStatus.APPROVED
//        return loanRepository.findByStatusAndDueDateBefore(LoanStatus.APPROVED, LocalDateTime.now()).stream()
//                .map(this::convertToDTO)
//                .collect(Collectors.toList());
//    }

    public void deleteLoan(Long loanId) {
        loanRepository.deleteById(loanId);
    }

    private LoanResponseDTO convertToDTO(Loan loan) {
        LoanResponseDTO dto = new LoanResponseDTO();
        dto.setLoanId(loan.getLoanId());
        dto.setUserId(loan.getUserId());
        dto.setRequestDate(loan.getRequestDate());
        dto.setStatus(String.valueOf(loan.getStatus()));
        dto.setCheckoutDate(loan.getCheckoutDate());
        dto.setDueDate(loan.getDueDate());
        dto.setReturnDate(loan.getReturnDate());
        dto.setIsOverdue(loan.isOverdue());  // FIXED: Added this line
        return dto;
    }
}