package com.example.salaries_system.audit;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class AuditPrincipal {

    private AuditPrincipal() {}

    /** JWT subject (application username). Falls back to SYSTEM when anonymous. */
    public static String currentUsernameOrSystem() {
        return Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .filter(Authentication::isAuthenticated)
                .map(Authentication::getName)
                .filter(name -> name != null && !name.isBlank() && !"anonymousUser".equalsIgnoreCase(name))
                .orElse("SYSTEM");
    }
}
