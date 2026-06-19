package com.example.sienteniumassetmanagement.User.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Database entity used to store signup requests that are waiting for admin approval.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "pending_user_requests")
public class PendingUserRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String department;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;

    @Column(nullable = false)
    private LocalDateTime requestedAt;

    public PendingUserRequest(String fullName, String email, String password, String department, Role role, RequestStatus status, LocalDateTime requestedAt) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.department = department;
        this.role = role;
        this.status = status;
        this.requestedAt = requestedAt;
    }
}
