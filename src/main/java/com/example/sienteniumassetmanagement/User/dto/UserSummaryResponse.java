package com.sientenium.api.dto;

public class UserSummaryResponse {
    private Long id;
    private String fullName;
    private String email;
    private String department;
    private String role;

    public UserSummaryResponse() {
    }

    public UserSummaryResponse(Long id, String fullName, String email, String department, String role) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.department = department;
        this.role = role;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
