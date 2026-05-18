package com.example.salaries_system.dev;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * ⚠️  DEVELOPMENT / INTEGRATION-TEST ONLY — remove before production deployment.
 *
 * GET  /api/dev/counts           → show current row counts (non-destructive)
 * POST /api/dev/reset            → purge all transactional data
 *      body: { "confirmToken": "RESET-FOR-INTEGRATION-TEST" }
 */
@RestController
@RequestMapping("/api/dev")
@CrossOrigin
public class DevResetController {

    private static final String REQUIRED_TOKEN = "RESET-FOR-INTEGRATION-TEST";

    private final JdbcTemplate jdbc;

    public DevResetController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ── GET /api/dev/counts  ──────────────────────────────────────────────────
    @GetMapping("/counts")
    public Map<String, Object> counts() {
        try {
            return countAll();
        } catch (Exception ex) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("error",  ex.getMessage());
            err.put("cause",  ex.getCause() != null ? ex.getCause().getMessage() : null);
            return err;
        }
    }

    // ── POST /api/dev/reset  ──────────────────────────────────────────────────
    @PostMapping("/reset")
    public Map<String, Object> resetData(@RequestBody Map<String, String> body) {

        if (!REQUIRED_TOKEN.equals(body.get("confirmToken"))) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("status", "REJECTED");
            err.put("reason", "Send body: { \"confirmToken\": \"RESET-FOR-INTEGRATION-TEST\" }");
            return err;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        try {
            Map<String, Object> before = countAll();
            result.put("before", before);

            // Truncate in FK-safe order — child tables first
            jdbc.execute(
                "TRUNCATE TABLE " +
                "  loan_installments, " +
                "  disciplinary_actions, " +
                "  payroll_records, " +
                "  attendance, " +
                "  loans, " +
                "  employees " +
                "RESTART IDENTITY CASCADE"
            );

            // Fix legacy schema: allow multiple branches per departmentName.
            // Hibernate ddl-auto=update does not remove old constraints.
            try {
                jdbc.execute("ALTER TABLE department_work_time DROP CONSTRAINT IF EXISTS department_work_time_departmentname_key");
            } catch (Exception ignored) {
                // best-effort; continue reset even if constraint doesn't exist
            }

            Map<String, Object> after = countAll();
            result.put("after",   after);
            result.put("status",  "SUCCESS");
            result.put("message", "All transactional data purged. System is ready for integration testing.");

        } catch (Exception ex) {
            result.put("status", "ERROR");
            result.put("error",  ex.getMessage());
            result.put("cause",  ex.getCause() != null ? ex.getCause().getMessage() : null);
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    private Map<String, Object> countAll() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("employees",            safeCount("employees"));
        m.put("attendance",           safeCount("attendance"));
        m.put("payroll_records",      safeCount("payroll_records"));
        m.put("loans",                safeCount("loans"));
        m.put("loan_installments",    safeCount("loan_installments"));
        m.put("disciplinary_actions", safeCount("disciplinary_actions"));
        m.put("departments_intact",   safeCount("department_work_time"));
        m.put("categories_intact",    safeCount("employee_categories"));
        return m;
    }

    private Object safeCount(String table) {
        try {
            Long n = jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Long.class);
            return n == null ? 0 : n;
        } catch (Exception ex) {
            return "ERROR: " + ex.getMessage();
        }
    }
}
