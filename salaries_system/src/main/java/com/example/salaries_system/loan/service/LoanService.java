package com.example.salaries_system.loan.service;

import com.example.salaries_system.employee.model.Employee;
import com.example.salaries_system.employee.repository.EmployeeRepository;
import com.example.salaries_system.loan.dto.InstallmentRequest;
import com.example.salaries_system.loan.dto.LoanRequest;
import com.example.salaries_system.loan.model.Loan;
import com.example.salaries_system.loan.model.LoanInstallment;
import com.example.salaries_system.loan.model.LoanType;
import com.example.salaries_system.loan.repository.LoanInstallmentRepository;
import com.example.salaries_system.loan.repository.LoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * SAP Infotype 0045 — Loan Business Logic.
 *
 * Handles:
 *  - Loan creation (SALARY_ADVANCE / COMPANY_LOAN)
 *  - Monthly deduction commitment (mark paid, update balance, auto-close)
 *  - Manual cash repayment
 *  - End-of-service settlement balance
 */
@Service
public class LoanService {

    private final LoanRepository            loanRepo;
    private final LoanInstallmentRepository installmentRepo;
    private final EmployeeRepository        employeeRepo;

    public LoanService(LoanRepository loanRepo,
                       LoanInstallmentRepository installmentRepo,
                       EmployeeRepository employeeRepo) {
        this.loanRepo        = loanRepo;
        this.installmentRepo = installmentRepo;
        this.employeeRepo    = employeeRepo;
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public Loan createLoan(String employeeName, LoanRequest req) {
        if (req.getTotalAmount() == null || req.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Loan amount must be positive.");
        }

        Employee employee = employeeRepo.findByName(employeeName)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeName));

        LoanType type = req.getLoanType() != null ? req.getLoanType() : LoanType.COMPANY_LOAN;

        // Repayment start defaults to the first day of next month
        LocalDate repayStart = req.getRepaymentStartDate() != null
                ? req.getRepaymentStartDate().withDayOfMonth(1)
                : LocalDate.now().plusMonths(1).withDayOfMonth(1);

        BigDecimal monthly;
        if (type == LoanType.SALARY_ADVANCE) {
            monthly = req.getTotalAmount(); // full deduction in one shot
        } else if (req.getMonthlyInstallment() != null && req.getMonthlyInstallment().compareTo(BigDecimal.ZERO) > 0) {
            monthly = req.getMonthlyInstallment();
        } else {
            // Default: spread over 12 months
            monthly = req.getTotalAmount().divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
        }

        Loan loan = new Loan();
        loan.setEmployee(employee);
        loan.setLoanType(type);
        loan.setTotalAmount(req.getTotalAmount());
        loan.setMonthlyInstallment(monthly);
        loan.setRemainingBalance(req.getTotalAmount());
        loan.setRepaymentStartDate(repayStart);
        loan.setClosed(false);
        loan.setCreatedAt(LocalDate.now());

        Loan saved = loanRepo.save(loan);

        List<LoanInstallment> installments = buildInstallments(saved, req, repayStart, monthly);
        installmentRepo.saveAll(installments);

