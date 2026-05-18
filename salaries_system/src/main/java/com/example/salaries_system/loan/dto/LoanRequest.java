package com.example.salaries_system.loan.dto;

import com.example.salaries_system.loan.model.LoanType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class LoanRequest {

    /** SALARY_ADVANCE or COMPANY_LOAN (defaults to COMPANY_LOAN). */
    private LoanType loanType = LoanType.COMPANY_LOAN;

    /** Total loan amount granted to the employee. */
    private BigDecimal totalAmount;

    /**
     * Fixed monthly deduction amount.
     * If null for COMPANY_LOAN, defaults to totalAmount / 12.
     * For SALARY_ADVANCE, the system always uses totalAmount.
     */
    private BigDecimal monthlyInstallment;

    /**
     * SAP "Repayment Start Date" — the first month in which a deduction occurs.
     * If null, defaults to the next calendar month.
     */
    private LocalDate repaymentStartDate;

    /** Optional list of hand-crafted installments (overrides auto-generation). */
    private List<InstallmentRequest> customInstallments;
}
