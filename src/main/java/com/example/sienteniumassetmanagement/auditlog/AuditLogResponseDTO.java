package com.example.sienteniumassetmanagement.auditlog;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponseDTO {

    private Long logId;
    private Long userId;
    private String entityType;
    private Long entityId;
    private String action;
    private LocalDateTime timestamp;
}