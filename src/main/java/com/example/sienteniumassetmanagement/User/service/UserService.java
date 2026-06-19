package com.example.sienteniumassetmanagement.User.service;

import java.util.List;

import com.example.sienteniumassetmanagement.User.dto.*;
import com.example.sienteniumassetmanagement.User.entity.Role;
import com.example.sienteniumassetmanagement.User.entity.User;
import com.example.sienteniumassetmanagement.User.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        Role role = mapDepartmentToRole(request.getDepartment());

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setDepartment(request.getDepartment());
        user.setRole(role);

        userRepository.save(user);

        return new AuthResponse("User registered successfully", user.getEmail(), user.getRole().name());
    }

    public List<UserSummaryResponse> getAllUsers() {
        return userRepository.findByActiveTrue().stream()
                .map(user -> new UserSummaryResponse(
                        user.getId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getDepartment(),
                        user.getRole().name(),
                        user.isActive()))
                .toList();
    }

    public UserSummaryResponse updateUser(Long userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String normalizedEmail = request.getEmail().trim().toLowerCase();
            if (userRepository.existsByEmailAndIdNot(normalizedEmail, userId)) {
                throw new IllegalArgumentException("Email already in use by another account");
            }
            user.setEmail(normalizedEmail);
        }

        if (request.getDepartment() != null && !request.getDepartment().isBlank()) {
            user.setDepartment(request.getDepartment().trim());
        }

        if (request.getRole() != null && !request.getRole().isBlank()) {
            user.setRole(Role.valueOf(request.getRole().trim()));
        }

        userRepository.save(user);

        return new UserSummaryResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getDepartment(),
                user.getRole().name(),
                user.isActive());
    }

    public void deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.isActive()) {
            throw new IllegalStateException("User is already deactivated");
        }

        user.setActive(false);
        userRepository.save(user);
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        if (!authentication.isAuthenticated()) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return new AuthResponse(
                "Login successful",
                user.getEmail(),
                user.getRole().name(),
                user.getId(),
                user.getDepartment());
    }

    private Role mapDepartmentToRole(String department) {
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
