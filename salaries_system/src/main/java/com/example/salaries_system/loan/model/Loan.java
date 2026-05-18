package com.example.salaries_system.loan.model;

import jakarta.persistence.*;
import lombok.Data;
import com.example.salaries_system.employee.model.Employee;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * SAP Infotype 0045 — Loans.
 * Tracks loan lifecycle: creation → monthly deductions → automatic close.
 */
@Entity
@Table(name = "loans")
@Data
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    /** SALARY_ADVANCE or COMPANY_LOAN */
    @Enumerated(EnumType.STRING)
    private LoanType loanType = LoanType.COMPANY_LOAN;

    /** Original loan amount given to the employee. */
    private BigDecimal totalAmount;

    /**
     * Fixed monthly installment amount.
     * For SALARY_ADVANCE this equals totalAmount (deducted in one shot).
     */
    private BigDecimal monthlyInstallment;

    /**
     * Outstanding balance. Decremented automatically each payroll run.
     * When it reaches 0 the loan is auto-closed.
     */
    private BigDecimal remainingBalance;

    /**
     * SAP "Repayment Start Date" — deductions begin from this month.
     * Allows the company to give the employee a grace period before deductions start.
     */
    private LocalDate repaymentStartDate;

    /** True once the loan is fully repaid (remainingBalance == 0). */
    private Boolean closed = false;

    private LocalDate createdAt;

    @OneToMany(mappedBy = "loan", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"loan"})
    private List<LoanInstallment> installments;
}
