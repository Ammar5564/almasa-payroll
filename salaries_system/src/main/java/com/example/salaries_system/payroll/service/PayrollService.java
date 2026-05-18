package com.example.salaries_system.payroll.service;

import com.example.salaries_system.attendance.model.Attendance;
import com.example.salaries_system.attendance.repository.AttendanceRepository;
import com.example.salaries_system.attendance.service.VacationService;
import com.example.salaries_system.bonus.service.BonusService;
import com.example.salaries_system.deduction.dto.TaxBreakdown;
import com.example.salaries_system.deduction.service.DeductionService;
import com.example.salaries_system.disciplinary.service.DisciplinaryActionService;
import com.example.salaries_system.employee.model.Employee;
import com.example.salaries_system.employee.repository.EmployeeRepository;
import com.example.salaries_system.loan.service.LoanService;
import com.example.salaries_system.payroll.dto.PaySlipResponse;
import com.example.salaries_system.payroll.model.PayrollRecord;
import com.example.salaries_system.payroll.repository.PayrollRecordRepository;
import com.example.salaries_system.worktime.model.DepartmentWorkTime;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PayrollService {

    private final AttendanceRepository      attendanceRepository;
    private final EmployeeRepository        employeeRepository;
    private final PayrollRecordRepository   payrollRepository;
    private final BonusService              bonusService;
    private final DeductionService          deductionService;
    private final DisciplinaryActionService disciplinaryActionService;
    private final LoanService               loanService;

    public PayrollService(
            AttendanceRepository attendanceRepository,
            EmployeeRepository employeeRepository,
            PayrollRecordRepository payrollRepository,
            BonusService bonusService,
            DeductionService deductionService,
            DisciplinaryActionService disciplinaryActionService,
            LoanService loanService) {
        this.attendanceRepository      = attendanceRepository;
        this.employeeRepository        = employeeRepository;
        this.payrollRepository         = payrollRepository;
        this.bonusService              = bonusService;
        this.deductionService          = deductionService;
        this.disciplinaryActionService = disciplinaryActionService;
        this.loanService               = loanService;
    }

    /** Attaches Infotype 2006 leave quota snapshot to the payslip. */
    private void attachLeaveQuota(PaySlipResponse paySlip, Employee employee) {
        int entitlement    = VacationService.initialQuotaFor(employee);
        int currentBalance = employee.getVacationBalance() != null
                ? employee.getVacationBalance() : entitlement;
        // Guard: daysTaken must not be negative (e.g. quota was reset mid-year)
        if (currentBalance > entitlement) currentBalance = entitlement;
        paySlip.setLeaveQuota(new PaySlipResponse.LeaveQuota(entitlement, currentBalance));
    }

    // ── SAP-Schema Payroll Run ────────────────────────────────────────────────
    /**
     * Executes the full SAP processing schema for one employee×month:
     *
     *  Step 1  Import Basic Pay
     *  Step 2  Import Overtime / Bonus  →  Gross
     *  Step 3  Time Deductions (Late / Early / Absence)
     *  Step 4  Statutory Deductions: SI + Martyrs' Fund
     *  Step 5  Tax Calculation (Egyptian annualised slabs)
     *  Step 6  Other Deductions: Loans + Disciplinary
     *  Step 7  Net = Gross − All Deductions  (floor at 0; sets netAlert if negative)
     *
     * A locked record cannot be recalculated. Call lockPayrollPeriod() to lock.
     */
    public PayrollRecord calculateMonthlySalary(String employeeName, int year, int month) {
        Employee employee = requireEmployee(employeeName);

        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end   = start.withDayOfMonth(start.lengthOfMonth());

        // Check for existing locked record
        PayrollRecord record = payrollRepository
                .findByEmployee_NameAndMonth(employeeName, start)
                .orElse(null);
        if (record != null && Boolean.TRUE.equals(record.getLocked())) {
            throw new RuntimeException(
                "Payroll for " + employeeName + " – " + year + "/" + month +
                " is LOCKED. Unlock it first before recalculating.");
        }
        if (record == null) record = new PayrollRecord();

        List<Attendance> attendances =
                attendanceRepository.findByEmployee_NameAndDateBetween(employeeName, start, end);

        boolean hasSI = Boolean.TRUE.equals(employee.getHasSocialInsurance());
        boolean applyMartyrsFund = !Boolean.FALSE.equals(employee.getApplyMartyrsFund());

        // ── STEP 1-2: Basic + Additions → Gross ──────────────────────────────
        BigDecimal overtimePay = bonusService.calculateOvertime(employee, attendances);
        BigDecimal bonus       = bonusService.applyBonus(BigDecimal.ZERO);
        BigDecimal grossSalary = employee.getBaseSalary().add(overtimePay).add(bonus);

        // ── STEP 3: Time Deductions ───────────────────────────────────────────
        BigDecimal lateDeduction       = deductionService.calculateLateDeduction(employee, attendances);
        BigDecimal leaveEarlyDeduction = deductionService.calculateLeaveEarlyDeduction(employee, attendances);
        BigDecimal absenceDeduction    = deductionService.calculateAbsenceDeduction(employee, attendances);

        // ── STEP 4: Statutory ─────────────────────────────────────────────────
        BigDecimal taxBasePenalties = lateDeduction.add(leaveEarlyDeduction).add(absenceDeduction);
        BigDecimal insurance    = deductionService.calculateSocialInsurance(grossSalary, hasSI);
        BigDecimal incomeTax    = deductionService.calculateIncomeTax(grossSalary, taxBasePenalties, hasSI);
        BigDecimal martyrsFund  = deductionService.calculateMartyrsFund(grossSalary, applyMartyrsFund);

        // ── STEP 5: Other deductions ──────────────────────────────────────────
        BigDecimal loanDeduction         = deductionService.calculateLoanDeduction(employee, start);
        BigDecimal disciplinaryPenalties = disciplinaryActionService
                .calculateDisciplinaryPenalties(employee, year, month);

        // ── STEP 6: Net ───────────────────────────────────────────────────────
        BigDecimal rawNet = grossSalary
                .subtract(lateDeduction)
                .subtract(leaveEarlyDeduction)
                .subtract(absenceDeduction)
                .subtract(insurance)
                .subtract(incomeTax)
                .subtract(martyrsFund)
                .subtract(loanDeduction)
                .subtract(disciplinaryPenalties);

        boolean netAlert   = rawNet.compareTo(BigDecimal.ZERO) < 0;
        BigDecimal finalSalary = rawNet.max(BigDecimal.ZERO);

        // ── Calculation trace ─────────────────────────────────────────────────
        String trace = buildTrace(
                employee.getBaseSalary(), overtimePay, bonus, grossSalary,
                lateDeduction, leaveEarlyDeduction, absenceDeduction,
                insurance, incomeTax, martyrsFund,
                loanDeduction, disciplinaryPenalties,
                rawNet, finalSalary, netAlert
        );

        String earnedPeriod = year + "-" + String.format("%02d", month);

        // ── Persist ───────────────────────────────────────────────────────────
        record.setEmployee(employee);
        record.setMonth(start);
        record.setOvertimePay(overtimePay);
        record.setBonus(bonus);
        record.setLateDeduction(lateDeduction);
        record.setLeaveEarlyDeduction(leaveEarlyDeduction);
        record.setAbsenceDeduction(absenceDeduction);
        record.setLoanDeduction(loanDeduction);
        record.setPenalties(disciplinaryPenalties);
        record.setSocialInsurance(insurance);
        record.setIncomeTax(incomeTax);
        record.setMartysFundDeduction(martyrsFund);
        record.setFinalSalary(finalSalary);
        record.setNetAlert(netAlert);
        record.setCalculationTrace(trace);
        record.setEarnedPeriod(earnedPeriod);

        PayrollRecord saved = payrollRepository.save(record);

        // ── SAP Post-Tax: commit loan deductions (mark installments paid, update balance)
        loanService.commitMonthlyDeduction(employee, start);

        // ── 50% Net Salary Validation (Egyptian Labour Law best practice)
        if (loanDeduction.compareTo(BigDecimal.ZERO) > 0 && finalSalary.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal loanRatio = loanDeduction.divide(finalSalary.add(loanDeduction), 4, RoundingMode.HALF_UP);
            if (loanRatio.compareTo(new BigDecimal("0.50")) > 0) {
                saved.setCalculationTrace(
                    saved.getCalculationTrace() +
                    "\n⚠ 50%-RULE ALERT: Loan installment (" + loanDeduction.toPlainString() +
                    " EGP) exceeds 50% of net pay (" + finalSalary.add(loanDeduction).toPlainString() +
                    " EGP). HR review recommended (Egyptian Labour Law).\n");
                payrollRepository.save(saved);
            }
        }

        return saved;
    }

    // ── Pay Slip ──────────────────────────────────────────────────────────────

    public PaySlipResponse generatePaySlip(String employeeName, int year, int month) {
        Employee employee   = requireEmployee(employeeName);
        LocalDate monthDate = LocalDate.of(year, month, 1);

        PayrollRecord existing = payrollRepository
                .findByEmployee_NameAndMonth(employeeName, monthDate)
                .orElse(null);

        PaySlipResponse paySlip = new PaySlipResponse();
        paySlip.setEmployeeCode(employee.getEmployeeCode());
        paySlip.setEmployeeName(employee.getName());
        paySlip.setJobTitle(employee.getJobTitle());
        if (employee.getDepartmentWorkTime() != null) {
            paySlip.setDepartmentName(employee.getDepartmentWorkTime().getDepartmentName());
            paySlip.setBranchName(employee.getDepartmentWorkTime().getBranchName());
        }
        paySlip.setMonth(getMonthName(month) + " " + year);
        paySlip.setEarnedPeriod(year + "-" + String.format("%02d", month));

        if (existing != null) {
            populateFromRecord(paySlip, existing, employee);
        } else {
            populateFromCalculation(paySlip, employee, year, month);
        }

        calculateTotals(paySlip);
        attachTaxBreakdown(paySlip, employee);
        attachLeaveQuota(paySlip, employee);
        return paySlip;
    }

    // ── Tax Breakdown (standalone) ────────────────────────────────────────────

    public TaxBreakdown getTaxBreakdown(String employeeName, int year, int month) {
        Employee employee = requireEmployee(employeeName);
        LocalDate start   = LocalDate.of(year, month, 1);
        LocalDate end     = start.withDayOfMonth(start.lengthOfMonth());
        List<Attendance> attendances =
                attendanceRepository.findByEmployee_NameAndDateBetween(employeeName, start, end);

        boolean hasSI = Boolean.TRUE.equals(employee.getHasSocialInsurance());
        boolean applyMartyrsFund = !Boolean.FALSE.equals(employee.getApplyMartyrsFund());

        BigDecimal overtimePay = bonusService.calculateOvertime(employee, attendances);
        BigDecimal bonus       = bonusService.applyBonus(BigDecimal.ZERO);
        BigDecimal grossSalary = employee.getBaseSalary().add(overtimePay).add(bonus);

        BigDecimal lateDeduction         = deductionService.calculateLateDeduction(employee, attendances);
        BigDecimal leaveEarlyDeduction   = deductionService.calculateLeaveEarlyDeduction(employee, attendances);
        BigDecimal absenceDeduction      = deductionService.calculateAbsenceDeduction(employee, attendances);
        BigDecimal disciplinaryPenalties = disciplinaryActionService
                .calculateDisciplinaryPenalties(employee, year, month);

        BigDecimal penaltiesForTax = lateDeduction.add(leaveEarlyDeduction)
                .add(absenceDeduction).add(disciplinaryPenalties);

        return deductionService.calculateTaxBreakdown(grossSalary, penaltiesForTax, hasSI, applyMartyrsFund);
    }

    // ── Payroll Control Record Lock ───────────────────────────────────────────

    /**
     * Locks all payroll records for the given month.
     * After locking, no recalculation is possible without manual DB intervention.
     * Returns the count of records locked.
     */
    public int lockPayrollPeriod(int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end   = start.withDayOfMonth(start.lengthOfMonth());
        List<PayrollRecord> records = payrollRepository.findByMonthBetween(start, end);
        records.forEach(r -> r.setLocked(true));
        payrollRepository.saveAll(records);
        return records.size();
    }

    // ── Bank Transfer File ────────────────────────────────────────────────────

    /**
     * Generates an XLSX workbook for the bank transfer file.
     * Columns: Employee Code, Employee Name, Bank Account, Net Pay (EGP), Alert
     */
    public byte[] generateBankTransferXlsx(int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end   = start.withDayOfMonth(start.lengthOfMonth());
        List<PayrollRecord> records = payrollRepository.findByMonthBetween(start, end);

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Bank Transfer " + year + "-" + String.format("%02d", month));
            sheet.setDefaultColumnWidth(22);

            // Header style
            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            // Alert style (red fill)
            CellStyle alertStyle = wb.createCellStyle();
            alertStyle.setFillForegroundColor(IndexedColors.RED.getIndex());
            alertStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Title row
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Bank Transfer File — " + year + "/" + String.format("%02d", month));
            CellStyle titleStyle = wb.createCellStyle();
            Font titleFont = wb.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 4));

            // Header row
            String[] headers = {"Employee Code", "Employee Name", "Bank Account", "Net Pay (EGP)", "Alert"};
            Row headerRow = sheet.createRow(1);
            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
            }

            // Data rows
            int rowIdx = 2;
            for (PayrollRecord r : records) {
                Employee emp = r.getEmployee();
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(emp.getEmployeeCode() != null ? emp.getEmployeeCode() : "");
                row.createCell(1).setCellValue(emp.getName());
                row.createCell(2).setCellValue(emp.getBankAccount() != null ? emp.getBankAccount() : "NOT SET");
                Cell netCell = row.createCell(3);
                netCell.setCellValue(r.getFinalSalary().setScale(2, RoundingMode.HALF_UP).doubleValue());
                Cell alertCell = row.createCell(4);
                if (Boolean.TRUE.equals(r.getNetAlert())) {
                    alertCell.setCellValue("NET ALERT");
                    alertCell.setCellStyle(alertStyle);
                } else {
                    alertCell.setCellValue("");
                }
            }

            // Total row
            Row totalRow = sheet.createRow(rowIdx);
            CellStyle totalStyle = wb.createCellStyle();
            Font totalFont = wb.createFont();
            totalFont.setBold(true);
            totalStyle.setFont(totalFont);
            totalStyle.setBorderTop(BorderStyle.MEDIUM);
            Cell totalLabel = totalRow.createCell(2);
            totalLabel.setCellValue("TOTAL");
            totalLabel.setCellStyle(totalStyle);
            double totalNet = records.stream()
                    .mapToDouble(r -> r.getFinalSalary().doubleValue()).sum();
            Cell totalNetCell = totalRow.createCell(3);
            totalNetCell.setCellValue(totalNet);
            totalNetCell.setCellStyle(totalStyle);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate bank transfer XLSX", e);
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void populateFromRecord(PaySlipResponse paySlip, PayrollRecord r, Employee employee) {
        paySlip.setBaseSalary(employee.getBaseSalary());
        paySlip.getAdditions().setOvertimePay(r.getOvertimePay());
        paySlip.getAdditions().setBonus(r.getBonus());
        paySlip.getDeductions().setLateDeduction(r.getLateDeduction());
        paySlip.getDeductions().setLeaveEarlyDeduction(r.getLeaveEarlyDeduction());
        paySlip.getDeductions().setAbsenceDeduction(r.getAbsenceDeduction());
        paySlip.getDeductions().setLoanDeduction(r.getLoanDeduction());
        paySlip.getDeductions().setPenalties(r.getPenalties());
        paySlip.getDeductions().setSocialInsurance(r.getSocialInsurance());
        paySlip.getDeductions().setIncomeTax(r.getIncomeTax());
        paySlip.getDeductions().setMartysFundDeduction(r.getMartysFundDeduction());
        paySlip.setLocked(Boolean.TRUE.equals(r.getLocked()));
        paySlip.setNetAlert(Boolean.TRUE.equals(r.getNetAlert()));
        paySlip.setCalculationTrace(r.getCalculationTrace());
        if (r.getEarnedPeriod() != null) paySlip.setEarnedPeriod(r.getEarnedPeriod());
    }

    private void populateFromCalculation(PaySlipResponse paySlip, Employee employee,
                                         int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end   = start.withDayOfMonth(start.lengthOfMonth());
        List<Attendance> attendances = attendanceRepository
                .findByEmployee_NameAndDateBetween(employee.getName(), start, end);

        boolean hasSI = Boolean.TRUE.equals(employee.getHasSocialInsurance());
        boolean applyMartyrsFund = !Boolean.FALSE.equals(employee.getApplyMartyrsFund());

        BigDecimal overtimePay = bonusService.calculateOvertime(employee, attendances);
        BigDecimal bonus       = bonusService.applyBonus(BigDecimal.ZERO);
        BigDecimal grossSalary = employee.getBaseSalary().add(overtimePay).add(bonus);

        BigDecimal lateDeduction       = deductionService.calculateLateDeduction(employee, attendances);
        BigDecimal leaveEarlyDeduction = deductionService.calculateLeaveEarlyDeduction(employee, attendances);
        BigDecimal absenceDeduction    = deductionService.calculateAbsenceDeduction(employee, attendances);
        BigDecimal loanDeduction         = deductionService.calculateLoanDeduction(employee, start);
        BigDecimal disciplinaryPenalties = disciplinaryActionService
                .calculateDisciplinaryPenalties(employee, year, month);

        BigDecimal taxBasePenalties = lateDeduction.add(leaveEarlyDeduction)
                .add(absenceDeduction).add(disciplinaryPenalties);

        BigDecimal insurance   = deductionService.calculateSocialInsurance(grossSalary, hasSI);
        BigDecimal incomeTax   = deductionService.calculateIncomeTax(grossSalary, taxBasePenalties, hasSI);
        BigDecimal martyrsFund = deductionService.calculateMartyrsFund(grossSalary, applyMartyrsFund);

        paySlip.setBaseSalary(employee.getBaseSalary());
        paySlip.getAdditions().setOvertimePay(overtimePay);
        paySlip.getAdditions().setBonus(bonus);
        paySlip.getDeductions().setLateDeduction(lateDeduction);
        paySlip.getDeductions().setLeaveEarlyDeduction(leaveEarlyDeduction);
        paySlip.getDeductions().setAbsenceDeduction(absenceDeduction);
        paySlip.getDeductions().setLoanDeduction(loanDeduction);
        paySlip.getDeductions().setPenalties(disciplinaryPenalties);
        paySlip.getDeductions().setSocialInsurance(insurance);
        paySlip.getDeductions().setIncomeTax(incomeTax);
        paySlip.getDeductions().setMartysFundDeduction(martyrsFund);

        // Build trace for live (un-saved) payslip view
        BigDecimal rawNet = grossSalary
                .subtract(lateDeduction).subtract(leaveEarlyDeduction).subtract(absenceDeduction)
                .subtract(insurance).subtract(incomeTax).subtract(martyrsFund)
                .subtract(loanDeduction).subtract(disciplinaryPenalties);
        boolean netAlert = rawNet.compareTo(BigDecimal.ZERO) < 0;
        paySlip.setNetAlert(netAlert);
        paySlip.setCalculationTrace(buildTrace(
                employee.getBaseSalary(), overtimePay, bonus, grossSalary,
                lateDeduction, leaveEarlyDeduction, absenceDeduction,
                insurance, incomeTax, martyrsFund,
                loanDeduction, disciplinaryPenalties, rawNet,
                rawNet.max(BigDecimal.ZERO), netAlert));
    }

    private void calculateTotals(PaySlipResponse p) {
        BigDecimal totalAdditions = p.getAdditions().getOvertimePay()
                .add(p.getAdditions().getBonus())
                .add(p.getAdditions().getArrears())
                .add(p.getAdditions().getAllowances());
        p.setTotalAdditions(totalAdditions);

        BigDecimal grossPay = p.getBaseSalary().add(totalAdditions);
        p.setGrossPay(grossPay);

        BigDecimal timeDed = p.getDeductions().getLateDeduction()
                .add(p.getDeductions().getLeaveEarlyDeduction())
                .add(p.getDeductions().getAbsenceDeduction());
        p.setTimeDeductions(timeDed);
        p.setAdjustedGross(grossPay.subtract(timeDed));

        BigDecimal totalDeductions = timeDed
                .add(p.getDeductions().getLoanDeduction())
                .add(p.getDeductions().getPenalties())
                .add(p.getDeductions().getSocialInsurance())
                .add(p.getDeductions().getIncomeTax())
                .add(p.getDeductions().getMartysFundDeduction());
        p.setTotalDeductions(totalDeductions);

        BigDecimal net = grossPay.subtract(totalDeductions);
        p.setNetSalary(net.max(BigDecimal.ZERO));
    }

    private void attachTaxBreakdown(PaySlipResponse paySlip, Employee employee) {
        BigDecimal grossSalary = paySlip.getGrossPay();
        BigDecimal penaltiesForTax = paySlip.getDeductions().getLateDeduction()
                .add(paySlip.getDeductions().getLeaveEarlyDeduction())
                .add(paySlip.getDeductions().getAbsenceDeduction())
                .add(paySlip.getDeductions().getPenalties());
        boolean hasSI = Boolean.TRUE.equals(employee.getHasSocialInsurance());
        boolean applyMartyrsFund = !Boolean.FALSE.equals(employee.getApplyMartyrsFund());
        TaxBreakdown breakdown = deductionService.calculateTaxBreakdown(grossSalary, penaltiesForTax, hasSI, applyMartyrsFund);
        paySlip.setTaxBreakdown(breakdown);
    }

    /**
     * Builds a human-readable, step-by-step calculation trace for HR auditing.
     * Mirrors the SAP Remuneration Statement logic exactly.
     */
    private String buildTrace(
            BigDecimal basicSalary, BigDecimal overtime, BigDecimal bonus, BigDecimal gross,
            BigDecimal late, BigDecimal earlyLeave, BigDecimal absence,
            BigDecimal si, BigDecimal tax, BigDecimal martyrs,
            BigDecimal loan, BigDecimal disciplinary,
            BigDecimal rawNet, BigDecimal finalNet, boolean netAlert) {

        String sep = "─────────────────────────────────────────────────────\n";
        BigDecimal daily = basicSalary.divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP);

        StringBuilder t = new StringBuilder();
        t.append("SAP PAYROLL CALCULATION TRACE\n").append(sep);
        t.append(line(1,  "Basic Salary",                  basicSalary));
        t.append(line(2,  "Overtime Pay",                  overtime));
        t.append(line(3,  "Bonus / Allowances",            bonus));
        t.append(sep);
        t.append(line(4,  "GROSS PAY  (1+2+3)",            gross));
        t.append(String.format("          Daily Rate = %,.4f ÷ 30 = %,.4f EGP\n",
                basicSalary.doubleValue(), daily.doubleValue()));
        t.append(sep);
        t.append(line(5,  "Late Deduction",                late.negate()));
        t.append(line(6,  "Leave Early Deduction",         earlyLeave.negate()));
        t.append(line(7,  "Absence Deduction",             absence.negate()));
        t.append(sep);
        t.append(line(8,  "ADJUSTED GROSS  (4−5−6−7)",
                gross.subtract(late).subtract(earlyLeave).subtract(absence)));
        t.append(sep);
        t.append(line(9,  "Social Insurance (11%)",        si.negate()));
        t.append(line(10, "Income Tax (Egyptian Slabs)",   tax.negate()));
        t.append(line(11, "Martyrs' Fund (0.05%)",         martyrs.negate()));
        t.append(sep);
        t.append(line(12, "Loan Deduction",                loan.negate()));
        t.append(line(13, "Disciplinary Penalties",        disciplinary.negate()));
        t.append(sep);
        t.append(line(14, "RAW NET",                       rawNet));
        if (netAlert) {
            t.append("⚠ NET ALERT: Raw net was negative — floored at 0. HR review required.\n");
        }
        t.append(line(15, "NET PAY (final)",               finalNet));
        return t.toString();
    }

    private String line(int step, String label, BigDecimal value) {
        return String.format("STEP %-2d  %-35s = %,15.2f EGP\n",
                step, label, value.doubleValue());
    }

    private Employee requireEmployee(String name) {
        return employeeRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + name));
    }

    private String getMonthName(int month) {
        String[] months = {
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        };
        return months[month - 1];
    }
}
