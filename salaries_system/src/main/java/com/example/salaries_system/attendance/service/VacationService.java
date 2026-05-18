package com.example.salaries_system.attendance.service;

import com.example.salaries_system.attendance.dto.AbsenceHistoryRecord;
import com.example.salaries_system.attendance.dto.LeaveRequest;
import com.example.salaries_system.attendance.dto.LeaveResponse;
import com.example.salaries_system.attendance.model.Attendance;
import com.example.salaries_system.attendance.model.AbsenceType;
import com.example.salaries_system.attendance.repository.AttendanceRepository;
import com.example.salaries_system.employee.model.Employee;
import com.example.salaries_system.employee.repository.EmployeeRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * SAP HCM Infotype 2001/2006 — Absence & Vacation Quota Service.
 *
 * Handles three leave types with an automatic Friday filter:
 *   ANNUAL_LEAVE      — deducts from vacation balance; no payroll deduction.
 *   UNEXCUSED_ABSENCE — daily-rate deduction per working day; no balance change.
 *   MANUAL_DEDUCTION  — exact EGP amount deducted once from the next payroll run.
 */
@Service
public class VacationService {

    /** Default annual leave quota (Egyptian Labour Law Art. 47). */
    public static final int DEFAULT_QUOTA      = 21;
    /** Quota for employees aged 50+ (Egyptian Labour Law Art. 47). */
    public static final int SENIOR_QUOTA       = 30;
    /** Age threshold for senior quota. */
    public static final int SENIOR_AGE         = 50;

    private final AttendanceRepository attendanceRepo;
    private final EmployeeRepository   employeeRepo;

    public VacationService(AttendanceRepository attendanceRepo, EmployeeRepository employeeRepo) {
        this.attendanceRepo = attendanceRepo;
        this.employeeRepo   = employeeRepo;
    }

    // ── Initial Quota ─────────────────────────────────────────────────────────

    /**
     * Returns the legally-mandated initial annual leave quota for an employee
     * based on Egyptian Labour Law: 30 days if age >= 50, otherwise 21 days.
     */
    public static int initialQuotaFor(Employee employee) {
        Integer age = employee.getAge();
        return (age != null && age >= SENIOR_AGE) ? SENIOR_QUOTA : DEFAULT_QUOTA;
    }

    // ── Record Leave Entry ────────────────────────────────────────────────────

    /**
     * Core leave-entry method implementing the three options.
     * Friday filter is applied automatically — Fridays are never counted
     * against the vacation balance or payroll deduction.
     */
    @Transactional
    public LeaveResponse recordLeave(LeaveRequest req) {
        validateRequest(req);

        Employee employee = employeeRepo.findByName(req.getEmployeeName())
                .orElseThrow(() -> new RuntimeException("Employee not found: " + req.getEmployeeName()));

        // ── Step 1: collect working days (exclude Fridays) ──────────────────
        List<LocalDate> workingDays = collectWorkingDays(req.getStartDate(), req.getEndDate());
        int calendarDays = (int) req.getStartDate().datesUntil(req.getEndDate().plusDays(1)).count();

        AbsenceType leaveType = req.getLeaveType();
        BigDecimal payrollDeduction  = BigDecimal.ZERO;
        int        vacationUsed      = 0;
        int        currentBalance    = effectiveBalance(employee);
        String     message           = "";

        // ── Step 2: process according to leave type ─────────────────────────
        if (leaveType == AbsenceType.ANNUAL_LEAVE || leaveType == AbsenceType.WITH_PERMISSION) {
            // Validate balance
            if (currentBalance < workingDays.size()) {
                throw new RuntimeException(
                    "رصيد الإجازة غير كافٍ / Insufficient vacation balance: " +
                    "available=" + currentBalance + ", requested=" + workingDays.size());
            }

            for (LocalDate day : workingDays) {
                saveOrUpdateAttendance(employee, day, AbsenceType.ANNUAL_LEAVE, null, null);
            }

            // Deduct from balance
            vacationUsed = workingDays.size();
            int newBalance = currentBalance - vacationUsed;
            employee.setVacationBalance(newBalance);
            employeeRepo.save(employee);
            currentBalance = newBalance;

            if (currentBalance <= 5) {
                message = "⚠ تنبيه: رصيد الإجازة المتبقي " + currentBalance + " يوم فقط.";
            }
            payrollDeduction = BigDecimal.ZERO;

        } else if (leaveType == AbsenceType.UNEXCUSED_ABSENCE || leaveType == AbsenceType.WITHOUT_PERMISSION) {
            BigDecimal multiplier = req.getPenaltyMultiplier() != null
                    ? req.getPenaltyMultiplier() : BigDecimal.ONE;
            BigDecimal dailySalary = employee.getBaseSalary()
                    .divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP);

            for (LocalDate day : workingDays) {
                saveOrUpdateAttendance(employee, day, AbsenceType.UNEXCUSED_ABSENCE, null, multiplier);
            }

            payrollDeduction = dailySalary
                    .multiply(BigDecimal.valueOf(workingDays.size()))
                    .multiply(multiplier)
                    .setScale(2, RoundingMode.HALF_UP);

        } else if (leaveType == AbsenceType.MANUAL_DEDUCTION) {
            if (req.getManualDeductionAmount() == null
                    || req.getManualDeductionAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("المبلغ مطلوب لنوع الخصم الإداري / Manual deduction amount is required.");
            }

            // Single attendance record on the start date (carries the EGP amount)
            saveOrUpdateAttendance(employee, req.getStartDate(),
                    AbsenceType.MANUAL_DEDUCTION,
                    req.getManualDeductionAmount(),
                    null);

            payrollDeduction = req.getManualDeductionAmount();
            message = "سيتم خصم " + payrollDeduction.toPlainString() + " جنيه من راتب الشهر القادم.";
        }

