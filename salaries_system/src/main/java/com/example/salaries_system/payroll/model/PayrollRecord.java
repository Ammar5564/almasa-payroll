package com.example.salaries_system.payroll.model;


import jakarta.persistence.*;
import lombok.Data;
import com.example.salaries_system.employee.model.Employee;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(
        name = "payroll_records",
        uniqueConstraints = @UniqueConstraint(columnNames = {"employee_id", "month"})
)
@Data
public class PayrollRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    private LocalDate month;

    private int workedDays = 0;

    private BigDecimal salaryPerMinute = BigDecimal.ZERO;

    // ===== زيادات =====
    private BigDecimal bonus = BigDecimal.ZERO;
    private BigDecimal overtimePay = BigDecimal.ZERO;

    // ===== خصومات =====
    private BigDecimal lateDeduction = BigDecimal.ZERO;
    private BigDecimal leaveEarlyDeduction = BigDecimal.ZERO;
    private BigDecimal absenceDeduction = BigDecimal.ZERO;
    private BigDecimal loanDeduction = BigDecimal.ZERO;
    private BigDecimal penalties = BigDecimal.ZERO;
    private BigDecimal socialInsurance = BigDecimal.ZERO;
    private BigDecimal incomeTax = BigDecimal.ZERO;
    private BigDecimal martyrsFundDeduction = BigDecimal.ZERO;

    private BigDecimal finalSalary = BigDecimal.ZERO;

    /**
     * True once HR locks the payroll run for this period.
     * A locked record cannot be recalculated (prevents retroactive tampering).
     */
    private Boolean locked = false;

    /**
     * True when the net pay would have been negative before the floor-at-zero
     * rule was applied. HR is alerted to review the employee's deductions.
     */
    private Boolean netAlert = false;

    /**
     * Step-by-step calculation log stored as plain text.
     * Allows HR to audit exactly how every figure was derived.
     */
    @Column(columnDefinition = "TEXT")
    private String calculationTrace;

    /**
     * "YYYY-MM" string of the period this payroll covers (= the run period).
     * Used to detect retroactive adjustments when attendance entries from a
     * prior month are included in the current run.
     */
    private String earnedPeriod;

    public BigDecimal getMartysFundDeduction() { return this.martyrsFundDeduction; }
    public void setMartysFundDeduction(BigDecimal v) { this.martyrsFundDeduction = v; }
}
