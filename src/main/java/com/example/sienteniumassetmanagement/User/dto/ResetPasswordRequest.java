package com.example.sienteniumassetmanagement.User.dto;

import lombok.Data;

/**
 * When the user finally resets their password, they'll send us the token we gave them 
 * and their shiny new password.
 */
@Data
public class ResetPasswordRequest {
    
    // The secret token we emailed them earlier
    private String token;
    
    // The brand new password they want to use from now on
    private String newPassword;
}
