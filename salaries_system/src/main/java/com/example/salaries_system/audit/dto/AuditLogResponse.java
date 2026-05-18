package com.example.salaries_system.audit.dto;

import java.time.Instant;

public record AuditLogResponse(
        Long id,
        Instant occurredAt,
        String username,
        String moduleName,
        String action,
        String resourceType,
        String resourceId,
        String details,
        String valuesBefore,
        String valuesAfter
) {}
