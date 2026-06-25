package com.example.sienteniumassetmanagement.User.service;

import java.util.List;

import com.example.sienteniumassetmanagement.User.dto.*;
import com.example.sienteniumassetmanagement.User.entity.PasswordResetToken;
import com.example.sienteniumassetmanagement.User.entity.Role;
import com.example.sienteniumassetmanagement.User.entity.User;
import com.example.sienteniumassetmanagement.User.repository.PasswordResetTokenRepository;
import com.example.sienteniumassetmanagement.User.repository.UserRepository;
import jakarta.transaction.Transactional;
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
    private final PasswordResetTokenRepository tokenRepository;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       PasswordResetTokenRepository tokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenRepository = tokenRepository;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = (request.getEmail() != null) ? request.getEmail().trim().toLowerCase() : null;
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        Role role = mapDepartmentToRole(request.getDepartment());

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setDepartment(request.getDepartment().trim());
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
        String email = (request.getEmail() != null) ? request.getEmail().trim().toLowerCase() : request.getEmail();
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        if (!authentication.isAuthenticated()) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return new AuthResponse(
                "Login successful",
                user.getEmail(),
                user.getRole().name(),
                user.getId(),
                user.getFullName(),
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

    /**
     * This is where the magic happens when someone forgets their password.
     * We create a unique token for them and save it in the database.
     */
    @Transactional
    public String createPasswordResetTokenForUser(String email) {
        String normalizedEmail = (email != null) ? email.trim().toLowerCase() : email;
        // First, let's find the user. If they don't exist, we'll let the controller know.
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Oops! We couldn't find a user with that email."));

        // If they already have an old token, let's get rid of it. Fresh start!
        tokenRepository.deleteByUser(user);

        // Now we generate a long, random string that's impossible to guess.
        String token = java.util.UUID.randomUUID().toString();

        // Wrap it in our entity and save it to the database.
        PasswordResetToken resetToken = new PasswordResetToken(token, user);
        tokenRepository.save(resetToken);

        // We return the token so it can be emailed to the user.
        return token;
    }

    /**
     * And this is the final step! We check if the token is valid and then update the password.
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        // Does this token even exist in our database?
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Hmm, that reset link doesn't look right."));

        // Has it been too long? (Tokens expire after 24 hours).
        if (resetToken.isExpired()) {
            tokenRepository.delete(resetToken);
            throw new IllegalArgumentException("Sorry, your reset link has expired. Please request a new one.");
        }

        // Everything looks good! Let's get the user and update their password.
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Don't forget to delete the token so it can't be used again. Safety first!
        tokenRepository.delete(resetToken);
    }

    /**
     * A small helper to get the user's name so we can personalize the email.
     */
    public String getUserFullNameByEmail(String email) {
        String normalizedEmail = (email != null) ? email.trim().toLowerCase() : email;
        return userRepository.findByEmail(normalizedEmail)
                .map(User::getFullName)
                .orElse("User");
    }
}
