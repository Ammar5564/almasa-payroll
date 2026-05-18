package com.example.salaries_system.payroll.dto;

import com.example.salaries_system.deduction.dto.TaxBreakdown;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PaySlipResponse {

    // ── Header ─────────────────────────────────────────────────────────────
    private String     employeeCode;
    private String     employeeName;
    private String     jobTitle;
    private String     departmentName;
    private String     branchName;
    private String     month;

    // ── SAP Processing Schema (computed steps) ─────────────────────────────
    private BigDecimal baseSalary       = BigDecimal.ZERO;
    /** Gross = Basic + Overtime + Bonus */
    private BigDecimal grossPay         = BigDecimal.ZERO;
    /** Time Deductions = Late + Early Leave + Absence */
    private BigDecimal timeDeductions   = BigDecimal.ZERO;
    /** Adjusted Gross = Gross - Time Deductions (tax/SI base reference) */
    private BigDecimal adjustedGross    = BigDecimal.ZERO;

    // ── Columns ────────────────────────────────────────────────────────────
    private Additions  additions;
    private Deductions deductions;

    private BigDecimal totalAdditions  = BigDecimal.ZERO;
    private BigDecimal totalDeductions = BigDecimal.ZERO;
    private BigDecimal netSalary       = BigDecimal.ZERO;
    private LocalDate  generatedAt;

    // ── Status flags ───────────────────────────────────────────────────────
    /** True when this payroll period has been locked by HR (Control Record). */
    private boolean    locked    = false;
    /**
     * True when the calculated net was negative before the floor-at-zero rule.
     * HR should review this employee's deductions.
     */
    private boolean    netAlert  = false;
    /**
     * "YYYY-MM" of the period this payslip covers.
     * If any attendance records fall outside this period it's a retroactive run.
     */
    private String     earnedPeriod;

    // ── SAP Infotype 2006 — Leave Quota Summary ───────────────────────────────
    /** Populated at payslip generation time from the employee's vacation balance. */
    private LeaveQuota leaveQuota;

    // ── Tax audit trail ────────────────────────────────────────────────────
    private TaxBreakdown taxBreakdown;

    // ── Step-by-step trace ─────────────────────────────────────────────────
    private String calculationTrace;

    @Data
    public static class Additions {
        private BigDecimal overtimePay = BigDecimal.ZERO;
        private BigDecimal bonus       = BigDecimal.ZERO;
        private BigDecimal arrears     = BigDecimal.ZERO;
        private BigDecimal allowances  = BigDecimal.ZERO;
    }

    @Data
    public static class Deductions {
        private BigDecimal lateDeduction       = BigDecimal.ZERO;
        private BigDecimal leaveEarlyDeduction = BigDecimal.ZERO;
        private BigDecimal absenceDeduction    = BigDecimal.ZERO;
        private BigDecimal loanDeduction       = BigDecimal.ZERO;
        private BigDecimal penalties           = BigDecimal.ZERO;
        private BigDecimal socialInsurance     = BigDecimal.ZERO;
        private BigDecimal incomeTax           = BigDecimal.ZERO;
        private BigDecimal martyrsFundDeduction= BigDecimal.ZERO;

        public BigDecimal getMartysFundDeduction() { return this.martyrsFundDeduction; }
        public void setMartysFundDeduction(BigDecimal v) { this.martyrsFundDeduction = v; }
    }

    /**
     * SAP Infotype 2006 — Annual Leave Quota snapshot printed on the payslip.
     *
     *  entitlement    = legal quota (21 or 30 based on employee age)
     *  daysTaken      = entitlement - currentBalance
     *  currentBalance = remaining days as of this payroll run
     */
    @Data
    public static class LeaveQuota {
        private int entitlement;
        private int daysTaken;
        private int currentBalance;

        public LeaveQuota(int entitlement, int currentBalance) {
            this.entitlement     = entitlement;
            this.currentBalance  = currentBalance;
            this.daysTaken       = entitlement - currentBalance;
        }
    }

    public PaySlipResponse() {
        this.additions   = new Additions();
        this.deductions  = new Deductions();
        this.generatedAt = LocalDate.now();
    }
}
