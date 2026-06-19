package com.example.sienteniumassetmanagement.User.controller;

import com.example.sienteniumassetmanagement.User.dto.AuthResponse;
import com.example.sienteniumassetmanagement.User.dto.LoginRequest;
import com.example.sienteniumassetmanagement.User.dto.PendingUserRequestResponse;
import com.example.sienteniumassetmanagement.User.dto.RegisterRequest;
import com.example.sienteniumassetmanagement.User.dto.UserSummaryResponse;
import com.example.sienteniumassetmanagement.User.service.PendingUserRequestService;
import com.example.sienteniumassetmanagement.User.service.UserService;
import com.example.sienteniumassetmanagement.User.dto.UserUpdateRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    public AuthController(UserService userService,
                          PendingUserRequestService pendingUserRequestService) {
        this.userService = userService;
        this.pendingUserRequestService = pendingUserRequestService;
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
