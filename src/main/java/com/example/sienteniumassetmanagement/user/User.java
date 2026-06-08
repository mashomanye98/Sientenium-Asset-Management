package com.example.sienteniumassetmanagement.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "Users")
public class User {
    // Getters and Setters
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "name", nullable = false)
    private String name;
    @Column(name = "department")
    private String department;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "role")
    private String role;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;


    @Column(name = "created_at")
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

