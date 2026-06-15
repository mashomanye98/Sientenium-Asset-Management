package com.example.sienteniumassetmanagement.auditlog;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogRequestDTO {

    private Long userId;
    private String entityType;
    private Long entityId;
    private String action;
}