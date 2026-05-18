package com.example.salaries_system.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Read-only projection used by the Manager's Absence History screen.
 * Enriches raw Attendance records with a computed deduction amount and status label.
 */
@Data
@AllArgsConstructor
public class AbsenceHistoryRecord {

    private String     employeeName;
    private LocalDate  date;

    /**
     * One of: ANNUAL_LEAVE, UNEXCUSED_ABSENCE, MANUAL_DEDUCTION,
     *         WITH_PERMISSION (legacy), WITHOUT_PERMISSION (legacy).
     */
    private String     leaveType;

    /**
     * Computed payroll deduction for this record:
     *   ANNUAL_LEAVE / WITH_PERMISSION  → 0
     *   MANUAL_DEDUCTION                → exact manualDeduction field
     *   UNEXCUSED_ABSENCE / OTHERWISE   → dailySalary × penaltyMultiplier
     */
    private BigDecimal deductionAmount;

    /**
     * Human-readable status label.
     * "مدفوعة" (Paid) for annual/permitted leave, "خصم" (Deducted) for absences.
     */
    private String     status;
}
