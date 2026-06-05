package com.example.sienteniumassetmanagement.model;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
/*Mashomanye  Masemola

 */
@Setter
@Getter
@Entity
@Table(name = "audit_log")
public class AuditLog {
    // Getters and Setters
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId;
    // Joining User Id As a foreign Key
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String entityType; // asset or loan
    private Long entityId;
    private String action; // create/update/delete/check-out/check-in
    private LocalDateTime timestamp;
    private String oldValue;
    private String newValue;

    // Constructors
    public AuditLog() {
    }

    public AuditLog(User user, String entityType, Long entityId, String action,
                    String oldValue, String newValue) {
        this.user = user;
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
        this.timestamp = LocalDateTime.now();
        this.oldValue = oldValue;
        this.newValue = newValue;
    }

}

