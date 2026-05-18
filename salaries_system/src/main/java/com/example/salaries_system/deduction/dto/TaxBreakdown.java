package com.example.salaries_system.deduction.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

/**
 * Full audit trail of how tax and SI were calculated for a given month.
 * Returned by the /tax-breakdown endpoint and embedded in the pay-slip.
 */
@Data
public class TaxBreakdown {

    // ── Inputs ──────────────────────────────────────────────────────────────
    private BigDecimal grossSalary;
    private boolean    hasSocialInsurance;

    // ── Social Insurance ────────────────────────────────────────────────────
    private BigDecimal siBase;               // clamped to [2,700 – 16,700]
    private BigDecimal siEmployeeDeduction;  // siBase * 11%
    private BigDecimal siCompanyCost;        // siBase * 18.75%  (for HR reference)

    // ── Taxable Income ──────────────────────────────────────────────────────
    private BigDecimal latePenalties;        // deductions that reduce the tax base
    private BigDecimal monthlyTaxableIncome; // grossSalary - siEmployee - latePenalties
    private BigDecimal projectedAnnualIncome;// monthlyTaxable * 12
    private BigDecimal annualAfterExemption; // projectedAnnual - 20,000 (floor 0)

    // ── Tax Slab Breakdown ──────────────────────────────────────────────────
    private List<TaxSlabDetail> slabs;
    private BigDecimal          totalAnnualTax;
    private BigDecimal          monthlyTax;  // totalAnnualTax / 12

    // ── Martyrs' Fund ────────────────────────────────────────────────────────
    private BigDecimal martyrsFundDeduction;  // grossSalary * 0.05%

    // ── Summary ─────────────────────────────────────────────────────────────
    private BigDecimal totalStatutoryDeductions; // siEmployee + monthlyTax + martyrsFundDeduction

    // Explicit accessors (Lombok @Data handles all other fields)
    public BigDecimal getMartysFundDeduction() { return this.martyrsFundDeduction; }
    public void setMartysFundDeduction(BigDecimal v) { this.martyrsFundDeduction = v; }
    public BigDecimal getTotalStatutoryDeductions() { return this.totalStatutoryDeductions; }
    public void setTotalStatutoryDeductions(BigDecimal v) { this.totalStatutoryDeductions = v; }
}
