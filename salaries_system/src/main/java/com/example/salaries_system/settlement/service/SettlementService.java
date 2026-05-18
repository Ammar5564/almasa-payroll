package com.example.salaries_system.settlement.service;

import com.example.salaries_system.attendance.service.VacationService;
import com.example.salaries_system.deduction.service.DeductionService;
import com.example.salaries_system.employee.model.Employee;
import com.example.salaries_system.employee.repository.EmployeeRepository;
import com.example.salaries_system.loan.service.LoanService;
import com.example.salaries_system.settlement.dto.SettlementRequest;
import com.example.salaries_system.settlement.dto.SettlementResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * End-of-Service Full & Final Settlement Service.
 *
 * Follows the Egyptian Labour Law settlement formula:
 *   (+) Pro-rated salary for days worked in final month  (Salary / 30 × days)
 *   (+) Vacation payout for unused annual-leave days     (Salary / 30 × days)
 *   (−) Social Insurance (11%)                           — if applicable
 *   (−) Income Tax (Egyptian annualized slabs)           — if applicable
 *   (−) Martyrs' Fund (0.05%)
 *   (−) Outstanding loan balances (auto-recovery)
 *   ───────────────────────────────────────────────────
 *   (=) Net Settlement Amount
 */
@Service
public class SettlementService {

    private final EmployeeRepository employeeRepo;
    private final DeductionService   deductionService;
    private final LoanService        loanService;

    public SettlementService(EmployeeRepository employeeRepo,
                             DeductionService   deductionService,
                             LoanService        loanService) {
        this.employeeRepo    = employeeRepo;
        this.deductionService = deductionService;
        this.loanService     = loanService;
    }

    // ── Preview (read-only) ───────────────────────────────────────────────────

    /**
     * Calculates the settlement without persisting any changes.
     * Safe to call multiple times as a "what-if" preview.
     */
    public SettlementResponse preview(SettlementRequest req) {
        Employee employee = requireActive(req.getEmployeeName());
        return buildResponse(employee, req.getTerminationDate(), false);
    }

    // ── Confirm (persists changes) ────────────────────────────────────────────

    /**
     * Calculates the settlement AND finalises it:
     *   1. Sets employee.status = "TERMINATED"
     *   2. Sets employee.terminationDate
     *   3. Zeros the vacation balance
     *   4. Closes all active loans
     */
    @Transactional
    public SettlementResponse confirm(SettlementRequest req) {
        Employee employee = requireActive(req.getEmployeeName());

        SettlementResponse response = buildResponse(employee, req.getTerminationDate(), true);

        // ── System Actions ────────────────────────────────────────────────────
        int loansClosed = loanService.closeAllActiveLoans(employee);
        response.setLoansClosedCount(loansClosed);

        employee.setStatus("TERMINATED");
        employee.setTerminationDate(req.getTerminationDate());
        employee.setVacationBalance(0);
        employeeRepo.save(employee);

        response.setMessage(
            "تم تأكيد التسوية بنجاح. الموظف " + employee.getName() +
            " — الحالة: مُنهى الخدمة. تم إغلاق " + loansClosed + " قرض/قروض."
        );
        return response;
    }

    // ── Core Calculation ──────────────────────────────────────────────────────

