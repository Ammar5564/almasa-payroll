package com.example.salaries_system.attendance.dto;

import com.example.salaries_system.attendance.model.AbsenceType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * SAP HCM Infotype 2001 — Leave Entry Request.
 *
 * Supports a date range (startDate → endDate).
 * Fridays are automatically excluded from balance consumption and deduction.
 */
@Data
public class LeaveRequest {

    private String employeeName;

    private LocalDate startDate;

    /** Inclusive end date. For a single-day leave set endDate == startDate. */
    private LocalDate endDate;

    /**
     * Leave type:
     *  ANNUAL_LEAVE      — uses vacation balance; zero payroll deduction.
     *  UNEXCUSED_ABSENCE — no balance change; daily-rate deduction per working day.
     *  MANUAL_DEDUCTION  — exact EGP amount; one-off payroll deduction.
     */
    private AbsenceType leaveType;

    /**
     * Required for MANUAL_DEDUCTION only.
     * The exact amount (EGP) to deduct from the next payroll run.
     */
    private BigDecimal manualDeductionAmount;

    /**
     * Optional multiplier for UNEXCUSED_ABSENCE.
     * Egyptian law allows 2× daily-rate for repeated offences (defaults to 1).
     */
    private BigDecimal penaltyMultiplier;
}
