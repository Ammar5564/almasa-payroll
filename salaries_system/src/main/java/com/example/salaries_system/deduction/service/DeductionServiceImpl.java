package com.example.salaries_system.deduction.service;

import com.example.salaries_system.attendance.model.Attendance;
import com.example.salaries_system.attendance.model.AbsenceType;
import com.example.salaries_system.common.util.SalaryUtils;
import com.example.salaries_system.common.util.TaxConstants;
import com.example.salaries_system.deduction.dto.TaxBreakdown;
import com.example.salaries_system.deduction.dto.TaxSlabDetail;
import com.example.salaries_system.employee.model.Employee;
import com.example.salaries_system.loan.model.Loan;
import com.example.salaries_system.loan.model.LoanInstallment;
import com.example.salaries_system.loan.repository.LoanInstallmentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class DeductionServiceImpl implements DeductionService {

    private static final LocalTime SHIFT_START_ADMIN   = LocalTime.of(9, 0);
    private static final LocalTime SHIFT_START_DEFAULT = LocalTime.of(8, 30);

    private final LoanInstallmentRepository installmentRepo;

    public DeductionServiceImpl(LoanInstallmentRepository installmentRepo) {
        this.installmentRepo = installmentRepo;
    }

    // ── Attendance helpers ───────────────────────────────────────────────────

    private LocalTime shiftStartFor(Employee employee) {
        return "ADMIN".equals(employee.getCategory())
                ? SHIFT_START_ADMIN
                : SHIFT_START_DEFAULT;
    }

    @Override
    public BigDecimal calculateLateDeduction(Employee employee, List<Attendance> attendances) {
        if (isExemptFromTimeEvaluation(employee)) return BigDecimal.ZERO;

        BigDecimal dailySalary = SalaryUtils.salaryPerDay(employee);
        LocalTime shiftStart   = shiftStartFor(employee);
        BigDecimal total       = BigDecimal.ZERO;

        for (Attendance a : attendances) {
            if (a.getDate() != null && a.getDate().getDayOfWeek() == java.time.DayOfWeek.FRIDAY) continue;
            LocalTime actualStart = a.getActualStart();
            if (actualStart == null || !actualStart.isAfter(shiftStart)) continue;
            long lateMinutes = Duration.between(shiftStart, actualStart).toMinutes();
            total = total.add(lateDeductionForDay(lateMinutes, dailySalary));
        }
        return total;
    }

    /**
     * Bracket logic (only highest bracket, no rounding up).
     * Trigger is exact: 15:00 starts the first bracket (14:59 = grace period).
     *
     *  0 – 14 min  → 0           (grace period)
     * 15 – 29 min  → 0.25 × day  (/401)
     * 30 – 59 min  → 0.50 × day  (/402)
     * 60+ min      → 1.00 × day  (/403)
     */
    private BigDecimal lateDeductionForDay(long lateMinutes, BigDecimal dailySalary) {
        if (lateMinutes < 15) return BigDecimal.ZERO;
        if (lateMinutes < 30) return dailySalary.multiply(new BigDecimal("0.25")).setScale(2, RoundingMode.HALF_UP);
        if (lateMinutes < 60) return dailySalary.multiply(new BigDecimal("0.50")).setScale(2, RoundingMode.HALF_UP);
        return dailySalary.setScale(2, RoundingMode.HALF_UP);
    }

    /** Returns the SAP wage type string for the applicable late bracket. */
    public static String lateWageType(long lateMinutes) {
        if (lateMinutes < 15) return "N/A";
        if (lateMinutes < 30) return "/401";
        if (lateMinutes < 60) return "/402";
        return "/403";
    }

    @Override
    public BigDecimal calculateLeaveEarlyDeduction(Employee employee, List<Attendance> attendances) {
        if (isExemptFromTimeEvaluation(employee)) return BigDecimal.ZERO;

        BigDecimal secondRate = SalaryUtils.salaryPerSecond(employee);
        BigDecimal total = BigDecimal.ZERO;

        for (Attendance a : attendances) {
            if (a.getDate() != null && a.getDate().getDayOfWeek() == java.time.DayOfWeek.FRIDAY) continue;
            Long earlyLeaveSeconds = a.getEarlyLeaveSeconds();
            if (earlyLeaveSeconds != null && earlyLeaveSeconds > 0) {
                total = total.add(
                        secondRate.multiply(BigDecimal.valueOf(earlyLeaveSeconds))
                                  .setScale(2, RoundingMode.HALF_UP)
                );
            }
        }
        return total;
    }

    /**
     * Calculates the total absence deduction for the period.
     *
     * SAP Infotype 2001 mapping:
     *   ANNUAL_LEAVE / WITH_PERMISSION  → 0  (paid leave; balance already deducted)
     *   UNEXCUSED_ABSENCE / WITHOUT_PERMISSION → daily-rate × penaltyMultiplier
     *   MANUAL_DEDUCTION                → exact manualDeduction EGP amount
     */
    @Override
    public BigDecimal calculateAbsenceDeduction(Employee employee, List<Attendance> attendances) {
        if (isExemptFromTimeEvaluation(employee)) return BigDecimal.ZERO;

        BigDecimal dailySalary = SalaryUtils.salaryPerDay(employee);
        BigDecimal total = BigDecimal.ZERO;

        for (Attendance a : attendances) {
            AbsenceType type = a.getAbsenceType();
            if (type == null) continue;

            switch (type) {
                case ANNUAL_LEAVE:
                case WITH_PERMISSION:
                    // Paid leave — no payroll deduction
                    break;

                case MANUAL_DEDUCTION:
                    // Exact amount entered by manager
                    if (a.getManualDeduction() != null
                            && a.getManualDeduction().compareTo(BigDecimal.ZERO) > 0) {
                        total = total.add(a.getManualDeduction());
                    }
                    break;

                case UNEXCUSED_ABSENCE:
                case WITHOUT_PERMISSION:
                default:
                    BigDecimal multiplier = (a.getPenaltyMultiplier() != null
                            && a.getPenaltyMultiplier().compareTo(BigDecimal.ZERO) > 0)
                            ? a.getPenaltyMultiplier()
                            : BigDecimal.ONE;
                    total = total.add(dailySalary.multiply(multiplier).setScale(2, RoundingMode.HALF_UP));
                    break;
            }
        }
        return total;
    }

    /** True when the employee is exempt from all time-evaluation deductions (Task 2). */
    private boolean isExemptFromTimeEvaluation(Employee employee) {
        if (Boolean.TRUE.equals(employee.getFlexibleSchedule())) return true;
        String cat = employee.getCategory();
        if (cat != null && cat.equalsIgnoreCase("Top Management")) return true;
        // Department-level group exemption (flexibleGroup = true)
        return employee.getDepartmentWorkTime() != null
                && Boolean.TRUE.equals(employee.getDepartmentWorkTime().getFlexibleGroup());
    }

    @Override
    public BigDecimal calculateLoanDeduction(Employee employee, LocalDate month) {
        LocalDate monthStart = month.withDayOfMonth(1);

        return installmentRepo.findByMonthAndPaidFalse(monthStart).stream()
                .filter(i -> {
                    Loan loan = i.getLoan();
                    if (!loan.getEmployee().getName().equals(employee.getName())) return false;
                    // Skip closed loans
                    if (Boolean.TRUE.equals(loan.getClosed())) return false;
                    // SAP "sleep": skip if repaymentStartDate hasn't been reached
                    if (loan.getRepaymentStartDate() != null
                            && monthStart.isBefore(loan.getRepaymentStartDate())) return false;
                    return true;
                })
                .map(i -> {
                    // Auto-close: if remaining balance < installment, deduct only remaining
                    BigDecimal remaining = i.getLoan().getRemainingBalance();
                    if (remaining != null && remaining.compareTo(BigDecimal.ZERO) > 0) {
                        return i.getAmount().min(remaining);
                    }
                    return i.getAmount();
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public BigDecimal calculatePenalties(BigDecimal penaltiesValue) {
        return penaltiesValue == null ? BigDecimal.ZERO : penaltiesValue;
    }

    // ── Social Insurance ─────────────────────────────────────────────────────

    @Override
    public BigDecimal calculateSocialInsurance(BigDecimal grossSalary, boolean hasSocialInsurance) {
        if (!hasSocialInsurance) return BigDecimal.ZERO;
        BigDecimal base = siBase(grossSalary);
        return base.multiply(TaxConstants.SI_EMPLOYEE_RATE).setScale(2, RoundingMode.HALF_UP);
    }

    /** SI base clamped to [SI_MIN_BASE, SI_MAX_BASE]. */
    private BigDecimal siBase(BigDecimal grossSalary) {
        if (grossSalary.compareTo(TaxConstants.SI_MIN_BASE) < 0) return TaxConstants.SI_MIN_BASE;
        if (grossSalary.compareTo(TaxConstants.SI_MAX_BASE) > 0) return TaxConstants.SI_MAX_BASE;
        return grossSalary;
    }

    // ── Income Tax ────────────────────────────────────────────────────────────

    @Override
    public BigDecimal calculateIncomeTax(BigDecimal grossSalary, BigDecimal latePenalties,
                                         boolean hasSocialInsurance) {
        BigDecimal siEmployee = calculateSocialInsurance(grossSalary, hasSocialInsurance);
        BigDecimal penalties  = latePenalties == null ? BigDecimal.ZERO : latePenalties;

        BigDecimal monthlyTaxable = grossSalary.subtract(siEmployee).subtract(penalties);
        BigDecimal annualTaxable  = monthlyTaxable.multiply(BigDecimal.valueOf(12));
        BigDecimal afterExemption = annualTaxable.subtract(TaxConstants.PERSONAL_EXEMPTION)
                .max(BigDecimal.ZERO);

        BigDecimal annualTax = applySlabs(afterExemption);
        return annualTax.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
    }

    /**
     * Applies the 7-slab Egyptian income tax table (Law 30/2023).
     * Loops through each bracket and accumulates the tax.
     */
    private BigDecimal applySlabs(BigDecimal annualIncome) {
        if (annualIncome.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;

        BigDecimal[][] slabs = {
            { BigDecimal.ZERO,             TaxConstants.SLAB1_CEIL, TaxConstants.SLAB1_RATE },
            { TaxConstants.SLAB1_CEIL,     TaxConstants.SLAB2_CEIL, TaxConstants.SLAB2_RATE },
            { TaxConstants.SLAB2_CEIL,     TaxConstants.SLAB3_CEIL, TaxConstants.SLAB3_RATE },
            { TaxConstants.SLAB3_CEIL,     TaxConstants.SLAB4_CEIL, TaxConstants.SLAB4_RATE },
            { TaxConstants.SLAB4_CEIL,     TaxConstants.SLAB5_CEIL, TaxConstants.SLAB5_RATE },
            { TaxConstants.SLAB5_CEIL,     TaxConstants.SLAB6_CEIL, TaxConstants.SLAB6_RATE },
            { TaxConstants.SLAB6_CEIL,     null,                    TaxConstants.SLAB7_RATE },
        };

        BigDecimal totalTax   = BigDecimal.ZERO;
        BigDecimal remaining  = annualIncome;

        for (BigDecimal[] slab : slabs) {
            BigDecimal floor = slab[0];
            BigDecimal ceil  = slab[1]; // null = unlimited
            BigDecimal rate  = slab[2];

            if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal slabWidth = (ceil == null)
                    ? remaining
                    : ceil.subtract(floor);

            BigDecimal amountInSlab = remaining.min(slabWidth);
            totalTax  = totalTax.add(amountInSlab.multiply(rate));
            remaining = remaining.subtract(amountInSlab);
        }
        return totalTax.setScale(2, RoundingMode.HALF_UP);
    }

    // ── Martyrs' Fund ────────────────────────────────────────────────────────

    @Override
    public BigDecimal calculateMartyrsFund(BigDecimal grossSalary, boolean apply) {
        if (!apply) {
            return BigDecimal.ZERO;
        }
        return grossSalary.multiply(TaxConstants.MARTYRS_FUND_RATE)
                .setScale(2, RoundingMode.HALF_UP);
    }

    // ── Full Tax Breakdown ───────────────────────────────────────────────────

    @Override
    public TaxBreakdown calculateTaxBreakdown(BigDecimal grossSalary, BigDecimal latePenalties,
                                              boolean hasSocialInsurance, boolean applyMartyrsFund) {
        BigDecimal penalties = latePenalties == null ? BigDecimal.ZERO : latePenalties;

        // SI
        BigDecimal base          = hasSocialInsurance ? siBase(grossSalary) : BigDecimal.ZERO;
        BigDecimal siEmployee    = hasSocialInsurance
                ? base.multiply(TaxConstants.SI_EMPLOYEE_RATE).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal siCompany     = hasSocialInsurance
                ? base.multiply(TaxConstants.SI_COMPANY_RATE).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Taxable income
        BigDecimal monthlyTaxable  = grossSalary.subtract(siEmployee).subtract(penalties);
        BigDecimal projectedAnnual = monthlyTaxable.multiply(BigDecimal.valueOf(12));
        BigDecimal afterExemption  = projectedAnnual.subtract(TaxConstants.PERSONAL_EXEMPTION)
                .max(BigDecimal.ZERO);

        // Slab breakdown
        List<TaxSlabDetail> slabDetails = buildSlabDetails(afterExemption);
        BigDecimal annualTax = slabDetails.stream()
                .map(TaxSlabDetail::getTaxOnSlab)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal monthlyTax = annualTax.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);

        // Martyrs' fund
        BigDecimal martyrsFund = calculateMartyrsFund(grossSalary, applyMartyrsFund);

        TaxBreakdown bd = new TaxBreakdown();
        bd.setGrossSalary(grossSalary);
        bd.setHasSocialInsurance(hasSocialInsurance);
        bd.setSiBase(base);
        bd.setSiEmployeeDeduction(siEmployee);
        bd.setSiCompanyCost(siCompany);
        bd.setLatePenalties(penalties);
        bd.setMonthlyTaxableIncome(monthlyTaxable);
        bd.setProjectedAnnualIncome(projectedAnnual);
        bd.setAnnualAfterExemption(afterExemption);
        bd.setSlabs(slabDetails);
        bd.setTotalAnnualTax(annualTax);
        bd.setMonthlyTax(monthlyTax);
        bd.setMartysFundDeduction(martyrsFund);
        bd.setTotalStatutoryDeductions(siEmployee.add(monthlyTax).add(martyrsFund));
        return bd;
    }

    private List<TaxSlabDetail> buildSlabDetails(BigDecimal annualIncome) {
        record Slab(String label, BigDecimal floor, BigDecimal ceil, BigDecimal rate) {}

        List<Slab> slabs = List.of(
            new Slab("Slab 1 (0%)",    BigDecimal.ZERO,         TaxConstants.SLAB1_CEIL, TaxConstants.SLAB1_RATE),
            new Slab("Slab 2 (10%)",   TaxConstants.SLAB1_CEIL, TaxConstants.SLAB2_CEIL, TaxConstants.SLAB2_RATE),
            new Slab("Slab 3 (15%)",   TaxConstants.SLAB2_CEIL, TaxConstants.SLAB3_CEIL, TaxConstants.SLAB3_RATE),
            new Slab("Slab 4 (20%)",   TaxConstants.SLAB3_CEIL, TaxConstants.SLAB4_CEIL, TaxConstants.SLAB4_RATE),
            new Slab("Slab 5 (22.5%)", TaxConstants.SLAB4_CEIL, TaxConstants.SLAB5_CEIL, TaxConstants.SLAB5_RATE),
            new Slab("Slab 6 (25%)",   TaxConstants.SLAB5_CEIL, TaxConstants.SLAB6_CEIL, TaxConstants.SLAB6_RATE),
            new Slab("Slab 7 (27.5%)", TaxConstants.SLAB6_CEIL, null,                    TaxConstants.SLAB7_RATE)
        );

        List<TaxSlabDetail> details  = new ArrayList<>();
        BigDecimal          remaining = annualIncome.max(BigDecimal.ZERO);

        for (Slab s : slabs) {
            BigDecimal slabWidth    = (s.ceil() == null) ? remaining : s.ceil().subtract(s.floor());
            BigDecimal amountInSlab = remaining.min(slabWidth);
            BigDecimal taxOnSlab    = amountInSlab.multiply(s.rate()).setScale(2, RoundingMode.HALF_UP);

            details.add(new TaxSlabDetail(s.label(), s.floor(), s.ceil(), s.rate(), amountInSlab, taxOnSlab));
            remaining = remaining.subtract(amountInSlab);
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;
        }
        return details;
    }
}
