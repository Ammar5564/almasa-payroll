package com.example.salaries_system.deduction.service;

import com.example.salaries_system.attendance.model.Attendance;
import com.example.salaries_system.deduction.dto.TaxBreakdown;
import com.example.salaries_system.employee.model.Employee;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface DeductionService {

    // ── Attendance-based deductions ─────────────────────────────────────────
    BigDecimal calculateLateDeduction(Employee employee, List<Attendance> attendances);
    BigDecimal calculateLeaveEarlyDeduction(Employee employee, List<Attendance> attendances);
    BigDecimal calculateAbsenceDeduction(Employee employee, List<Attendance> attendances);

    // ── Loan deduction ───────────────────────────────────────────────────────
    BigDecimal calculateLoanDeduction(Employee employee, LocalDate month);

    // ── Penalty pass-through ─────────────────────────────────────────────────
    BigDecimal calculatePenalties(BigDecimal penaltiesValue);

    // ── Social Insurance ─────────────────────────────────────────────────────
    /** Returns employee share only (11% of clamped base). Respects hasSocialInsurance flag. */
    BigDecimal calculateSocialInsurance(BigDecimal grossSalary, boolean hasSocialInsurance);

    // ── Income Tax ───────────────────────────────────────────────────────────
    /** Monthly income-tax deduction after personal exemption and slab table. */
    BigDecimal calculateIncomeTax(BigDecimal grossSalary, BigDecimal latePenalties,
                                  boolean hasSocialInsurance);

    // ── Martyrs' Fund ────────────────────────────────────────────────────────
    /** When {@code apply} is false, returns zero (employee opted out). */
    BigDecimal calculateMartyrsFund(BigDecimal grossSalary, boolean apply);

    // ── Full audit breakdown ─────────────────────────────────────────────────
    TaxBreakdown calculateTaxBreakdown(BigDecimal grossSalary, BigDecimal latePenalties,
                                       boolean hasSocialInsurance, boolean applyMartyrsFund);
}
