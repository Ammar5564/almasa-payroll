package com.example.salaries_system.audit.service;

import com.example.salaries_system.audit.AuditModules;
import com.example.salaries_system.audit.AuditPrincipal;
import com.example.salaries_system.audit.dto.AuditLogResponse;
import com.example.salaries_system.audit.model.AuditLog;
import com.example.salaries_system.audit.repository.AuditLogRepository;
import com.example.salaries_system.audit.spec.AuditLogSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String action, String resourceType, String resourceId, String details) {
        record(AuditModules.GENERAL, action, resourceType, resourceId, details, null, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(
            String moduleName,
            String action,
            String resourceType,
            String resourceId,
            String details,
            String valuesBefore,
            String valuesAfter
    ) {
        AuditLog row = new AuditLog();
        row.setOccurredAt(Instant.now());
        row.setUsername(AuditPrincipal.currentUsernameOrSystem());
        row.setModuleName(truncate(moduleName, 64));
        row.setAction(truncate(action, 64));
        row.setResourceType(truncate(resourceType, 64));
        row.setResourceId(truncate(resourceId, 512));
        row.setDetails(truncate(details, 4000));
        row.setValuesBefore(valuesBefore);
        row.setValuesAfter(valuesAfter);
        auditLogRepository.save(row);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> search(
            Pageable pageable,
            String username,
            String action,
            LocalDate fromDate,
            LocalDate toDate
    ) {
        ZoneId z = ZoneId.systemDefault();
        Instant occurredFromInclusive = fromDate != null ? fromDate.atStartOfDay(z).toInstant() : null;
        Instant occurredBeforeExclusive = toDate != null ? toDate.plusDays(1).atStartOfDay(z).toInstant() : null;

        Specification<AuditLog> spec = AuditLogSpecification.filtered(
                username, action, occurredFromInclusive, occurredBeforeExclusive);

        return auditLogRepository.findAll(spec, pageable).map(this::toResponse);
    }

    private AuditLogResponse toResponse(AuditLog a) {
        return new AuditLogResponse(
                a.getId(),
                a.getOccurredAt(),
                a.getUsername(),
                a.getModuleName(),
                a.getAction(),
                a.getResourceType(),
                a.getResourceId(),
                a.getDetails(),
                a.getValuesBefore(),
                a.getValuesAfter()
        );
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
