package com.example.salaries_system.loan.model;

/**
 * SAP Infotype 0045 — Loan Types.
 * SALARY_ADVANCE : سلفة مؤقتة — deducted in full from the very next paycheck.
 * COMPANY_LOAN   : قرض شركة  — deducted in equal monthly installments.
 */
public enum LoanType {
    SALARY_ADVANCE,
    COMPANY_LOAN
}
