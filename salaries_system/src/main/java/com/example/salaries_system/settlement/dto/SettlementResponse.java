package com.example.salaries_system.settlement.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Full & Final Settlement (F&F) calculation result.
 *
 * Structure mirrors a formal legal document:
 *   Header  → Employee information
 *   (+) Earnings → Pro-rated salary, vacation payout
 *   (-) Deductions → Social Insurance, Income Tax, Martyrs' Fund, Loan Recovery
 *   (=) Net Settlement
 */
@Data
public class SettlementResponse {

    // ── Document Header ───────────────────────────────────────────────────────
    private String    documentNumber;       // e.g. "TRM-2026-001"
    private LocalDate settlementDate;       // today (document date)
    private boolean   confirmed;

    // ── Employee Information ──────────────────────────────────────────────────
    private String    employeeName;
    private String    employeeCode;
    private String    jobTitle;
    private String    departmentName;
    private String    branchName;
    private LocalDate hireDate;
    private LocalDate terminationDate;
    private int       yearsOfService;       // rounded down
    private int       monthsOfService;      // total months
    private BigDecimal baseSalary;
    private BigDecimal dailyRate;           // baseSalary / 30

    // ── (+) EARNINGS SECTION ─────────────────────────────────────────────────
    /** Day-of-month of the termination date (number of days worked in final month). */
    private int        daysWorked;
    /** baseSalary / 30 × daysWorked */
    private BigDecimal proratedSalary;

    /** Remaining annual-leave days (from vacationBalance). */
    private int        vacationDaysRemaining;
    /** vacationDaysRemaining × dailyRate — SAP "Vacation Payout". */
    private BigDecimal vacationPayout;

    /** proratedSalary + vacationPayout */
    private BigDecimal settlementGross;

    // ── (-) DEDUCTIONS SECTION ───────────────────────────────────────────────
    /** Employee share of Social Insurance (11%) on settlement gross. */
    private BigDecimal socialInsurance;
    /** Egyptian income-tax slab calculation on settlement gross. */
    private BigDecimal incomeTax;
    /** Martyrs' Fund (0.05%) on settlement gross. */
    private BigDecimal martyrsFund;
    // Lombok quirk: explicit accessor needed for fields starting with "martyrs"
    public BigDecimal getMartysFund() { return this.martyrsFund; }
    public void setMartysFund(BigDecimal v) { this.martyrsFund = v; }
    /** Sum of all outstanding loan remaining balances (auto-recovered). */
    private BigDecimal loanBalance;
    /** socialInsurance + incomeTax + martyrsFund + loanBalance */
    private BigDecimal totalDeductions;

    // ── (=) FINAL ────────────────────────────────────────────────────────────
    /** settlementGross − totalDeductions (floored at zero). */
    private BigDecimal netSettlement;
    /** True if raw net was negative before the floor. HR review required. */
    private boolean    netAlert;

    // ── Actions Taken on Confirm ─────────────────────────────────────────────
    private int        loansClosedCount;
    private String     message;
}
