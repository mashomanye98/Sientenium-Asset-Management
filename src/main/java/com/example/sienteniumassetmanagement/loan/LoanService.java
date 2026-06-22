package com.example.sienteniumassetmanagement.loan;

import com.example.sienteniumassetmanagement.User.entity.User;
import com.example.sienteniumassetmanagement.User.repository.UserRepository;
import com.example.sienteniumassetmanagement.asset.Asset;
import com.example.sienteniumassetmanagement.asset.AssetRepository;
import com.example.sienteniumassetmanagement.auditlog.AuditLog;
import com.example.sienteniumassetmanagement.auditlog.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final AuditLogService auditLogService;

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




        // Record: staff member requested a loan
        auditLogService.recordAction(
                requestDTO.getUserId(),
                AuditLog.EntityType.LOAN,
                savedLoan.getLoanId(),
                AuditLog.Action.REQUEST
        );

        return convertToDTO(savedLoan);
    }

    @Transactional
    public LoanResponseDTO approveLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        loan.approve(LocalDate.now(), loan.getDueDate());
        Loan updatedLoan = loanRepository.save(loan);

        // Record: admin/manager approved the loan
        auditLogService.recordAction(
                loan.getUserId(),
                AuditLog.EntityType.LOAN,
                loanId,
                AuditLog.Action.APPROVE
        );

        return convertToDTO(updatedLoan);
    }

    @Transactional
    public LoanResponseDTO rejectLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        loan.reject();
        Loan updatedLoan = loanRepository.save(loan);

        // Record: admin/manager rejected the loan
        auditLogService.recordAction(
                loan.getUserId(),
                AuditLog.EntityType.LOAN,
                loanId,
                AuditLog.Action.REJECT
        );

        return convertToDTO(updatedLoan);
    }

    // 🔥 ADD THIS METHOD IF MISSING
    @Transactional
    public LoanResponseDTO returnLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found with id: " + loanId));

        loan.returnLoan(LocalDate.now());
        Loan updatedLoan = loanRepository.save(loan);


        // Record: asset returned
        auditLogService.recordAction(
                loan.getUserId(),
                AuditLog.EntityType.LOAN,
                loanId,
                AuditLog.Action.CHECK_IN
        );

        return convertToDTO(updatedLoan);
    }

    @Transactional(readOnly = true)
    public LoanResponseDTO getLoanById(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));
        return convertToDTO(loan);
    }

    @Transactional(readOnly = true)
    public List<LoanResponseDTO> getAllLoans() {
        return loanRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LoanResponseDTO> getLoansByUser(Long userId) {
        return loanRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LoanResponseDTO> getOverdueLoans() {
        return loanRepository.findByStatusAndDueDateBefore(Loan.LoanStatus.APPROVED, LocalDate.now()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LoanResponseDTO> getApprovedLoans() {
        return loanRepository.findByStatus(Loan.LoanStatus.APPROVED)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LoanResponseDTO> getRejectedLoans() {
        return loanRepository.findByStatus(Loan.LoanStatus.REJECTED)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LoanResponseDTO> getPendingLoans() {
        return loanRepository.findByStatus(Loan.LoanStatus.PENDING)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));
        //loanRepository.deleteById(loanId);

        // Record: loan deleted
        auditLogService.recordAction(
                loan.getUserId(),
                AuditLog.EntityType.LOAN,
                loanId,
                AuditLog.Action.DELETE
        );

        loanRepository.deleteById(loanId);
    }

    private LoanResponseDTO convertToDTO(Loan loan) {
        // Fetch asset details
        String assetName = "N/A";
        String assetCategory = "N/A";
        try {
            Asset asset = assetRepository.findById(loan.getAssetId())
                    .orElse(null);
            if (asset != null) {
                assetName = asset.getTitle();
                assetCategory = asset.getCategory() != null ? asset.getCategory().name() : "N/A";
            }
        } catch (Exception e) {
            // Asset not found, keep defaults
        }

        // Fetch user details
        String userName = "N/A";
        String userDepartment = "N/A";
        try {
            User user = userRepository.findById(loan.getUserId())
                    .orElse(null);
            if (user != null) {
                userName = user.getFullName();
                userDepartment = user.getDepartment();
            }
        } catch (Exception e) {
            // User not found, keep defaults
        }

        LoanResponseDTO dto = new LoanResponseDTO();
        dto.setLoanId(loan.getLoanId());
        dto.setAssetId(loan.getAssetId());
        dto.setAssetName(assetName);
        dto.setAssetCategory(assetCategory);
        dto.setUserId(loan.getUserId());
        dto.setUserName(userName);
        dto.setUserDepartment(userDepartment);
        dto.setRequestDate(loan.getRequestDate() != null ? loan.getRequestDate().atStartOfDay() : null);
        dto.setStatus(loan.getStatus() != null ? String.valueOf(loan.getStatus()) : null);
        dto.setCheckoutDate(loan.getCheckoutDate() != null ? loan.getCheckoutDate().atStartOfDay() : null);
        dto.setDueDate(loan.getDueDate() != null ? loan.getDueDate().atStartOfDay() : null);
        dto.setReturnDate(loan.getReturnDate() != null ? loan.getReturnDate().atStartOfDay() : null);
        return dto;
    }
}