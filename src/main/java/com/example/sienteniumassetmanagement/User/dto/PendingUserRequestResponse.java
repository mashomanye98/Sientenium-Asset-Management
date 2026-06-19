package com.example.sienteniumassetmanagement.User.dto;

import com.example.sienteniumassetmanagement.User.entity.RequestStatus;

/**
 * DTO returned to the frontend for each pending signup request.
 */
public class PendingUserRequestResponse {

    private Long id;
    private String fullName;
    private String email;
    private String department;
    private String role;
    private RequestStatus status;
    private java.time.LocalDateTime requestedAt;

    public PendingUserRequestResponse() {
    }

    public PendingUserRequestResponse(Long id, String fullName, String email, String department, String role, RequestStatus status, java.time.LocalDateTime requestedAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.department = department;
        this.role = role;
        this.status = status;
        this.requestedAt = requestedAt;
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
    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }
    public java.time.LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(java.time.LocalDateTime requestedAt) { this.requestedAt = requestedAt; }
}
