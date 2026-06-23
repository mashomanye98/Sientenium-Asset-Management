package com.example.sienteniumassetmanagement.User.repository;

import com.example.sienteniumassetmanagement.User.entity.PasswordResetToken;
import com.example.sienteniumassetmanagement.User.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * This is just a simple way to talk to the database about our password reset tokens.
 * Spring Data JPA does all the heavy lifting for us!
 */
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    // Find a token entry by the actual token string
    Optional<PasswordResetToken> findByToken(String token);
    
    // Find a token entry for a specific user
    Optional<PasswordResetToken> findByUser(User user);
    
    // We can also delete tokens that aren't needed anymore
    void deleteByUser(User user);
}
