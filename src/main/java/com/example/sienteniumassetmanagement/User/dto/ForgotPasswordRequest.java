package com.example.sienteniumassetmanagement.User.dto;

import lombok.Data;

/**
 * This is just a simple box to hold the email address when someone clicks "Forgot Password".
 */
@Data
public class ForgotPasswordRequest {
    // The user's email address where we'll send the reset link
    private String email;
}
