package com.example.sienteniumassetmanagement.auditlog;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public AuditLogResponseDTO createAuditLog(AuditLogRequestDTO requestDTO) {
        AuditLog auditLog = mapToEntity(requestDTO);
        return mapToResponse(auditLogRepository.save(auditLog));
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponseDTO> getAllAuditLogs() {
        return auditLogRepository.findTop100ByOrderByTimestampDesc().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AuditLogResponseDTO getAuditLogById(Long logId) {
        AuditLog auditLog = auditLogRepository.findById(logId)
                .orElseThrow(() -> new IllegalArgumentException("Audit log not found"));
        return mapToResponse(auditLog);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponseDTO> getAuditLogsByUserId(Long userId) {
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponseDTO> getAuditLogsByEntity(String entityType, Long entityId) {
        AuditLog.EntityType resolvedEntityType = AuditLog.EntityType.valueOf(entityType.toUpperCase());
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(resolvedEntityType, entityId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public AuditLogResponseDTO recordAction(Long userId,
                                            AuditLog.EntityType entityType,
                                            Long entityId,
                                            AuditLog.Action action) {
        AuditLog auditLog = AuditLog.builder()
                .userId(userId)
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .build();

        return mapToResponse(auditLogRepository.save(auditLog));
    }

    private AuditLog mapToEntity(AuditLogRequestDTO requestDTO) {
        return AuditLog.builder()
                .userId(requestDTO.getUserId())
                .entityType(AuditLog.EntityType.valueOf(requestDTO.getEntityType().toUpperCase()))
                .entityId(requestDTO.getEntityId())
                .action(AuditLog.Action.valueOf(requestDTO.getAction().toUpperCase().replace("-", "_")))
                .build();
    }

    private AuditLogResponseDTO mapToResponse(AuditLog auditLog) {
        return new AuditLogResponseDTO(
                auditLog.getLogId(),
                auditLog.getUserId(),
                auditLog.getEntityType() != null ? auditLog.getEntityType().name() : null,
                auditLog.getEntityId(),
                auditLog.getAction() != null ? auditLog.getAction().name() : null,
                auditLog.getTimestamp()
        );
    }
}