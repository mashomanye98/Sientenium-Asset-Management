package com.example.sienteniumassetmanagement.User.service;

import java.time.LocalDateTime;
import java.util.List;

import com.example.sienteniumassetmanagement.User.dto.PendingUserRequestResponse;
import com.example.sienteniumassetmanagement.User.dto.RegisterRequest;
import com.example.sienteniumassetmanagement.User.entity.PendingUserRequest;
import com.example.sienteniumassetmanagement.User.entity.RequestStatus;
import com.example.sienteniumassetmanagement.User.entity.Role;
import com.example.sienteniumassetmanagement.User.entity.User;
import com.example.sienteniumassetmanagement.User.repository.PendingUserRequestRepository;
import com.example.sienteniumassetmanagement.User.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service for managing pending registration requests.
 *
 * This service keeps new signups in a separate pending table until an admin approves
 * or rejects them, then creates the active user record on approval.
 */
@Service
public class PendingUserRequestService {

    private static final Logger logger = LoggerFactory.getLogger(PendingUserRequestService.class);

    private final PendingUserRequestRepository pendingRequestRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public PendingUserRequestService(PendingUserRequestRepository pendingRequestRepository,
                                     UserRepository userRepository,
                                     PasswordEncoder passwordEncoder,
                                     EmailService emailService)
    {
        this.pendingRequestRepository = pendingRequestRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public PendingUserRequestResponse createRequest(RegisterRequest request) {
        // Prevent duplicate email registration for both active users and pending requests.
        if (userRepository.existsByEmail(request.getEmail()) || pendingRequestRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered or awaiting approval");
        }

        Role role = mapDepartmentToRole(request.getDepartment());

        PendingUserRequest pendingRequest = new PendingUserRequest();
        pendingRequest.setFullName(request.getFullName());
        pendingRequest.setEmail(request.getEmail());
        pendingRequest.setPassword(passwordEncoder.encode(request.getPassword()));
        pendingRequest.setDepartment(request.getDepartment());
        pendingRequest.setRole(role);
        pendingRequest.setStatus(RequestStatus.PENDING);
        pendingRequest.setRequestedAt(LocalDateTime.now());

        pendingRequestRepository.save(pendingRequest);

        try {
            emailService.sendRegistrationReceivedEmail(pendingRequest.getEmail(), pendingRequest.getFullName());
        } catch (Exception ex) {
            logger.warn("Registration received email could not be sent to {}.", pendingRequest.getEmail(), ex);
        }

        return buildResponse(pendingRequest);
    }

    public List<PendingUserRequestResponse> getPendingRequests() {
        // Fetch the current pending signup requests for admin review.
        return pendingRequestRepository.findByStatus(RequestStatus.PENDING).stream()
                .map(this::buildResponse)
                .toList();
    }

    public PendingUserRequestResponse approveRequest(Long requestId) {
        // Load the pending request and validate it is still pending.
        PendingUserRequest pendingRequest = pendingRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (pendingRequest.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be approved");
        }

        if (userRepository.existsByEmail(pendingRequest.getEmail())) {
            throw new IllegalArgumentException("A user with this email already exists");
        }

        // Create the active User entity from the approved pending request.
        User user = new User();
        user.setFullName(pendingRequest.getFullName());
        user.setEmail(pendingRequest.getEmail());
        user.setPassword(pendingRequest.getPassword());
        user.setDepartment(pendingRequest.getDepartment());
        user.setRole(pendingRequest.getRole());

        userRepository.save(user);

        try {
            emailService.sendApprovalEmail(user.getEmail(), user.getFullName());
        } catch (Exception ex) {
            logger.warn("Account activation email could not be sent to {}.", user.getEmail(), ex);
        }

        pendingRequest.setStatus(RequestStatus.APPROVED);
        pendingRequestRepository.save(pendingRequest);

        return buildResponse(pendingRequest);
    }

    public PendingUserRequestResponse rejectRequest(Long requestId) {
        // Reject an active pending signup request.
        PendingUserRequest pendingRequest = pendingRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (pendingRequest.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be rejected");
        }

        pendingRequest.setStatus(RequestStatus.REJECTED);
        pendingRequestRepository.save(pendingRequest);

        try {
            emailService.sendRejectionEmail(pendingRequest.getEmail(), pendingRequest.getFullName());
        } catch (Exception ex) {
            logger.warn("Rejection email could not be sent to {}.", pendingRequest.getEmail(), ex);
        }

        return buildResponse(pendingRequest);
    }

    private PendingUserRequestResponse buildResponse(PendingUserRequest pendingRequest) {
        // Convert the pending user request entity into a DTO for the API response.
        return new PendingUserRequestResponse(
                pendingRequest.getId(),
                pendingRequest.getFullName(),
                pendingRequest.getEmail(),
                pendingRequest.getDepartment(),
                pendingRequest.getRole().name(),
                pendingRequest.getStatus(),
                pendingRequest.getRequestedAt()
        );
    }

    private Role mapDepartmentToRole(String department) {
        // Map the selected department string to the matching application role.
        if (department == null) {
            return Role.ROLE_STAFF;
        }

        String normalized = department.trim().toLowerCase();
        if (normalized.contains("admin")) {
            return Role.ROLE_ADMIN;
        }
        if (normalized.contains("manage")) {
            return Role.ROLE_MANAGER;
        }
        return Role.ROLE_STAFF;
    }
}