        return new LeaveResponse(
                employee.getName(),
                leaveType.name(),
                calendarDays,
                workingDays.size(),
                vacationUsed,
                currentBalance,
                payrollDeduction,
                workingDays.isEmpty() ? List.of(req.getStartDate()) : workingDays,
                message
        );
    }

    // ── Query Helpers ─────────────────────────────────────────────────────────

    public int getVacationBalance(String employeeName) {
        Employee emp = employeeRepo.findByName(employeeName)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeName));
        return effectiveBalance(emp);
    }

    public List<Attendance> getLeaveHistory(String employeeName) {
        return attendanceRepo.findByEmployee_NameAndAbsenceTypeIsNotNull(employeeName);
    }

    /**
     * Manager's global absence history with optional name search and date range filter.
     * Returns enriched records including computed deduction amounts and status labels.
     */
    public List<AbsenceHistoryRecord> getAbsenceHistoryRecords(
            String nameFilter, LocalDate from, LocalDate to) {

        boolean hasName  = nameFilter != null && !nameFilter.isBlank();
        boolean hasRange = from != null && to != null;

        List<Attendance> records;
        if (hasName && hasRange) {
            records = attendanceRepo
                    .findByEmployee_NameContainingIgnoreCaseAndAbsenceTypeIsNotNullAndDateBetween(
                            nameFilter, from, to);
        } else if (hasName) {
            records = attendanceRepo
                    .findByEmployee_NameContainingIgnoreCaseAndAbsenceTypeIsNotNull(nameFilter);
        } else if (hasRange) {
            records = attendanceRepo
                    .findByAbsenceTypeIsNotNullAndDateBetween(from, to);
        } else {
            records = attendanceRepo.findByAbsenceTypeIsNotNull();
        }

        return records.stream()
                .map(this::toHistoryRecord)
                .collect(Collectors.toList());
    }

    private AbsenceHistoryRecord toHistoryRecord(Attendance a) {
        AbsenceType type       = a.getAbsenceType();
        String      typeName   = type != null ? type.name() : "UNKNOWN";
        BigDecimal  deduction;
        String      status;

        if (type == AbsenceType.ANNUAL_LEAVE || type == AbsenceType.WITH_PERMISSION) {
            deduction = BigDecimal.ZERO;
            status    = "مدفوعة";

        } else if (type == AbsenceType.MANUAL_DEDUCTION) {
            deduction = (a.getManualDeduction() != null) ? a.getManualDeduction() : BigDecimal.ZERO;
            status    = "خصم إداري";

        } else {
            // UNEXCUSED_ABSENCE or WITHOUT_PERMISSION or fallback
            BigDecimal multiplier = (a.getPenaltyMultiplier() != null
                    && a.getPenaltyMultiplier().compareTo(BigDecimal.ZERO) > 0)
                    ? a.getPenaltyMultiplier() : BigDecimal.ONE;

            BigDecimal dailySalary = (a.getEmployee() != null && a.getEmployee().getBaseSalary() != null)
                    ? a.getEmployee().getBaseSalary()
                            .divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            deduction = dailySalary.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
            status    = "غياب – خصم";
        }

        return new AbsenceHistoryRecord(
                a.getEmployee() != null ? a.getEmployee().getName() : "—",
                a.getDate(),
                typeName,
                deduction,
                status
        );
    }

    // ── Absence History XLSX Export ────────────────────────────────────────────

    /**
     * Generates an XLSX file for the manager's global absence history,
     * applying the same optional filters as {@link #getAbsenceHistoryRecords}.
     */
    public byte[] exportAbsenceHistoryXlsx(String nameFilter, LocalDate from, LocalDate to) {
        List<AbsenceHistoryRecord> records = getAbsenceHistoryRecords(nameFilter, from, to);

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Absence History");
            sheet.setDefaultColumnWidth(22);

            // Styles
            CellStyle titleStyle = wb.createCellStyle();
            Font titleFont = wb.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 13);
            titleStyle.setFont(titleFont);

            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle deductedStyle = wb.createCellStyle();
            deductedStyle.setFillForegroundColor(IndexedColors.ROSE.getIndex());
            deductedStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Title
            int rowIdx = 0;
            Row titleRow = sheet.createRow(rowIdx++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Absence & Leave History — سجل الإجازات والغيابات");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 4));

            // Sub-title with filter info
            Row subRow = sheet.createRow(rowIdx++);
            String period = (from != null && to != null) ? from + " → " + to : "All Dates";
            String nameInfo = (nameFilter != null && !nameFilter.isBlank()) ? " | Employee: " + nameFilter : "";
            subRow.createCell(0).setCellValue("Period: " + period + nameInfo);
            rowIdx++; // blank

            // Column headers
            String[] cols = {"Employee Name", "Date", "Leave Type", "Deduction (EGP)", "Status"};
            Row hRow = sheet.createRow(rowIdx++);
            for (int c = 0; c < cols.length; c++) {
                Cell hc = hRow.createCell(c);
                hc.setCellValue(cols[c]);
                hc.setCellStyle(headerStyle);
            }

            // Data
            BigDecimal totalDeduction = BigDecimal.ZERO;
            for (AbsenceHistoryRecord rec : records) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(rec.getEmployeeName());
                row.createCell(1).setCellValue(rec.getDate() != null ? rec.getDate().toString() : "");
                row.createCell(2).setCellValue(rec.getLeaveType());
                Cell dc = row.createCell(3);
                double deduction = rec.getDeductionAmount() != null ? rec.getDeductionAmount().doubleValue() : 0.0;
                dc.setCellValue(deduction);
                if (deduction > 0) dc.setCellStyle(deductedStyle);
                row.createCell(4).setCellValue(rec.getStatus() != null ? rec.getStatus() : "");
                totalDeduction = totalDeduction.add(rec.getDeductionAmount() != null ? rec.getDeductionAmount() : BigDecimal.ZERO);
            }

            // Total row
            rowIdx++; // blank
            Row totalRow = sheet.createRow(rowIdx);
            CellStyle totalStyle = wb.createCellStyle();
            Font totalFont = wb.createFont(); totalFont.setBold(true);
            totalStyle.setFont(totalFont);
            totalStyle.setBorderTop(BorderStyle.MEDIUM);
            Cell tLabel = totalRow.createCell(2);
            tLabel.setCellValue("TOTAL DEDUCTIONS");
            tLabel.setCellStyle(totalStyle);
            Cell tVal = totalRow.createCell(3);
            tVal.setCellValue(totalDeduction.doubleValue());
            tVal.setCellStyle(totalStyle);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate absence history XLSX", e);
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Returns all dates in [start, end] that are NOT Friday.
     */
    private List<LocalDate> collectWorkingDays(LocalDate start, LocalDate end) {
        List<LocalDate> days = new ArrayList<>();
        LocalDate cur = start;
        while (!cur.isAfter(end)) {
            if (cur.getDayOfWeek() != DayOfWeek.FRIDAY) {
                days.add(cur);
            }
            cur = cur.plusDays(1);
        }
        return days;
    }

    /**
     * Creates or updates an Attendance record for the given date.
     * Uses the unique (employee_id, date) constraint safely.
     */
    private void saveOrUpdateAttendance(Employee employee, LocalDate date,
                                         AbsenceType type,
                                         BigDecimal manualAmount,
                                         BigDecimal multiplier) {
        Attendance att = attendanceRepo
                .findByEmployee_NameAndDate(employee.getName(), date)
                .orElse(new Attendance());

        att.setEmployee(employee);
        att.setDate(date);
        att.setAbsenceType(type);

        if (manualAmount != null) att.setManualDeduction(manualAmount);
        if (multiplier  != null) att.setPenaltyMultiplier(multiplier);

        attendanceRepo.save(att);
    }

    /** Returns the employee's current vacation balance (defaulting to the legal quota). */
    private int effectiveBalance(Employee employee) {
        if (employee.getVacationBalance() != null) return employee.getVacationBalance();
        return initialQuotaFor(employee);
    }

    private void validateRequest(LeaveRequest req) {
        if (req.getEmployeeName() == null || req.getEmployeeName().isBlank())
            throw new RuntimeException("اسم الموظف مطلوب / Employee name is required.");
        if (req.getStartDate() == null || req.getEndDate() == null)
            throw new RuntimeException("التاريخ مطلوب / Start and end dates are required.");
        if (req.getEndDate().isBefore(req.getStartDate()))
            throw new RuntimeException("تاريخ النهاية يجب أن يكون بعد تاريخ البداية.");
        if (req.getLeaveType() == null)
            throw new RuntimeException("نوع الإجازة مطلوب / Leave type is required.");
    }
}
