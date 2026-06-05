package com.example.sienteniumassetmanagement.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "user")
public class User {
    // Getters and Setters
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    private String name;
    private String department;
    private String email;
    private String role; // Admin / Manager / Borrower
    private String passwordHash;
    private LocalDateTime createdAt;

    // Constructors
    public User() {}

    public User(String name, String department, String email, String role, String passwordHash) {
        this.name = name;
        this.department = department;
        this.email = email;
        this.role = role;
        this.passwordHash = passwordHash;
        this.createdAt = LocalDateTime.now();
    }

}

