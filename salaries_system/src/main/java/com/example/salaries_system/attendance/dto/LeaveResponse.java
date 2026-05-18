package com.example.salaries_system.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Summary returned after recording a leave entry.
 */
@Data
@AllArgsConstructor
public class LeaveResponse {

    private String employeeName;
    private String leaveType;

    /** Number of calendar days in the range (startDate → endDate inclusive). */
    private int calendarDays;

    /** Working days after excluding Fridays. */
    private int workingDays;

    /** Days consumed from the vacation balance (0 for non-annual leave). */
    private int vacationBalanceUsed;

    /** Remaining vacation balance after this entry. */
    private int remainingVacationBalance;

    /**
     * Total payroll deduction that will appear in the next payroll run.
     * Zero for ANNUAL_LEAVE; daily-rate×days for UNEXCUSED_ABSENCE; fixed for MANUAL_DEDUCTION.
     */
    private BigDecimal payrollDeduction;

    /** Every working day an attendance record was created/updated for. */
    private List<LocalDate> affectedDates;

    /** Informational message (e.g. vacation balance warning). */
    private String message;
}
