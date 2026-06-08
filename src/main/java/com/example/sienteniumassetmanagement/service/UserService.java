package com.example.sienteniumassetmanagement.service;

import com.example.sienteniumassetmanagement.model.User;
import com.example.sienteniumassetmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    // Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Get single user by ID
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    // Create new user
    @Transactional
    public User createUser(User user, String plainPassword) {
        // Check if email already exists
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered!");
        }

        user.setPasswordHash(passwordEncoder.encode(plainPassword));
        user.setCreatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    // Update existing user
    @Transactional
    public User updateUser(Long id, User userDetails, String plainPassword) {
        User existingUser = getUserById(id);

        existingUser.setName(userDetails.getName());
        existingUser.setDepartment(userDetails.getDepartment());
        existingUser.setEmail(userDetails.getEmail());
        existingUser.setRole(userDetails.getRole());

        // Update password only if provided
        if (plainPassword != null && !plainPassword.isEmpty()) {
            existingUser.setPasswordHash(passwordEncoder.encode(plainPassword));
        }

        return userRepository.save(existingUser);
    }

    // Delete user
    @Transactional
    public void deleteUser(Long id) {
        User user = getUserById(id);
        userRepository.delete(user);
    }
}