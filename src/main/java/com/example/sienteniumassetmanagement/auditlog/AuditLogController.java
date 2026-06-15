package com.example.sienteniumassetmanagement.auditlog;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @PostMapping
    public ResponseEntity<AuditLogResponseDTO> createAuditLog(@Valid @RequestBody AuditLogRequestDTO requestDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auditLogService.createAuditLog(requestDTO));
    }

    @GetMapping
    public ResponseEntity<List<AuditLogResponseDTO>> getAllAuditLogs() {
        return ResponseEntity.ok(auditLogService.getAllAuditLogs());
    }

    @GetMapping("/{logId}")
    public ResponseEntity<AuditLogResponseDTO> getAuditLogById(@PathVariable Long logId) {
        return ResponseEntity.ok(auditLogService.getAuditLogById(logId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AuditLogResponseDTO>> getAuditLogsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(auditLogService.getAuditLogsByUserId(userId));
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<AuditLogResponseDTO>> getAuditLogsByEntity(@PathVariable String entityType,
                                                                          @PathVariable Long entityId) {
        return ResponseEntity.ok(auditLogService.getAuditLogsByEntity(entityType, entityId));
    }
}