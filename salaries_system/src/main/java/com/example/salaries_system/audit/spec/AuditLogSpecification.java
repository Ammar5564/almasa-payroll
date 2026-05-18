package com.example.salaries_system.audit.spec;

import com.example.salaries_system.audit.model.AuditLog;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public final class AuditLogSpecification {

    private AuditLogSpecification() {}

    /**
     * @param occurredFromInclusive lower bound inclusive (nullable)
     * @param occurredBeforeExclusive upper bound exclusive (nullable), e.g. start of day after last included date
     */
    public static Specification<AuditLog> filtered(
            String username,
            String action,
            Instant occurredFromInclusive,
            Instant occurredBeforeExclusive
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (username != null && !username.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("username")), username.trim().toLowerCase()));
            }
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action.trim()));
            }
            if (occurredFromInclusive != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("occurredAt"), occurredFromInclusive));
            }
            if (occurredBeforeExclusive != null) {
                predicates.add(cb.lessThan(root.get("occurredAt"), occurredBeforeExclusive));
            }

            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
