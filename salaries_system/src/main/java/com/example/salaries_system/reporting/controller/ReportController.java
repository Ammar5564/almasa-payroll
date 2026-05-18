package com.example.salaries_system.reporting.controller;

import com.example.salaries_system.reporting.dto.CustomReportRequest;
import com.example.salaries_system.reporting.dto.ReportResponse;
import com.example.salaries_system.reporting.dto.WeeklyReportRequest;
import com.example.salaries_system.reporting.dto.EmployeeReportRequest;
import com.example.salaries_system.reporting.dto.DepartmentReportRequest;
import com.example.salaries_system.reporting.dto.DepartmentAggregatedReportRequest;
import com.example.salaries_system.attendance.model.Attendance;
import com.example.salaries_system.attendance.model.AbsenceType;
import com.example.salaries_system.employee.model.Employee;
import com.example.salaries_system.loan.model.Loan;
import com.example.salaries_system.loan.model.LoanInstallment;
import com.example.salaries_system.payroll.model.PayrollRecord;
import com.example.salaries_system.disciplinary.model.DisciplinaryAction;
import com.example.salaries_system.attendance.repository.AttendanceRepository;
import com.example.salaries_system.employee.repository.EmployeeRepository;
import com.example.salaries_system.loan.repository.LoanInstallmentRepository;
import com.example.salaries_system.loan.repository.LoanRepository;
import com.example.salaries_system.payroll.repository.PayrollRecordRepository;
import com.example.salaries_system.disciplinary.repository.DisciplinaryActionRepository;
import com.example.salaries_system.worktime.model.DepartmentWorkTime;
import com.example.salaries_system.worktime.repository.DepartmentWorkTimeRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin
public class ReportController {

    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final PayrollRecordRepository payrollRepository;
    private final LoanRepository loanRepository;
    private final LoanInstallmentRepository loanInstallmentRepository;
    private final DisciplinaryActionRepository disciplinaryActionRepository;
    private final DepartmentWorkTimeRepository departmentWorkTimeRepository;

    public ReportController(EmployeeRepository employeeRepository,
                        AttendanceRepository attendanceRepository,
                        PayrollRecordRepository payrollRepository,
                        LoanRepository loanRepository,
                        LoanInstallmentRepository loanInstallmentRepository,
                        DisciplinaryActionRepository disciplinaryActionRepository,
                        DepartmentWorkTimeRepository departmentWorkTimeRepository) {
        this.employeeRepository = employeeRepository;
        this.attendanceRepository = attendanceRepository;
        this.payrollRepository = payrollRepository;
        this.loanRepository = loanRepository;
        this.loanInstallmentRepository = loanInstallmentRepository;
        this.disciplinaryActionRepository = disciplinaryActionRepository;
        this.departmentWorkTimeRepository = departmentWorkTimeRepository;
    }

    // 1. Weekly Report
    @PostMapping("/weekly")
    public ReportResponse generateWeeklyReport(@RequestBody WeeklyReportRequest request) {
        LocalDate start = request.getStartDate();
        LocalDate end = request.getEndDate();
        
        ReportResponse response = new ReportResponse("Weekly Report", start, end);
        
        // Get attendance data for the week
        List<Attendance> attendances = attendanceRepository.findByDateBetween(start, end);
        
        // Calculate summary
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalEmployees", employeeRepository.count());
        summary.put("totalAttendanceRecords", attendances.size());
        summary.put("totalLateMinutes", attendances.stream().mapToLong(Attendance::getLateMinutes).sum());
        summary.put("totalOvertimeMinutes", attendances.stream().mapToLong(Attendance::getOvertimeMinutes).sum());
        
        // Group by employee
        Map<String, List<Map<String, Object>>> employeeDetails = attendances.stream()
            .collect(Collectors.groupingBy(
                att -> att.getEmployee().getName(),
                Collectors.mapping(this::attendanceToMap, Collectors.toList())
            ));
        
        response.setSummary(summary);
        response.setDetails(employeeDetails.entrySet().stream()
            .map(entry -> {
                Map<String, Object> empData = new HashMap<>();
                empData.put("employeeName", entry.getKey());
                empData.put("attendances", entry.getValue());
                return empData;
            })
            .collect(Collectors.toList()));
        
        return response;
    }

    // 2. Custom Report
    @PostMapping("/custom")
    public ReportResponse generateCustomReport(@RequestBody CustomReportRequest request) {
        LocalDate from = request.getFromDate();
        LocalDate to = request.getToDate();
        String reportType = request.getReportType();
        
        ReportResponse response = new ReportResponse(
            "Custom " + reportType.toUpperCase() + " Report", from, to);
        
        switch (reportType.toLowerCase()) {
            case "payroll":
                return generatePayrollReport(from, to, response);
            case "attendance":
                return generateAttendanceReport(from, to, response);
            case "loans":
                return generateLoanReport(from, to, response);
            case "department":
                return generateDepartmentReport(from, to, response);
            default:
                throw new RuntimeException("Invalid report type: " + reportType);
        }
    }

    // 4. Employee Detailed Report
    @PostMapping("/employee")
    public ReportResponse generateEmployeeReport(@RequestBody EmployeeReportRequest request) {
        LocalDate start = request.getFromDate();
        LocalDate end = request.getToDate();
        
        ReportResponse response = new ReportResponse("Employee Report: " + request.getEmployeeName(), start, end);
        
        return generateEmployeeDetailedReport(request.getEmployeeName(), start, end, response);
    }

