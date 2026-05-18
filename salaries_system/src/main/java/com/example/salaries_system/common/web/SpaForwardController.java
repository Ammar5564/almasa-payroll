package com.example.salaries_system.common.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * When the React app is served from {@code classpath:/static/}, refreshes on client-side routes
 * must return {@code index.html}. REST APIs live under {@code /api/**} and are not matched here.
 * <p>Add a new {@link GetMapping} path when you add a top-level route in {@code App.tsx}.</p>
 */
@Controller
public class SpaForwardController {

    /** Root {@code /} is served as {@code index.html} by Spring Boot static content; only client routes here. */
    @GetMapping({
            "/login",
            "/employees",
            "/attendance",
            "/payroll",
            "/manager/absence-history",
            "/settlement",
            "/company-policy",
            "/audit-logs",
    })
    public String forwardIndex() {
        return "forward:/index.html";
    }
}
