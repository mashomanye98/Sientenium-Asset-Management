package com.example.sienteniumassetmanagement.auditlog;


import com.example.sienteniumassetmanagement.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
/*Mashomanye  Masemola

 */
@Entity
@Table(name = "audit_log")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long logId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private EntityType entityType;

    @Column(nullable = false)
    private Long entityId;

    @Column(nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private Action action;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    // Store as JSON if needed – requires a converter or Hibernate Types
    @Column(columnDefinition = "json")
    private String oldValue;   // or use Map<String, Object> + converter

    @Column(columnDefinition = "json")
    private String newValue;   // same as above

    // No setters for logId, timestamp, user? (If user can change, add setter but careful)
    // Only allow updates to values if needed, otherwise omit setters.
    // Use builder for creation.

    public enum EntityType {
        ASSET, LOAN
    }

    public enum Action {
        CREATE, UPDATE, DELETE, CHECK_OUT, CHECK_IN
    }
}