    private SettlementResponse buildResponse(Employee emp, LocalDate terminationDate, boolean confirmed) {
        SettlementResponse r = new SettlementResponse();

        // ── Header ────────────────────────────────────────────────────────────
        r.setConfirmed(confirmed);
        r.setSettlementDate(LocalDate.now());
        r.setDocumentNumber(buildDocNumber(emp, terminationDate));

        r.setEmployeeName(emp.getName());
        r.setEmployeeCode(emp.getEmployeeCode());
        r.setJobTitle(emp.getJobTitle());
        if (emp.getDepartmentWorkTime() != null) {
            r.setDepartmentName(emp.getDepartmentWorkTime().getDepartmentName());
            r.setBranchName(emp.getDepartmentWorkTime().getBranchName());
        }
        r.setHireDate(emp.getHiringDate());
        r.setTerminationDate(terminationDate);

        if (emp.getHiringDate() != null && terminationDate != null) {
            long totalMonths = ChronoUnit.MONTHS.between(emp.getHiringDate(), terminationDate);
            r.setMonthsOfService((int) totalMonths);
            r.setYearsOfService((int) (totalMonths / 12));
        }

        // ── Rates ─────────────────────────────────────────────────────────────
        BigDecimal baseSalary = emp.getBaseSalary() != null ? emp.getBaseSalary() : BigDecimal.ZERO;
        BigDecimal dailyRate  = baseSalary.divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP);
        r.setBaseSalary(baseSalary);
        r.setDailyRate(dailyRate.setScale(2, RoundingMode.HALF_UP));

        // ── (+) Pro-rated Salary ──────────────────────────────────────────────
        int daysWorked = (terminationDate != null) ? terminationDate.getDayOfMonth() : 0;
        BigDecimal proratedSalary = dailyRate.multiply(BigDecimal.valueOf(daysWorked))
                .setScale(2, RoundingMode.HALF_UP);
        r.setDaysWorked(daysWorked);
        r.setProratedSalary(proratedSalary);

        // ── (+) Vacation Payout ───────────────────────────────────────────────
        int vacDays = emp.getVacationBalance() != null
                ? emp.getVacationBalance()
                : VacationService.initialQuotaFor(emp);
        BigDecimal vacationPayout = dailyRate.multiply(BigDecimal.valueOf(vacDays))
                .setScale(2, RoundingMode.HALF_UP);
        r.setVacationDaysRemaining(vacDays);
        r.setVacationPayout(vacationPayout);

        // ── Settlement Gross ──────────────────────────────────────────────────
        BigDecimal settlementGross = proratedSalary.add(vacationPayout);
        r.setSettlementGross(settlementGross);

        // ── (-) Statutory Deductions on Settlement Gross ──────────────────────
        boolean hasSI = Boolean.TRUE.equals(emp.getHasSocialInsurance());
        boolean applyMartyrsFund = !Boolean.FALSE.equals(emp.getApplyMartyrsFund());
        BigDecimal si         = deductionService.calculateSocialInsurance(settlementGross, hasSI);
        BigDecimal incomeTax  = deductionService.calculateIncomeTax(settlementGross, BigDecimal.ZERO, hasSI);
        BigDecimal martyrsFund = deductionService.calculateMartyrsFund(settlementGross, applyMartyrsFund);
        r.setSocialInsurance(si);
        r.setIncomeTax(incomeTax);
        r.setMartysFund(martyrsFund);

        // ── (-) Loan Recovery ────────────────────────────────────────────────
        BigDecimal loanBalance = loanService.getSettlementBalance(emp.getName());
        r.setLoanBalance(loanBalance);

        // ── Totals ────────────────────────────────────────────────────────────
        BigDecimal totalDeductions = si.add(incomeTax).add(martyrsFund).add(loanBalance);
        r.setTotalDeductions(totalDeductions);

        BigDecimal rawNet = settlementGross.subtract(totalDeductions);
        boolean netAlert  = rawNet.compareTo(BigDecimal.ZERO) < 0;
        r.setNetSettlement(rawNet.max(BigDecimal.ZERO));
        r.setNetAlert(netAlert);

        return r;
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private Employee requireActive(String name) {
        Employee emp = employeeRepo.findByName(name)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + name));
        if ("TERMINATED".equals(emp.getStatus())) {
            throw new RuntimeException(
                "الموظف " + name + " تم إنهاء خدمته مسبقاً. لا يمكن إجراء تسوية جديدة.");
        }
        return emp;
    }

    private String buildDocNumber(Employee emp, LocalDate date) {
        String year  = date != null ? String.valueOf(date.getYear()) : "0000";
        String code  = emp.getEmployeeCode() != null ? emp.getEmployeeCode() : emp.getName();
        return "TRM-" + year + "-" + code;
    }
}
