package com.example.salaries_system.attendance.model;

/**
 * SAP HCM Infotype 2001 — Absence Types.
 *
 * Legacy values (kept for backward compatibility):
 *   WITH_PERMISSION    — authorised absence; treated identically to ANNUAL_LEAVE.
 *   WITHOUT_PERMISSION — unexcused absence; treated identically to UNEXCUSED_ABSENCE.
 *
 * New values (Task 6):
 *   ANNUAL_LEAVE       — إجازة سنوية. Consumes vacation balance; zero payroll deduction.
 *   UNEXCUSED_ABSENCE  — غياب بدون إذن. No balance change; deducts (salary/30) per day.
 *   MANUAL_DEDUCTION   — خصم إداري. Exact EGP amount entered by manager; deducted from payroll.
 */
public enum AbsenceType {
    // ── legacy ─────────────────────────────────────────────────────────────
    WITH_PERMISSION,
    WITHOUT_PERMISSION,

    // ── Infotype 2001 / 2006 ───────────────────────────────────────────────
    ANNUAL_LEAVE,
    UNEXCUSED_ABSENCE,
    MANUAL_DEDUCTION
}
