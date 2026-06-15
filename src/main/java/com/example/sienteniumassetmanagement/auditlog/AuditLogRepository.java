package com.example.sienteniumassetmanagement.auditlog;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

	List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(AuditLog.EntityType entityType, Long entityId);

	List<AuditLog> findByUserIdOrderByTimestampDesc(Long userId);

	List<AuditLog> findByActionOrderByTimestampDesc(AuditLog.Action action);

	List<AuditLog> findTop100ByOrderByTimestampDesc();
}
