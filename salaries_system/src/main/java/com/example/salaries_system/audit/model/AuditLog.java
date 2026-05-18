package com.example.salaries_system.audit.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * SAP-style audit trail: module, user, action, timing, optional before/after payloads.
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_occurred_at", columnList = "occurred_at"),
        @Index(name = "idx_audit_action", columnList = "action"),
        @Index(name = "idx_audit_username", columnList = "username"),
        @Index(name = "idx_audit_module", columnList = "module_name")
})
@Getter
@Setter
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Instant occurredAt;

    @Column(nullable = false, length = 128)
    private String username;

    /** Logical subsystem e.g. ATTENDANCE, PAYROLL */
    @Column(name = "module_name", length = 64)
    private String moduleName;

    @Column(nullable = false, length = 64)
    private String action;

    @Column(nullable = false, length = 64)
    private String resourceType;

    @Column(length = 512)
    private String resourceId;

    @Column(length = 4000)
    private String details;

    /** JSON or structured text snapshot before change */
    @Column(columnDefinition = "TEXT")
    private String valuesBefore;

    /** JSON or structured text snapshot after change */
    @Column(columnDefinition = "TEXT")
    private String valuesAfter;
}