        return saved;
    }

    // ── Payroll Commit ────────────────────────────────────────────────────────

    /**
     * Called by PayrollService after the payroll record is saved.
     * Marks the month's installments as paid and decrements remainingBalance.
     * Auto-closes the loan when balance reaches 0.
     *
     * @return total amount actually committed this month
     */
    @Transactional
    public BigDecimal commitMonthlyDeduction(Employee employee, LocalDate month) {
        LocalDate monthStart = month.withDayOfMonth(1);
        List<Loan> activeLoans = loanRepo.findByEmployee_NameAndClosedFalse(employee.getName());

        BigDecimal totalCommitted = BigDecimal.ZERO;

        for (Loan loan : activeLoans) {
            if (loan.getRepaymentStartDate() != null
                    && monthStart.isBefore(loan.getRepaymentStartDate())) {
                // SAP "sleep" — deductions haven't started yet
                continue;
            }

            // Find the unpaid installment for this month
            LoanInstallment inst = loan.getInstallments().stream()
                    .filter(i -> !i.isPaid()
                            && i.getMonth() != null
                            && i.getMonth().withDayOfMonth(1).equals(monthStart))
                    .findFirst().orElse(null);

            if (inst == null) continue;

            BigDecimal remaining = loan.getRemainingBalance() != null
                    ? loan.getRemainingBalance()
                    : BigDecimal.ZERO;

            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                loan.setClosed(true);
                loanRepo.save(loan);
                continue;
            }

            // SAP stop-condition: deduct min(installment, remaining)
            BigDecimal toDeduct = inst.getAmount().min(remaining);

            inst.setPaid(true);
            inst.setAmount(toDeduct); // adjust to actual deducted amount
            installmentRepo.save(inst);

            BigDecimal newBalance = remaining.subtract(toDeduct).max(BigDecimal.ZERO);
            loan.setRemainingBalance(newBalance);
            if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
                loan.setClosed(true);
            }
            loanRepo.save(loan);

            totalCommitted = totalCommitted.add(toDeduct);
        }

        return totalCommitted;
    }

    // ── Manual Cash Repayment ─────────────────────────────────────────────────

    /**
     * Records a cash repayment made at the office.
     * Reduces remainingBalance and auto-closes if fully paid.
     */
    @Transactional
    public Loan recordCashPayment(Long loanId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Payment amount must be positive.");
        }
        Loan loan = loanRepo.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found: " + loanId));
        if (Boolean.TRUE.equals(loan.getClosed())) {
            throw new RuntimeException("Loan is already closed.");
        }

        BigDecimal newBalance = loan.getRemainingBalance().subtract(amount).max(BigDecimal.ZERO);
        loan.setRemainingBalance(newBalance);
        if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
            loan.setClosed(true);
        }
        return loanRepo.save(loan);
    }

    // ── End-of-Service Settlement ─────────────────────────────────────────────

    /**
     * Returns the total outstanding loan balance for the employee.
     * Called during termination/resignation to determine settlement deduction.
     */
    public BigDecimal getSettlementBalance(String employeeName) {
        return loanRepo.findByEmployee_NameAndClosedFalse(employeeName).stream()
                .map(l -> l.getRemainingBalance() != null ? l.getRemainingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Closes all active (non-closed) loans for the given employee.
     * Called by the End-of-Service Settlement module on confirmation.
     *
     * @return number of loans closed
     */
    @Transactional
    public int closeAllActiveLoans(Employee employee) {
        List<Loan> activeLoans = loanRepo.findByEmployee_NameAndClosedFalse(employee.getName());
        for (Loan loan : activeLoans) {
            loan.setClosed(true);
        }
        loanRepo.saveAll(activeLoans);
        return activeLoans.size();
    }

    // ── Query ─────────────────────────────────────────────────────────────────

    public List<Loan> getEmployeeLoans(String employeeName) {
        return loanRepo.findByEmployee_Name(employeeName);
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private List<LoanInstallment> buildInstallments(Loan loan, LoanRequest req,
                                                     LocalDate repayStart, BigDecimal monthly) {
        List<LoanInstallment> list = new ArrayList<>();

        // If custom installments were provided, use them
        if (req.getCustomInstallments() != null && !req.getCustomInstallments().isEmpty()) {
            validateCustomInstallments(req.getTotalAmount(), req.getCustomInstallments());
            for (InstallmentRequest r : req.getCustomInstallments()) {
                LoanInstallment i = new LoanInstallment();
                i.setLoan(loan);
                i.setMonth(r.getDueDate());
                i.setMonthName(r.getMonthName());
                i.setAmount(r.getAmount());
                i.setPaid(false);
                list.add(i);
            }
            return list;
        }

        // Auto-generate installments
        int numberOfInstallments;
        if (loan.getLoanType() == LoanType.SALARY_ADVANCE) {
            numberOfInstallments = 1;
        } else {
            // Round up: ceil(total / monthly)
            BigDecimal count = loan.getTotalAmount()
                    .divide(monthly, 0, RoundingMode.CEILING);
            numberOfInstallments = count.intValue();
        }

        BigDecimal remaining = loan.getTotalAmount();
        for (int i = 0; i < numberOfInstallments; i++) {
            BigDecimal amount = remaining.min(monthly);
            LoanInstallment inst = new LoanInstallment();
            inst.setLoan(loan);
            inst.setMonth(repayStart.plusMonths(i));
            inst.setMonthName("قسط " + (i + 1));
            inst.setAmount(amount);
            inst.setPaid(false);
            list.add(inst);
            remaining = remaining.subtract(amount);
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;
        }

        return list;
    }

    private void validateCustomInstallments(BigDecimal total, List<InstallmentRequest> custom) {
        BigDecimal sum = custom.stream()
                .map(InstallmentRequest::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (sum.compareTo(total) != 0) {
            throw new RuntimeException(
                    "Sum of installments (" + sum + ") must equal total loan amount (" + total + ").");
        }
        for (InstallmentRequest r : custom) {
            if (r.getDueDate() == null)
                throw new RuntimeException("Due date is required for all installments.");
            if (r.getAmount() == null || r.getAmount().compareTo(BigDecimal.ZERO) <= 0)
                throw new RuntimeException("Installment amounts must be positive.");
        }
    }
}
