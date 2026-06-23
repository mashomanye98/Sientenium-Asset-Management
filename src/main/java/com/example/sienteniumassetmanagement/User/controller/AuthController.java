package com.example.sienteniumassetmanagement.User.controller;

import com.example.sienteniumassetmanagement.User.dto.*;
import com.example.sienteniumassetmanagement.User.service.EmailService;
import com.example.sienteniumassetmanagement.User.service.PendingUserRequestService;
import com.example.sienteniumassetmanagement.User.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication controller for registration, login, and user request approval flows.
 *
 * This controller delegates standard login and user listing to UserService.
 * It also exposes endpoints for pending signup request management.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final PendingUserRequestService pendingUserRequestService;
    private final EmailService emailService;

    public AuthController(UserService userService,
                          PendingUserRequestService pendingUserRequestService,
                          EmailService emailService) {
        this.userService = userService;
        this.pendingUserRequestService = pendingUserRequestService;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        // Store the incoming registration as a pending request instead of activating immediately.
        PendingUserRequestResponse pendingRequest = pendingUserRequestService.createRequest(request);
        return ResponseEntity.ok(new AuthResponse(
                "Registration request submitted. An administrator will approve your account.",
                pendingRequest.getEmail(),
                pendingRequest.getRole()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserSummaryResponse>> getUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<UserSummaryResponse> updateUser(
            @PathVariable Long userId,
            @Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(userService.updateUser(userId, request));
    }

    /**
     * Forgot Password endpoint.
     * We accept an email address, generate a secure token,
     * and send the user a friendly email with a reset link.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String token = userService.createPasswordResetTokenForUser(request.getEmail());

        // Personalize the email to make it feel human
        String fullName = userService.getUserFullNameByEmail(request.getEmail());
        emailService.sendPasswordResetEmail(request.getEmail(), fullName, token);

        return ResponseEntity.ok(new AuthResponse(
                "If your email exists in our system, we've sent you a password reset link.",
                request.getEmail(),
                null
        ));
    }

    /**
     * Reset Password endpoint.
     * We verify the token and update the user's password.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(new AuthResponse(
                "Your password has been updated successfully. You can now sign in.",
                null,
                null
        ));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deactivateUser(@PathVariable Long userId) {
        userService.deactivateUser(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/pending")
    public ResponseEntity<List<PendingUserRequestResponse>> getPendingRequests() {
        // Return only requests that are still awaiting administrative approval.
        return ResponseEntity.ok(pendingUserRequestService.getPendingRequests());
    }

    @PutMapping("/pending/{requestId}/approve")
    public ResponseEntity<PendingUserRequestResponse> approveRequest(@PathVariable Long requestId) {
        // Approve a pending registration and create an active user account.
        return ResponseEntity.ok(pendingUserRequestService.approveRequest(requestId));
    }

    @PutMapping("/pending/{requestId}/reject")
    public ResponseEntity<PendingUserRequestResponse> rejectRequest(@PathVariable Long requestId) {
        // Reject the pending request and keep it recorded as rejected.
        return ResponseEntity.ok(pendingUserRequestService.rejectRequest(requestId));
    }
}
