package com.sientenium.api.service;

import com.sientenium.api.dto.AuthResponse;
import com.sientenium.api.dto.LoginRequest;
import com.sientenium.api.dto.RegisterRequest;
import com.sientenium.api.dto.UserSummaryResponse;
import com.sientenium.api.entity.Role;
import com.sientenium.api.entity.User;
import java.util.List;
import com.sientenium.api.repository.UserRepository;
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
        return userRepository.findAll().stream()
                .map(user -> new UserSummaryResponse(
                        user.getId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getDepartment(),
                        user.getRole().name()))
                .toList();
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

        return new AuthResponse("Login successful", user.getEmail(), user.getRole().name());
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
