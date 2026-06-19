package com.example.sienteniumassetmanagement.User.dto;

public class AuthResponse {
    private String message;
    private String email;
    private String role;
    private Long id;
    private String department;

    public AuthResponse(String message, String email, String role) {
        this.message = message;
        this.email = email;
        this.role = role;
    }

    public AuthResponse(String message, String email, String role, Long id, String department) {
        this.message = message;
        this.email = email;
        this.role = role;
        this.id = id;
        this.department = department;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}
