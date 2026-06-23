package com.example.sienteniumassetmanagement.User.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Hey! This class is used to keep track of password reset requests.
 * We store a unique token and link it to a user so they can reset their password safely.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    // A unique ID for each token entry in the database
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The actual secret token string that we'll send to the user's email
    @Column(nullable = false, unique = true)
    private String token;

    // The user who owns this token (the one who wants to reset their password)
    @OneToOne(targetEntity = User.class, fetch = FetchType.EAGER)
    @JoinColumn(nullable = false, name = "user_id")
    private User user;

    // When the token was created and when it will expire (we don't want them to last forever!)
    @Column(nullable = false)
    private LocalDateTime expiryDate;

    // This constructor makes it easy to create a new token for a user
    public PasswordResetToken(String token, User user) {
        this.token = token;
        this.user = user;
        // Let's make the token valid for 24 hours. That should be plenty of time!
        this.expiryDate = LocalDateTime.now().plusHours(24);
    }

    // A quick helper to check if the token has expired yet
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiryDate);
    }
}