    /**
     * Detailed Employee Report export (XLSX) with Arabic business-friendly headers.
     *
     * SAP improvement:
     * - Adds export metadata (report date + username)
     * - Uses multi-sheet structured workbook
     */
    @PostMapping("/employee/export")
    public ResponseEntity<byte[]> exportEmployeeReportXlsx(
            @RequestBody EmployeeReportRequest request,
            @RequestHeader(value = "X-Report-User", required = false) String reportUser) {

        String employeeName = request.getEmployeeName();
        LocalDate from = request.getFromDate();
        LocalDate to = request.getToDate();

        Employee employee = employeeRepository.findByName(employeeName)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeName));

        // Base datasets
        List<Attendance> attendances = attendanceRepository.findByEmployee_NameAndDateBetween(employeeName, from, to);
        List<Attendance> attendanceRecords = attendances.stream()
                .filter(a -> a.getAbsenceType() == null)
                .toList();
        List<Attendance> absenceRecords = attendances.stream()
                .filter(a -> a.getAbsenceType() != null)
                .toList();

        List<PayrollRecord> payrollRecords = payrollRepository.findByEmployee_NameAndMonthBetween(employeeName, from, to);
        List<Loan> loans = loanRepository.findByEmployee_Name(employeeName);
        List<DisciplinaryAction> disciplinaryActions = disciplinaryActionRepository
                .findByEmployee_NameAndDateBetween(employeeName, from, to);

        // Attendance summary
        long totalLateMinutes = attendances.stream().mapToLong(Attendance::getLateMinutes).sum();
        long totalOvertimeMinutes = attendances.stream().mapToLong(Attendance::getOvertimeMinutes).sum();
        long totalAbsenceDays = absenceRecords.size();

        // Leave data summary (from absence records)
        long annualLeaveDays = absenceRecords.stream()
                .filter(a -> a.getAbsenceType() == AbsenceType.ANNUAL_LEAVE || a.getAbsenceType() == AbsenceType.WITH_PERMISSION)
                .count();
        long unexcusedDays = absenceRecords.stream()
                .filter(a -> a.getAbsenceType() == AbsenceType.UNEXCUSED_ABSENCE || a.getAbsenceType() == AbsenceType.WITHOUT_PERMISSION)
                .count();
        BigDecimal manualDeductionsTotal = absenceRecords.stream()
                .filter(a -> a.getAbsenceType() == AbsenceType.MANUAL_DEDUCTION)
                .map(a -> a.getManualDeduction() != null ? a.getManualDeduction() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int entitlement = (employee.getAge() != null && employee.getAge() >= 50) ? 30 : 21;
        int currentBalance = employee.getVacationBalance() != null ? employee.getVacationBalance() : entitlement;

        String deptName = employee.getDepartmentWorkTime() != null ? employee.getDepartmentWorkTime().getDepartmentName() : "—";
        String branchName = employee.getDepartmentWorkTime() != null ? employee.getDepartmentWorkTime().getBranchName() : "—";

        String user = decodeOptionalUtf8Header(reportUser);
        LocalDate reportDate = LocalDate.now();

        byte[] xlsx = buildEmployeeReportWorkbook(
                employee,
                from, to,
                reportDate, user,
                deptName, branchName,
                entitlement, currentBalance,
                attendanceRecords, absenceRecords,
                totalLateMinutes, totalOvertimeMinutes, totalAbsenceDays,
                annualLeaveDays, unexcusedDays, manualDeductionsTotal,
                payrollRecords, loans, disciplinaryActions
        );

        String safeCode = employee.getEmployeeCode() != null ? employee.getEmployeeCode().replaceAll("[^a-zA-Z0-9_-]", "_") : "EMP";
        String filename = "employee_report_" + safeCode + "_" + reportDate + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        setXlsxAttachmentHeaders(headers, filename);
        return ResponseEntity.ok().headers(headers).body(xlsx);
    }

    // 5. Department Summary Report
    @PostMapping("/department")
    public ReportResponse generateDepartmentReport(@RequestBody DepartmentReportRequest request) {
        LocalDate start = request.getFromDate();
        LocalDate end = request.getToDate();
        
        ReportResponse response = new ReportResponse("Department Report: " + request.getDepartmentName(), start, end);
        
        return generateDepartmentDetailedReport(request.getDepartmentName(), start, end, response);
    }

    /**
     * Department Aggregated Report (XLSX) — grouped by department for a date range.
     *
     * Requirements:
     * - Group by department
     * - Per department: number of employees, total salaries, total deductions
     *
     * SAP Improvement:
     * - KPIs per department: average salary, attendance rate
     */
    @PostMapping("/departments/aggregated/export")
    public ResponseEntity<byte[]> exportDepartmentsAggregatedXlsx(
            @RequestBody DepartmentAggregatedReportRequest request,
            @RequestHeader(value = "X-Report-User", required = false) String reportUser) {

        LocalDate from = request.getFromDate();
        LocalDate to = request.getToDate();
        if (from == null || to == null) throw new RuntimeException("fromDate and toDate are required");
        if (to.isBefore(from)) throw new RuntimeException("toDate must be >= fromDate");

        String user = decodeOptionalUtf8Header(reportUser);
        LocalDate reportDate = LocalDate.now();

        List<Employee> allEmployees = employeeRepository.findAll();
        List<DepartmentWorkTime> allDepts = departmentWorkTimeRepository.findAll();

        byte[] xlsx = buildDepartmentsAggregatedWorkbook(allDepts, allEmployees, from, to, reportDate, user);
        String filename = "departments_aggregated_" + reportDate + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        setXlsxAttachmentHeaders(headers, filename);
        return ResponseEntity.ok().headers(headers).body(xlsx);
    }

    // 3. Export to Excel (XLSX)
    @PostMapping("/export")
    public ResponseEntity<byte[]> exportToExcel(@RequestBody ReportResponse report) {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {

            // ── Styles ───────────────────────────────────────────────────────
            CellStyle titleStyle = wb.createCellStyle();
            Font titleFont = wb.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);

            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            CellStyle sectionStyle = wb.createCellStyle();
            Font sectionFont = wb.createFont();
            sectionFont.setBold(true);
            sectionFont.setColor(IndexedColors.DARK_BLUE.getIndex());
            sectionStyle.setFont(sectionFont);
            sectionStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            sectionStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // ── Sheet ────────────────────────────────────────────────────────
            String safeName = report.getReportTitle().replaceAll("[/\\\\*?:\\[\\]]", "-");
            Sheet sheet = wb.createSheet(safeName.length() > 31 ? safeName.substring(0, 31) : safeName);
            sheet.setDefaultColumnWidth(24);

            int rowIdx = 0;

            // Title
            Row titleRow = sheet.createRow(rowIdx++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(report.getReportTitle());
            titleCell.setCellStyle(titleStyle);

            // Meta
            Row periodRow = sheet.createRow(rowIdx++);
            periodRow.createCell(0).setCellValue("Period: " + report.getPeriodStart() + " → " + report.getPeriodEnd());
            Row genRow = sheet.createRow(rowIdx++);
            genRow.createCell(0).setCellValue("Generated: " + report.getGeneratedDate());
            rowIdx++; // blank

            // ── Summary section ──────────────────────────────────────────────
            Row sumTitleRow = sheet.createRow(rowIdx++);
            Cell sumTitle = sumTitleRow.createCell(0);
            sumTitle.setCellValue("SUMMARY");
            sumTitle.setCellStyle(sectionStyle);

            Row sumHeaderRow = sheet.createRow(rowIdx++);
            Cell kHeader = sumHeaderRow.createCell(0);
            kHeader.setCellValue("Key");
            kHeader.setCellStyle(headerStyle);
            Cell vHeader = sumHeaderRow.createCell(1);
            vHeader.setCellValue("Value");
            vHeader.setCellStyle(headerStyle);

            for (Map.Entry<String, Object> entry : report.getSummary().entrySet()) {
                Row r = sheet.createRow(rowIdx++);
                r.createCell(0).setCellValue(entry.getKey());
                String val = entry.getValue() != null ? entry.getValue().toString() : "";
                Cell vc = r.createCell(1);
                try { vc.setCellValue(Double.parseDouble(val)); }
                catch (NumberFormatException ex) { vc.setCellValue(val); }
            }
            rowIdx++; // blank

            // ── Details section ──────────────────────────────────────────────
            if (report.getDetails() != null && !report.getDetails().isEmpty()) {
                Row detTitleRow = sheet.createRow(rowIdx++);
                Cell detTitle = detTitleRow.createCell(0);
                detTitle.setCellValue("DETAILS");
                detTitle.setCellStyle(sectionStyle);

                List<String> cols = new ArrayList<>(report.getDetails().get(0).keySet());

                Row detHeaderRow = sheet.createRow(rowIdx++);
                for (int c = 0; c < cols.size(); c++) {
                    Cell ch = detHeaderRow.createCell(c);
                    ch.setCellValue(cols.get(c));
                    ch.setCellStyle(headerStyle);
                }

                for (Map<String, Object> detail : report.getDetails()) {
                    Row row = sheet.createRow(rowIdx++);
                    for (int c = 0; c < cols.size(); c++) {
                        Object v = detail.get(cols.get(c));
                        Cell dc = row.createCell(c);
                        if (v == null) { dc.setCellValue(""); }
                        else if (v instanceof Number) { dc.setCellValue(((Number) v).doubleValue()); }
                        else { dc.setCellValue(v.toString()); }
                    }
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            byte[] bytes = out.toByteArray();

            String filename = report.getReportTitle().replaceAll("[^a-zA-Z0-9_-]", "_")
                    + "_" + LocalDate.now() + ".xlsx";
            HttpHeaders headers = new HttpHeaders();
            setXlsxAttachmentHeaders(headers, filename);

            return ResponseEntity.ok().headers(headers).body(bytes);

        } catch (IOException e) {
            throw new RuntimeException("Error exporting report to XLSX: " + e.getMessage(), e);
        }
    }

    private ReportResponse generatePayrollReport(LocalDate from, LocalDate to, ReportResponse response) {
        List<PayrollRecord> payrolls = payrollRepository.findByMonthBetween(from, to);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalPayrollRecords", payrolls.size());
        summary.put("totalOvertimePay", payrolls.stream()
            .map(PayrollRecord::getOvertimePay).reduce(BigDecimal.ZERO, BigDecimal::add));
        summary.put("totalDeductions", payrolls.stream()
            .map(pr -> pr.getLateDeduction().add(pr.getLoanDeduction()))
            .reduce(BigDecimal.ZERO, BigDecimal::add));
        summary.put("totalNetSalary", payrolls.stream()
            .map(PayrollRecord::getFinalSalary).reduce(BigDecimal.ZERO, BigDecimal::add));
        
        response.setSummary(summary);
        response.setDetails(payrolls.stream().map(this::payrollToMap).collect(Collectors.toList()));
        
        return response;
    }

    private ReportResponse generateAttendanceReport(LocalDate from, LocalDate to, ReportResponse response) {
        List<Attendance> attendances = attendanceRepository.findByDateBetween(from, to);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalAttendanceRecords", attendances.size());
        summary.put("totalLateMinutes", attendances.stream().mapToLong(Attendance::getLateMinutes).sum());
        summary.put("totalOvertimeMinutes", attendances.stream().mapToLong(Attendance::getOvertimeMinutes).sum());
        summary.put("uniqueEmployees", attendances.stream()
            .map(att -> att.getEmployee().getName()).distinct().count());
        
        response.setSummary(summary);
        response.setDetails(attendances.stream().map(this::attendanceToMap).collect(Collectors.toList()));
        
        return response;
    }

    private ReportResponse generateLoanReport(LocalDate from, LocalDate to, ReportResponse response) {
        List<Loan> loans = loanRepository.findByCreatedAtBetween(from, to);
        List<LoanInstallment> installments = loanInstallmentRepository.findByMonthBetween(from, to);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalLoans", loans.size());
        summary.put("totalLoanAmount", loans.stream()
            .map(Loan::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
        summary.put("totalInstallments", installments.size());
        summary.put("paidInstallments", installments.stream()
            .mapToLong(inc -> inc.isPaid() ? 1 : 0).sum());
        summary.put("unpaidInstallments", installments.stream()
            .mapToLong(inc -> inc.isPaid() ? 0 : 1).sum());
        
        response.setSummary(summary);
        response.setDetails(loans.stream().map(this::loanToMap).collect(Collectors.toList()));
        
        return response;
    }

    private ReportResponse generateDepartmentReport(LocalDate from, LocalDate to, ReportResponse response) {
        List<Employee> employees = employeeRepository.findAll();
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalDepartments", employees.stream()
            .map(emp -> emp.getDepartmentWorkTime().getDepartmentName()).distinct().count());
        summary.put("totalEmployees", employees.size());
        
        // Group by department
        Map<String, List<Employee>> deptGroups = employees.stream()
            .collect(Collectors.groupingBy(
                emp -> emp.getDepartmentWorkTime().getDepartmentName()));
        
        List<Map<String, Object>> deptDetails = deptGroups.entrySet().stream()
            .map(entry -> {
                Map<String, Object> deptData = new HashMap<>();
                deptData.put("departmentName", entry.getKey());
                deptData.put("employeeCount", entry.getValue().size());
                deptData.put("totalBaseSalary", entry.getValue().stream()
                    .map(Employee::getBaseSalary).reduce(BigDecimal.ZERO, BigDecimal::add));
                return deptData;
            })
            .collect(Collectors.toList());
        
        response.setSummary(summary);
        response.setDetails(deptDetails);
        
        return response;
    }

    private ReportResponse generateEmployeeDetailedReport(String employeeName, LocalDate from, LocalDate to, ReportResponse response) {
        Employee employee = employeeRepository.findByName(employeeName)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeName));

        // Get employee info
        Map<String, Object> employeeInfo = new LinkedHashMap<>();
        employeeInfo.put("كود الموظف", employee.getEmployeeCode());
        employeeInfo.put("الاسم", employee.getName());
        employeeInfo.put("الوظيفة", employee.getJobTitle());
        employeeInfo.put("القسم", employee.getDepartmentWorkTime() != null ? employee.getDepartmentWorkTime().getDepartmentName() : null);
        employeeInfo.put("الموقع", employee.getDepartmentWorkTime() != null ? employee.getDepartmentWorkTime().getBranchName() : null);
        employeeInfo.put("نوع الوردية", employee.getShiftType() != null ? employee.getShiftType().name() : null);
        employeeInfo.put("تأمين اجتماعي", Boolean.TRUE.equals(employee.getHasSocialInsurance()) ? "نعم" : "لا");
        employeeInfo.put("الراتب الأساسي", employee.getBaseSalary());
        employeeInfo.put("رصيد الإجازة", employee.getVacationBalance());

        // Get attendance records
        List<Attendance> attendances = attendanceRepository.findByEmployee_NameAndDateBetween(employeeName, from, to);
        List<Map<String, Object>> attendanceDetails = attendances.stream()
                .filter(att -> att.getAbsenceType() == null) // Only regular attendance, not absences
                .map(this::attendanceToMap)
                .collect(Collectors.toList());

        // Get absences
        List<Map<String, Object>> absenceDetails = attendances.stream()
                .filter(att -> att.getAbsenceType() != null)
                .map(this::absenceToMap)
                .collect(Collectors.toList());

        // Get disciplinary actions
        List<DisciplinaryAction> disciplinaryActions = disciplinaryActionRepository
                .findByEmployee_NameAndDateBetween(employeeName, from, to);
        List<Map<String, Object>> disciplinaryDetails = disciplinaryActions.stream()
                .map(this::disciplinaryToMap)
                .collect(Collectors.toList());

        // Get payroll records
        List<PayrollRecord> payrollRecords = payrollRepository.findByEmployee_NameAndMonthBetween(employeeName, from, to);
        List<Map<String, Object>> payrollDetails = payrollRecords.stream()
                .map(this::payrollDetailedToMap)
                .collect(Collectors.toList());
        Map<String, Object> payrollSummary = new HashMap<>();
        if (!payrollRecords.isEmpty()) {
            PayrollRecord latestPayroll = payrollRecords.get(payrollRecords.size() - 1);
            payrollSummary.put("finalSalary", latestPayroll.getFinalSalary());
            payrollSummary.put("lateDeduction", latestPayroll.getLateDeduction());
            payrollSummary.put("absenceDeduction", latestPayroll.getAbsenceDeduction());
            payrollSummary.put("loanDeduction", latestPayroll.getLoanDeduction());
            payrollSummary.put("penalties", latestPayroll.getPenalties());
            payrollSummary.put("overtimePay", latestPayroll.getOvertimePay());
            payrollSummary.put("bonus", latestPayroll.getBonus());
            payrollSummary.put("socialInsurance", latestPayroll.getSocialInsurance());
            payrollSummary.put("incomeTax", latestPayroll.getIncomeTax());
            payrollSummary.put("martyrsFundDeduction", latestPayroll.getMartyrsFundDeduction());
        }

        // Get loans (all loans for the employee; balances are current)
        List<Loan> employeeLoans = loanRepository.findByEmployee_Name(employeeName);
        List<Map<String, Object>> loanDetails = employeeLoans.stream()
                .map(this::loanDetailedToMap)
                .collect(Collectors.toList());

        BigDecimal totalLoanAmount = employeeLoans.stream()
                .map(Loan::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRemaining = employeeLoans.stream()
                .map(Loan::getRemainingBalance)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Build summary
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("إجمالي أيام الحضور", attendanceDetails.size());
        summary.put("إجمالي أيام الغياب", absenceDetails.size());
        summary.put("إجمالي دقائق التأخير", attendances.stream().mapToLong(Attendance::getLateMinutes).sum());
        summary.put("إجمالي دقائق الإضافي", attendances.stream().mapToLong(Attendance::getOvertimeMinutes).sum());
        summary.put("عدد الجزاءات", disciplinaryDetails.size());
        summary.put("إجمالي القروض", totalLoanAmount);
        summary.put("رصيد القروض", totalRemaining);
        summary.put("ملخص الراتب (آخر فترة)", payrollSummary);

        // Combine all details
        List<Map<String, Object>> allDetails = new ArrayList<>();
        allDetails.addAll(attendanceDetails);
        allDetails.addAll(absenceDetails);
        allDetails.addAll(disciplinaryDetails);

        response.setSummary(summary);
        response.setDetails(allDetails);

        // Rich fields for Dashboard + SheetJS exports
        response.setEmployeeInfo(employeeInfo);
        response.setAttendanceRecords(attendanceDetails);
        response.setAbsenceRecords(absenceDetails);
        response.setPayrollRecords(payrollDetails);
        response.setLoans(loanDetails);
        response.setDisciplinaryActions(disciplinaryDetails);

        return response;
    }

    private byte[] buildEmployeeReportWorkbook(
            Employee employee,
            LocalDate from, LocalDate to,
            LocalDate reportDate, String reportUser,
            String deptName, String branchName,
            int entitlement, int currentBalance,
            List<Attendance> attendanceRecords,
            List<Attendance> absenceRecords,
            long totalLateMinutes,
            long totalOvertimeMinutes,
            long totalAbsenceDays,
            long annualLeaveDays,
            long unexcusedDays,
            BigDecimal manualDeductionsTotal,
            List<PayrollRecord> payrollRecords,
            List<Loan> loans,
            List<DisciplinaryAction> disciplinaryActions
    ) {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            // Common styles
            CellStyle titleStyle = wb.createCellStyle();
            Font titleFont = wb.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);

            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            CellStyle sectionStyle = wb.createCellStyle();
            Font sectionFont = wb.createFont();
            sectionFont.setBold(true);
            sectionFont.setColor(IndexedColors.DARK_BLUE.getIndex());
            sectionStyle.setFont(sectionFont);
            sectionStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            sectionStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // ── Sheet 1: Employee Profile & Summary ──────────────────────────
            Sheet s1 = wb.createSheet("بيانات الموظف");
            s1.setRightToLeft(true);
            s1.setDefaultColumnWidth(28);

            int r = 0;
            Row t = s1.createRow(r++);
            Cell tc = t.createCell(0);
            tc.setCellValue("تقرير موظف تفصيلي");
            tc.setCellStyle(titleStyle);
            s1.addMergedRegion(new CellRangeAddress(0, 0, 0, 3));

            Row meta1 = s1.createRow(r++);
            meta1.createCell(0).setCellValue("الفترة");
            meta1.createCell(1).setCellValue(from + "  ←  " + to);
            meta1.createCell(2).setCellValue("تاريخ التقرير");
            meta1.createCell(3).setCellValue(reportDate.toString());

            Row meta2 = s1.createRow(r++);
            meta2.createCell(0).setCellValue("اسم المستخدم");
            meta2.createCell(1).setCellValue(reportUser);
            meta2.createCell(2).setCellValue("الحالة");
            meta2.createCell(3).setCellValue(employee.getStatus() != null ? employee.getStatus() : "ACTIVE");

            r++; // blank

            Row secEmp = s1.createRow(r++);
            Cell secEmpCell = secEmp.createCell(0);
            secEmpCell.setCellValue("البيانات الشخصية والوظيفية");
            secEmpCell.setCellStyle(sectionStyle);
            s1.addMergedRegion(new CellRangeAddress(secEmp.getRowNum(), secEmp.getRowNum(), 0, 3));

            r = kv(s1, r, "كود الموظف", nz(employee.getEmployeeCode()));
            r = kv(s1, r, "اسم الموظف", nz(employee.getName()));
            r = kv(s1, r, "المسمى الوظيفي", nz(employee.getJobTitle()));
            r = kv(s1, r, "القسم", nz(deptName));
            r = kv(s1, r, "الفرع", nz(branchName));
            r = kv(s1, r, "الفئة", nz(employee.getCategory()));
            r = kv(s1, r, "النوع", employee.getGender() != null ? employee.getGender().name() : "—");
            r = kv(s1, r, "نظام الشفت", employee.getShiftType() != null ? employee.getShiftType().name() : "—");
            r = kv(s1, r, "العنوان", nz(employee.getAddress()));
            r = kv(s1, r, "تاريخ التعيين", employee.getHiringDate() != null ? employee.getHiringDate().toString() : "—");
            r = kv(s1, r, "نهاية العقد", employee.getContractExpiry() != null ? employee.getContractExpiry().toString() : "—");
            r = kv(s1, r, "رقم التأمين", nz(employee.getInsuranceNumber()));
            r = kv(s1, r, "حساب البنك", nz(employee.getBankAccount()));
            r = kv(s1, r, "مرن (إعفاء من الجزاءات)", String.valueOf(Boolean.TRUE.equals(employee.getFlexibleSchedule())));
            r = kv(s1, r, "تأمين اجتماعي", String.valueOf(Boolean.TRUE.equals(employee.getHasSocialInsurance())));
            r = kv(s1, r, "العمر", employee.getAge() != null ? employee.getAge().toString() : "—");
            r = kv(s1, r, "رصيد الإجازات الحالي", String.valueOf(currentBalance));
            r = kv(s1, r, "استحقاق الإجازات القانوني", String.valueOf(entitlement));
            r = kv(s1, r, "تاريخ إنهاء الخدمة", employee.getTerminationDate() != null ? employee.getTerminationDate().toString() : "—");

            r++; // blank

            Row secSum = s1.createRow(r++);
            Cell secSumCell = secSum.createCell(0);
            secSumCell.setCellValue("ملخص الحضور والإجازات");
            secSumCell.setCellStyle(sectionStyle);
            s1.addMergedRegion(new CellRangeAddress(secSum.getRowNum(), secSum.getRowNum(), 0, 3));

            r = kv(s1, r, "أيام الحضور", String.valueOf(attendanceRecords.size()));
            r = kv(s1, r, "إجمالي دقائق التأخير", String.valueOf(totalLateMinutes));
            r = kv(s1, r, "إجمالي دقائق الإضافي", String.valueOf(totalOvertimeMinutes));
            r = kv(s1, r, "عدد أيام الغياب/الإجازات", String.valueOf(totalAbsenceDays));
            r = kv(s1, r, "أيام إجازة سنوية", String.valueOf(annualLeaveDays));
            r = kv(s1, r, "أيام غياب بدون إذن", String.valueOf(unexcusedDays));
            r = kv(s1, r, "إجمالي خصومات إدارية", money(manualDeductionsTotal));

            // ── Sheet 2: Attendance Records ──────────────────────────────────
            Sheet s2 = wb.createSheet("سجلات الحضور");
            s2.setRightToLeft(true);
            tableAttendance(s2, headerStyle, attendanceRecords);

            // ── Sheet 3: Leaves / Absences ──────────────────────────────────
            Sheet s3 = wb.createSheet("الإجازات والغيابات");
            s3.setRightToLeft(true);
            tableAbsences(s3, headerStyle, absenceRecords);

            // ── Sheet 4: Payroll ────────────────────────────────────────────
            Sheet s4 = wb.createSheet("الرواتب");
            s4.setRightToLeft(true);
            tablePayroll(s4, headerStyle, payrollRecords);

            // ── Sheet 5: Loans ──────────────────────────────────────────────
            Sheet s5 = wb.createSheet("القروض");
            s5.setRightToLeft(true);
            tableLoans(s5, headerStyle, loans);

            // ── Sheet 6: Disciplinary ───────────────────────────────────────
            Sheet s6 = wb.createSheet("الجزاءات");
            s6.setRightToLeft(true);
            tableDisciplinary(s6, headerStyle, disciplinaryActions);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate employee report XLSX", e);
        }
    }

    private static int kv(Sheet sheet, int rowIdx, String k, String v) {
        Row r = sheet.createRow(rowIdx++);
        r.createCell(0).setCellValue(k);
        r.createCell(1).setCellValue(v);
        return rowIdx;
    }

    private static String nz(String v) {
        return (v == null || v.isBlank()) ? "—" : v;
    }

    private static String money(BigDecimal v) {
        if (v == null) return "0.00";
        return v.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private static void headerRow(Sheet sheet, CellStyle headerStyle, int rowIdx, String... cols) {
        Row h = sheet.createRow(rowIdx);
        for (int i = 0; i < cols.length; i++) {
            Cell c = h.createCell(i);
            c.setCellValue(cols[i]);
            c.setCellStyle(headerStyle);
        }
        sheet.setDefaultColumnWidth(20);
    }

    private static void tableAttendance(Sheet sheet, CellStyle headerStyle, List<Attendance> records) {
        headerRow(sheet, headerStyle, 0,
                "التاريخ", "وقت الحضور", "وقت الانصراف", "دقائق التأخير", "دقائق الإضافي");
        int r = 1;
        for (Attendance a : records) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(a.getDate() != null ? a.getDate().toString() : "");
            row.createCell(1).setCellValue(a.getActualStart() != null ? a.getActualStart().toString() : "");
            row.createCell(2).setCellValue(a.getActualEnd() != null ? a.getActualEnd().toString() : "");
            row.createCell(3).setCellValue(a.getLateMinutes());
            row.createCell(4).setCellValue(a.getOvertimeMinutes());
        }
    }

    private static void tableAbsences(Sheet sheet, CellStyle headerStyle, List<Attendance> records) {
        headerRow(sheet, headerStyle, 0,
                "التاريخ", "نوع الإجازة/الغياب", "مبلغ الخصم", "المضاعف");
        int r = 1;
        for (Attendance a : records) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(a.getDate() != null ? a.getDate().toString() : "");
            row.createCell(1).setCellValue(a.getAbsenceType() != null ? a.getAbsenceType().name() : "");
            row.createCell(2).setCellValue(a.getManualDeduction() != null ? a.getManualDeduction().doubleValue() : 0.0);
            row.createCell(3).setCellValue(a.getPenaltyMultiplier() != null ? a.getPenaltyMultiplier().doubleValue() : 1.0);
        }
    }

    private static void tablePayroll(Sheet sheet, CellStyle headerStyle, List<PayrollRecord> records) {
        headerRow(sheet, headerStyle, 0,
                "الشهر", "الراتب الأساسي", "الإضافي", "الخصومات (تأخير/مغادرة/غياب)", "التأمين الاجتماعي",
                "ضريبة الدخل", "صندوق الشهداء", "القرض", "غرامات", "صافي الراتب");
        int r = 1;
        for (PayrollRecord p : records) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(p.getMonth() != null ? p.getMonth().toString() : "");
            row.createCell(1).setCellValue(p.getEmployee() != null && p.getEmployee().getBaseSalary() != null ? p.getEmployee().getBaseSalary().doubleValue() : 0.0);
            row.createCell(2).setCellValue(p.getOvertimePay() != null ? p.getOvertimePay().doubleValue() : 0.0);
            BigDecimal timeDeds = safe(p.getLateDeduction())
                    .add(safe(p.getLeaveEarlyDeduction()))
                    .add(safe(p.getAbsenceDeduction()));
            row.createCell(3).setCellValue(timeDeds.doubleValue());
            row.createCell(4).setCellValue(safe(p.getSocialInsurance()).doubleValue());
            row.createCell(5).setCellValue(safe(p.getIncomeTax()).doubleValue());
            row.createCell(6).setCellValue(safe(p.getMartyrsFundDeduction()).doubleValue());
            row.createCell(7).setCellValue(safe(p.getLoanDeduction()).doubleValue());
            row.createCell(8).setCellValue(safe(p.getPenalties()).doubleValue());
            row.createCell(9).setCellValue(p.getFinalSalary() != null ? p.getFinalSalary().doubleValue() : 0.0);
        }
    }

    private static void tableLoans(Sheet sheet, CellStyle headerStyle, List<Loan> loans) {
        headerRow(sheet, headerStyle, 0,
                "نوع القرض", "إجمالي القرض", "القسط الشهري", "الرصيد المتبقي", "تاريخ البدء", "مغلق");
        int r = 1;
        for (Loan l : loans) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(l.getLoanType() != null ? l.getLoanType().name() : "");
            row.createCell(1).setCellValue(safe(l.getTotalAmount()).doubleValue());
            row.createCell(2).setCellValue(safe(l.getMonthlyInstallment()).doubleValue());
            row.createCell(3).setCellValue(safe(l.getRemainingBalance()).doubleValue());
            row.createCell(4).setCellValue(l.getRepaymentStartDate() != null ? l.getRepaymentStartDate().toString() : "");
            row.createCell(5).setCellValue(Boolean.TRUE.equals(l.getClosed()) ? "نعم" : "لا");
        }
    }

    private static void tableDisciplinary(Sheet sheet, CellStyle headerStyle, List<DisciplinaryAction> actions) {
        headerRow(sheet, headerStyle, 0,
                "التاريخ", "المبلغ", "السبب", "تاريخ الإنشاء");
        int r = 1;
        for (DisciplinaryAction a : actions) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(a.getDate() != null ? a.getDate().toString() : "");
            row.createCell(1).setCellValue(safe(a.getAmount()).doubleValue());
            row.createCell(2).setCellValue(a.getReason() != null ? a.getReason() : "");
            row.createCell(3).setCellValue(a.getCreatedAt() != null ? a.getCreatedAt().toString() : "");
        }
    }

    private static BigDecimal safe(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private byte[] buildDepartmentsAggregatedWorkbook(
            List<DepartmentWorkTime> departments,
            List<Employee> allEmployees,
            LocalDate from,
            LocalDate to,
            LocalDate reportDate,
            String reportUser
    ) {
        // Pre-fetch period datasets for KPI calculations
        List<PayrollRecord> payrollInPeriod = payrollRepository.findByMonthBetween(from, to);
        List<Attendance> attendanceInPeriod = attendanceRepository.findByDateBetween(from, to);

        int workingDays = countWorkingDaysExcludingFriday(from, to);

        // Map employee name → payroll rows, attendance rows
        Map<String, List<PayrollRecord>> payrollByEmp = payrollInPeriod.stream()
                .filter(p -> p.getEmployee() != null && p.getEmployee().getName() != null)
                .collect(Collectors.groupingBy(p -> p.getEmployee().getName()));

        Map<String, List<Attendance>> attendanceByEmp = attendanceInPeriod.stream()
                .filter(a -> a.getEmployee() != null && a.getEmployee().getName() != null)
                .collect(Collectors.groupingBy(a -> a.getEmployee().getName()));

        // Group employees by department label (department + branch)
        Map<Long, List<Employee>> empsByDeptId = new HashMap<>();
        for (Employee e : allEmployees) {
            DepartmentWorkTime d = e.getDepartmentWorkTime();
            if (d == null || d.getId() == null) continue;
            empsByDeptId.computeIfAbsent(d.getId(), k -> new ArrayList<>()).add(e);
        }

        // Sort departments by label
        List<DepartmentWorkTime> sortedDepts = new ArrayList<>(departments);
        sortedDepts.sort(Comparator.comparing(DepartmentWorkTime::getLabel, String.CASE_INSENSITIVE_ORDER));

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            // Styles
            CellStyle titleStyle = wb.createCellStyle();
            Font titleFont = wb.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);

            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            CellStyle sectionStyle = wb.createCellStyle();
            Font sectionFont = wb.createFont();
            sectionFont.setBold(true);
            sectionFont.setColor(IndexedColors.DARK_BLUE.getIndex());
            sectionStyle.setFont(sectionFont);
            sectionStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            sectionStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // ── Sheet 1: Department KPIs summary ─────────────────────────────
            Sheet summary = wb.createSheet("ملخص الأقسام");
            summary.setRightToLeft(true);
            summary.setDefaultColumnWidth(22);

            int r = 0;
            Row t = summary.createRow(r++);
            Cell tc = t.createCell(0);
            tc.setCellValue("تقرير الأقسام — ملخص مجمع");
            tc.setCellStyle(titleStyle);
            summary.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));

            Row meta = summary.createRow(r++);
            meta.createCell(0).setCellValue("الفترة");
            meta.createCell(1).setCellValue(from + "  ←  " + to);
            meta.createCell(2).setCellValue("تاريخ التقرير");
            meta.createCell(3).setCellValue(reportDate.toString());
            meta.createCell(4).setCellValue("اسم المستخدم");
            meta.createCell(5).setCellValue(reportUser);

            r++; // blank

            headerRow(summary, headerStyle, r++,
                    "القسم", "الفرع", "عدد الموظفين",
                    "إجمالي الرواتب (صافي)", "إجمالي الخصومات",
                    "متوسط الراتب", "معدل الحضور", "أيام العمل");

            // Accumulators for totals
            BigDecimal allTotalNet = BigDecimal.ZERO;
            BigDecimal allTotalDeds = BigDecimal.ZERO;
            long allEmpCount = 0;

            // ── Sheet 2: Employee summarized rows ───────────────────────────
            Sheet details = wb.createSheet("تفاصيل الموظفين");
            details.setRightToLeft(true);
            details.setDefaultColumnWidth(20);

            int dr = 0;
            Row dt = details.createRow(dr++);
            Cell dtc = dt.createCell(0);
            dtc.setCellValue("تفاصيل الموظفين حسب القسم (ملخص)");
            dtc.setCellStyle(titleStyle);
            details.addMergedRegion(new CellRangeAddress(0, 0, 0, 11));

            Row dmeta = details.createRow(dr++);
            dmeta.createCell(0).setCellValue("الفترة");
            dmeta.createCell(1).setCellValue(from + "  ←  " + to);
            dmeta.createCell(2).setCellValue("تاريخ التقرير");
            dmeta.createCell(3).setCellValue(reportDate.toString());
            dmeta.createCell(4).setCellValue("اسم المستخدم");
            dmeta.createCell(5).setCellValue(reportUser);

            dr++; // blank

            headerRow(details, headerStyle, dr++,
                    "القسم", "الفرع",
                    "كود الموظف", "اسم الموظف", "الوظيفة", "الحالة",
                    "الراتب الأساسي",
                    "صافي الراتب (الفترة)",
                    "إجمالي الخصومات (الفترة)",
                    "أيام الحضور", "أيام الغياب/الإجازات", "معدل الحضور");

            for (DepartmentWorkTime dept : sortedDepts) {
                List<Employee> emps = empsByDeptId.getOrDefault(dept.getId(), List.of());
                if (emps.isEmpty()) continue;

                // Sort employees by name
                List<Employee> sortedEmps = new ArrayList<>(emps);
                sortedEmps.sort(Comparator.comparing(Employee::getName, String.CASE_INSENSITIVE_ORDER));

                BigDecimal deptTotalNet = BigDecimal.ZERO;
                BigDecimal deptTotalDeds = BigDecimal.ZERO;
                long deptAttendanceDays = 0;
                long deptAbsenceDays = 0;

                for (Employee e : sortedEmps) {
                    String empName = e.getName();
                    List<PayrollRecord> pr = payrollByEmp.getOrDefault(empName, List.of());
                    List<Attendance> ar = attendanceByEmp.getOrDefault(empName, List.of());

                    BigDecimal empNet = pr.stream()
                            .map(p -> p.getFinalSalary() != null ? p.getFinalSalary() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal empDeds = pr.stream()
                            .map(this::computePayrollDeductions)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    long empAttendDays = ar.stream()
                            .filter(a -> a.getDate() != null && a.getDate().getDayOfWeek() != java.time.DayOfWeek.FRIDAY)
                            .filter(a -> a.getAbsenceType() == null)
                            .count();

                    long empAbsDays = ar.stream()
                            .filter(a -> a.getDate() != null && a.getDate().getDayOfWeek() != java.time.DayOfWeek.FRIDAY)
                            .filter(a -> a.getAbsenceType() != null)
                            .count();

                    double empAttendanceRate = (workingDays <= 0) ? 0.0
                            : Math.min(1.0, (double) empAttendDays / (double) workingDays);

                    // Add details row
                    Row row = details.createRow(dr++);
                    row.createCell(0).setCellValue(nz(dept.getDepartmentName()));
                    row.createCell(1).setCellValue(dept.getBranchName() != null ? dept.getBranchName() : "");
                    row.createCell(2).setCellValue(nz(e.getEmployeeCode()));
                    row.createCell(3).setCellValue(nz(e.getName()));
                    row.createCell(4).setCellValue(nz(e.getJobTitle()));
                    row.createCell(5).setCellValue((e.getStatus() == null || "ACTIVE".equalsIgnoreCase(e.getStatus())) ? "نشط" : "غير نشط");
                    row.createCell(6).setCellValue(safe(e.getBaseSalary()).doubleValue());
                    row.createCell(7).setCellValue(empNet.doubleValue());
                    row.createCell(8).setCellValue(empDeds.doubleValue());
                    row.createCell(9).setCellValue(empAttendDays);
                    row.createCell(10).setCellValue(empAbsDays);
                    row.createCell(11).setCellValue(String.format(Locale.US, "%.1f%%", empAttendanceRate * 100.0));

                    deptTotalNet = deptTotalNet.add(empNet);
                    deptTotalDeds = deptTotalDeds.add(empDeds);
                    deptAttendanceDays += empAttendDays;
                    deptAbsenceDays += empAbsDays;
                }

                int empCount = sortedEmps.size();
                double deptAttendanceRate = (workingDays <= 0 || empCount <= 0) ? 0.0
                        : Math.min(1.0, (double) deptAttendanceDays / (double) (workingDays * (long) empCount));

                BigDecimal avgSalary = empCount > 0
                        ? deptTotalNet.divide(BigDecimal.valueOf(empCount), 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;

                Row row = summary.createRow(r++);
                row.createCell(0).setCellValue(nz(dept.getDepartmentName()));
                row.createCell(1).setCellValue(dept.getBranchName() != null ? dept.getBranchName() : "");
                row.createCell(2).setCellValue(empCount);
                row.createCell(3).setCellValue(deptTotalNet.doubleValue());
                row.createCell(4).setCellValue(deptTotalDeds.doubleValue());
                row.createCell(5).setCellValue(avgSalary.doubleValue());
                row.createCell(6).setCellValue(String.format(Locale.US, "%.1f%%", deptAttendanceRate * 100.0));
                row.createCell(7).setCellValue(workingDays);

                allTotalNet = allTotalNet.add(deptTotalNet);
                allTotalDeds = allTotalDeds.add(deptTotalDeds);
                allEmpCount += empCount;
            }

            // Totals row
            r++; // blank
            Row tot = summary.createRow(r++);
            Cell totCell = tot.createCell(0);
            totCell.setCellValue("الإجمالي");
            totCell.setCellStyle(sectionStyle);
            summary.addMergedRegion(new CellRangeAddress(tot.getRowNum(), tot.getRowNum(), 0, 1));
            tot.createCell(2).setCellValue(allEmpCount);
            tot.createCell(3).setCellValue(allTotalNet.doubleValue());
            tot.createCell(4).setCellValue(allTotalDeds.doubleValue());
            tot.createCell(5).setCellValue(allEmpCount > 0
                    ? allTotalNet.divide(BigDecimal.valueOf(allEmpCount), 2, RoundingMode.HALF_UP).doubleValue()
                    : 0.0);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate departments aggregated XLSX", e);
        }
    }

    private BigDecimal computePayrollDeductions(PayrollRecord p) {
        return safe(p.getLateDeduction())
                .add(safe(p.getLeaveEarlyDeduction()))
                .add(safe(p.getAbsenceDeduction()))
                .add(safe(p.getLoanDeduction()))
                .add(safe(p.getPenalties()))
                .add(safe(p.getSocialInsurance()))
                .add(safe(p.getIncomeTax()))
                .add(safe(p.getMartyrsFundDeduction()));
    }

    private int countWorkingDaysExcludingFriday(LocalDate from, LocalDate to) {
        int count = 0;
        LocalDate cur = from;
        while (!cur.isAfter(to)) {
            if (cur.getDayOfWeek() != java.time.DayOfWeek.FRIDAY) count++;
            cur = cur.plusDays(1);
        }
        return count;
    }

    private ReportResponse generateDepartmentDetailedReport(String departmentName, LocalDate from, LocalDate to, ReportResponse response) {
        // Get department info
        List<Employee> departmentEmployees = employeeRepository.findAll().stream()
                .filter(emp -> emp.getDepartmentWorkTime().getDepartmentName().equals(departmentName))
                .collect(Collectors.toList());

        if (departmentEmployees.isEmpty()) {
            throw new RuntimeException("Department not found or has no employees: " + departmentName);
        }

        Employee firstEmployee = departmentEmployees.get(0);
        Map<String, Object> departmentInfo = new HashMap<>();
        departmentInfo.put("name", departmentName);
        departmentInfo.put("officialStart", firstEmployee.getDepartmentWorkTime().getOfficialStart());
        departmentInfo.put("officialEnd", firstEmployee.getDepartmentWorkTime().getOfficialEnd());

        // Get employee details for the period
        List<Map<String, Object>> employeeDetails = new ArrayList<>();
        BigDecimal totalPayrollCost = BigDecimal.ZERO;
        long totalLateMinutes = 0;
        long totalAbsenceDays = 0;

        for (Employee employee : departmentEmployees) {
            Map<String, Object> empDetail = new HashMap<>();
            empDetail.put("employeeCode", employee.getEmployeeCode());
            empDetail.put("name", employee.getName());
            empDetail.put("jobTitle", employee.getJobTitle());
            empDetail.put("baseSalary", employee.getBaseSalary());
            empDetail.put("hasSocialInsurance", employee.getHasSocialInsurance());

            // Calculate period statistics
            List<Attendance> attendances = attendanceRepository.findByEmployee_NameAndDateBetween(
                    employee.getName(), from, to);
            
            long empLateMinutes = attendances.stream().mapToLong(Attendance::getLateMinutes).sum();
            long empAbsenceDays = attendances.stream()
                    .filter(att -> att.getAbsenceType() != null)
                    .count();
            
            empDetail.put("totalLateMinutes", empLateMinutes);
            empDetail.put("totalAbsenceDays", empAbsenceDays);

            // Get payroll if exists
            List<PayrollRecord> payrollRecords = payrollRepository.findByEmployee_NameAndMonthBetween(
                    employee.getName(), from, to);
            if (!payrollRecords.isEmpty()) {
                PayrollRecord latestPayroll = payrollRecords.get(payrollRecords.size() - 1);
                empDetail.put("finalSalary", latestPayroll.getFinalSalary());
                totalPayrollCost = totalPayrollCost.add(latestPayroll.getFinalSalary());
            } else {
                empDetail.put("finalSalary", BigDecimal.ZERO);
            }

            // Loans summary
            List<Loan> loans = loanRepository.findByEmployee_Name(employee.getName());
            BigDecimal totalLoans = loans.stream()
                    .map(Loan::getTotalAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal remaining = loans.stream()
                    .map(Loan::getRemainingBalance)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            empDetail.put("totalLoansAmount", totalLoans);
            empDetail.put("loansRemainingBalance", remaining);

            employeeDetails.add(empDetail);
            totalLateMinutes += empLateMinutes;
            totalAbsenceDays += empAbsenceDays;
        }

        // Build summary
        Map<String, Object> summary = new HashMap<>();
        summary.put("departmentInfo", departmentInfo);
        summary.put("totalEmployees", departmentEmployees.size());
        summary.put("totalPayrollCost", totalPayrollCost);
        summary.put("totalLateMinutes", totalLateMinutes);
        summary.put("totalAbsenceDays", totalAbsenceDays);

        response.setSummary(summary);
        response.setDetails(employeeDetails);

        return response;
    }

    // Helper methods to convert entities to maps
    private Map<String, Object> attendanceToMap(Attendance att) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", att.getId());
        map.put("employeeName", att.getEmployee().getName());
        map.put("date", att.getDate());
        map.put("actualStart", att.getActualStart());
        map.put("actualEnd", att.getActualEnd());
        map.put("lateMinutes", att.getLateMinutes());
        map.put("overtimeMinutes", att.getOvertimeMinutes());
        return map;
    }

    private Map<String, Object> payrollToMap(PayrollRecord pr) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", pr.getId());
        map.put("employeeName", pr.getEmployee().getName());
        map.put("month", pr.getMonth());
        map.put("overtimePay", pr.getOvertimePay());
        map.put("lateDeduction", pr.getLateDeduction());
        map.put("loanDeduction", pr.getLoanDeduction());
        map.put("finalSalary", pr.getFinalSalary());
        map.put("workedDays", pr.getWorkedDays());
        return map;
    }

    private Map<String, Object> payrollDetailedToMap(PayrollRecord pr) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("الشهر", pr.getMonth());
        map.put("أيام العمل", pr.getWorkedDays());
        map.put("الراتب الأساسي", pr.getEmployee() != null ? pr.getEmployee().getBaseSalary() : null);
        map.put("مكافأة", pr.getBonus());
        map.put("بدل إضافي", pr.getOvertimePay());
        map.put("خصم التأخير", pr.getLateDeduction());
        map.put("خصم الانصراف المبكر", pr.getLeaveEarlyDeduction());
        map.put("خصم الغياب", pr.getAbsenceDeduction());
        map.put("الجزاءات", pr.getPenalties());
        map.put("التأمينات (11%)", pr.getSocialInsurance());
        map.put("كسب العمل / الضرائب", pr.getIncomeTax());
        map.put("صندوق الشهداء (0.05%)", pr.getMartyrsFundDeduction());
        map.put("قسط القرض", pr.getLoanDeduction());
        map.put("صافي الراتب", pr.getFinalSalary());
        return map;
    }

    private Map<String, Object> loanToMap(Loan loan) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", loan.getId());
        map.put("employeeName", loan.getEmployee().getName());
        map.put("totalAmount", loan.getTotalAmount());
        map.put("createdAt", loan.getCreatedAt());
        map.put("installmentCount", loan.getInstallments().size());
        map.put("paidInstallments", loan.getInstallments().stream()
            .mapToLong(inc -> inc.isPaid() ? 1 : 0).sum());
        return map;
    }

    private Map<String, Object> loanDetailedToMap(Loan loan) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("نوع القرض", loan.getLoanType() != null ? loan.getLoanType().name() : null);
        map.put("إجمالي القرض", loan.getTotalAmount());
        map.put("الرصيد المتبقي", loan.getRemainingBalance());
        map.put("القسط الشهري", loan.getMonthlyInstallment());
        map.put("تاريخ البداية", loan.getRepaymentStartDate());
        map.put("تاريخ الإنشاء", loan.getCreatedAt());
        map.put("عدد الأقساط", loan.getInstallments() != null ? loan.getInstallments().size() : 0);
        return map;
    }

    private Map<String, Object> absenceToMap(Attendance att) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", att.getId());
        map.put("employeeName", att.getEmployee().getName());
        map.put("date", att.getDate());
        map.put("absenceType", att.getAbsenceType());
        return map;
    }

    private Map<String, Object> disciplinaryToMap(DisciplinaryAction disciplinary) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", disciplinary.getId());
        map.put("employeeName", disciplinary.getEmployee().getName());
        map.put("amount", disciplinary.getAmount());
        map.put("reason", disciplinary.getReason());
        map.put("date", disciplinary.getDate());
        map.put("createdAt", disciplinary.getCreatedAt());
        return map;
    }

    /**
     * X-Report-User is sent percent-encoded (UTF-8) from the browser so the value stays ISO-8859-1 on the wire.
     */
    private static String decodeOptionalUtf8Header(String raw) {
        if (raw == null || raw.isBlank()) {
            return "غير محدد";
        }
        try {
            return URLDecoder.decode(raw.trim(), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return raw.trim();
        }
    }

    /** RFC 5987 {@code filename*} for non-ASCII filenames; ASCII {@code filename} for legacy agents. */
    private static void setXlsxAttachmentHeaders(HttpHeaders headers, String filename) {
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(filename, StandardCharsets.UTF_8)
                .build());
    }
}
