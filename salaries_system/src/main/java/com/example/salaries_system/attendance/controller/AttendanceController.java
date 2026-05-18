package com.example.salaries_system.attendance.controller;

import com.example.salaries_system.attendance.dto.AttendanceImportSummary;
import com.example.salaries_system.attendance.dto.AttendanceRequest;
import com.example.salaries_system.attendance.dto.AttendanceResponse;
import com.example.salaries_system.attendance.model.Attendance;
import com.example.salaries_system.attendance.model.AbsenceType;
import com.example.salaries_system.attendance.repository.AttendanceRepository;
import com.example.salaries_system.deduction.service.DeductionServiceImpl;
import com.example.salaries_system.common.util.TimeCalculator;
import com.example.salaries_system.employee.model.Employee;
import com.example.salaries_system.employee.repository.EmployeeRepository;
import com.example.salaries_system.salary.service.SalaryService;
import com.example.salaries_system.worktime.model.DepartmentWorkTime;

import com.example.salaries_system.attendance.service.AttendanceTemplateService;

import org.apache.poi.ss.usermodel.*;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin
public class AttendanceController {

    private final SalaryService salaryService;
    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceTemplateService attendanceTemplateService;

    public AttendanceController(SalaryService salaryService,
                                AttendanceRepository attendanceRepository,
                                EmployeeRepository employeeRepository,
                                AttendanceTemplateService attendanceTemplateService) {
        this.salaryService = salaryService;
        this.attendanceRepository = attendanceRepository;
        this.employeeRepository = employeeRepository;
        this.attendanceTemplateService = attendanceTemplateService;
    }

    // ── Register single attendance ────────────────────────────────────────────

    @PostMapping
    public AttendanceResponse registerAttendance(@RequestBody AttendanceRequest request) {
        Attendance attendance = salaryService.registerAttendance(
                request.getEmployeeName(),
                request.getDate(),
                request.getActualStart(),
                request.getActualEnd()
        );
        return toResponse(attendance);
    }

    // ── Template ──────────────────────────────────────────────────────────────

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate() throws Exception {
        byte[] bytes = attendanceTemplateService.buildImportTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("attendance_import_template.xlsx", StandardCharsets.UTF_8)
                .build());
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    // ── Excel Import ──────────────────────────────────────────────────────────

    @PostMapping("/import")
    public AttendanceImportSummary importAttendance(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "branchId", required = false, defaultValue = "") String branchId,
            @RequestParam(value = "importMode", required = false, defaultValue = "Daily") String importMode
    ) throws Exception {
        List<AttendanceResponse> results = new ArrayList<>();
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");

        int rowsRead = 0;
        int skippedDuplicate = 0;
        int skippedInvalidEmployee = 0;
        int skippedOther = 0;

        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                String empCode  = cellStr(row.getCell(0));
                String dateStr  = cellStr(row.getCell(1));
                String checkIn  = cellStr(row.getCell(2));
                String checkOut = cellStr(row.getCell(3));
                String remark   = cellStr(row.getCell(4));

                if (empCode.isBlank() || dateStr.isBlank()) {
                    continue;
                }

                rowsRead++;

                Employee employee = employeeRepository.findByEmployeeCode(empCode.trim())
                        .or(() -> employeeRepository.findByName(empCode.trim()))
                        .orElse(null);
                if (employee == null) {
                    skippedInvalidEmployee++;
                    continue;
                }

                LocalDate date;
                try {
                    date = LocalDate.parse(dateStr, dateFmt);
                } catch (Exception e) {
                    skippedOther++;
                    continue;
                }

                if (attendanceRepository.existsByEmployee_IdAndDate(employee.getId(), date)) {
                    skippedDuplicate++;
                    continue;
                }

                Attendance a = new Attendance();
                a.setEmployee(employee);
                a.setDate(date);
                a.setAbsenceStatus(remark.isBlank() ? null : remark);

                boolean isFriday = date.getDayOfWeek() == DayOfWeek.FRIDAY;
                boolean isExempt = isExemptFromTimeEvaluation(employee);

                long lateMinutes       = 0;
                long overtimeMinutes   = 0;
                long leaveEarlyMinutes = 0;
                Long earlyLeaveSeconds = null;

                if (!checkIn.isBlank() && !checkOut.isBlank()) {
                    LocalTime actualStart = LocalTime.parse(checkIn, timeFmt);
                    LocalTime actualEnd   = LocalTime.parse(checkOut, timeFmt);
                    a.setActualStart(actualStart);
                    a.setActualEnd(actualEnd);

                    if (!isFriday && !isExempt) {
                        DepartmentWorkTime dept = employee.getDepartmentWorkTime();
                        if (dept != null) {
                            lateMinutes     = TimeCalculator.calculateLate(dept.getOfficialStart(), actualStart);
                            overtimeMinutes = TimeCalculator.calculateOvertime(dept.getOfficialEnd(), actualEnd);
                            if (actualEnd.isBefore(dept.getOfficialEnd())) {
                                long secondsEarly = Duration.between(actualEnd, dept.getOfficialEnd()).getSeconds();
                                earlyLeaveSeconds = secondsEarly;
                                leaveEarlyMinutes = secondsEarly / 60;
                                overtimeMinutes   = 0;
                            }
                        }
                    }
                }

                a.setLateMinutes(lateMinutes);
                a.setOvertimeMinutes(overtimeMinutes);
                a.setLeaveEarlyMinutes(leaveEarlyMinutes);
                a.setEarlyLeaveSeconds(earlyLeaveSeconds);

                try {
                    Attendance saved = attendanceRepository.save(a);
                    results.add(toResponse(saved));
                } catch (DataIntegrityViolationException ignored) {
                    skippedDuplicate++;
                }
            }
        }
        return new AttendanceImportSummary(
                results,
                rowsRead,
                results.size(),
                skippedDuplicate,
                skippedInvalidEmployee,
                skippedOther
        );
    }

    // ── Absence recording ─────────────────────────────────────────────────────

    @PostMapping("/absence")
    public Attendance recordAbsence(@RequestBody AbsenceRequest request) {
        if (request.getEmployeeName() == null || request.getEmployeeName().trim().isEmpty()) {
            throw new RuntimeException("Employee name is required");
        }
        if (request.getDate() == null) request.setDate(LocalDate.now());
        if (request.getAbsenceType() == null) throw new RuntimeException("Absence type is required");

        Employee employee = employeeRepository.findByName(request.getEmployeeName())
                .orElseThrow(() -> new RuntimeException("Employee not found: " + request.getEmployeeName()));

        if (attendanceRepository.existsByEmployee_NameAndDate(request.getEmployeeName(), request.getDate())) {
            throw new RuntimeException("Attendance/absence already recorded for employee " +
                    request.getEmployeeName() + " on " + request.getDate());
        }

        Attendance attendance = new Attendance();
        attendance.setEmployee(employee);
        attendance.setDate(request.getDate());
        attendance.setAbsenceType(request.getAbsenceType());
        attendance.setActualStart(null);
        attendance.setActualEnd(null);
        attendance.setLateMinutes(0);
        attendance.setOvertimeMinutes(0);

        if (request.getAbsenceType() == AbsenceType.WITHOUT_PERMISSION
                && request.getPenaltyMultiplier() != null
                && request.getPenaltyMultiplier().compareTo(BigDecimal.ZERO) > 0) {
            attendance.setPenaltyMultiplier(request.getPenaltyMultiplier());
        } else {
            attendance.setPenaltyMultiplier(BigDecimal.ONE);
        }

        return attendanceRepository.save(attendance);
    }

    @GetMapping("/absences")
    public List<Attendance> getAbsences(@RequestParam String employeeName) {
        return attendanceRepository.findByEmployee_NameAndAbsenceTypeIsNotNull(employeeName);
    }

    // ── No-Punch Alert ────────────────────────────────────────────────────────
    /**
     * Scans the given date range and returns all (employeeName, date) pairs
     * where the employee has no attendance record and no absence record.
     * Fridays are automatically excluded.
     * Employees without a linked DepartmentWorkTime are skipped.
     */
    @GetMapping("/detect-no-punch")
    public List<Map<String, String>> detectNoPunch(
            @RequestParam String fromDate,
            @RequestParam String toDate
    ) {
        LocalDate from = LocalDate.parse(fromDate);
        LocalDate to   = LocalDate.parse(toDate);
        List<Employee> allEmployees = employeeRepository.findAll();
        List<Map<String, String>> missing = new ArrayList<>();

        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            if (day.getDayOfWeek() == DayOfWeek.FRIDAY) continue;

            for (Employee emp : allEmployees) {
                if (emp.getDepartmentWorkTime() == null) continue;
                if (isExemptFromTimeEvaluation(emp)) continue;

                boolean hasRecord = attendanceRepository
                        .existsByEmployee_NameAndDate(emp.getName(), day);
                if (!hasRecord) {
                    Map<String, String> entry = new HashMap<>();
                    entry.put("employeeName", emp.getName());
                    entry.put("date", day.toString());
                    entry.put("alert", "NO_PUNCH – flagged as unexcused absence");
                    missing.add(entry);
                }
            }
        }
        return missing;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AttendanceResponse toResponse(Attendance a) {
        AttendanceResponse r = new AttendanceResponse(
                a.getId(), a.getEmployee().getName(), a.getDate(),
                a.getActualStart(), a.getActualEnd(),
                a.getLateMinutes(), a.getOvertimeMinutes(), a.getLeaveEarlyMinutes()
        );
        r.setDeduction(a.getManualDeduction() != null ? a.getManualDeduction() : BigDecimal.ZERO);
        r.setAbsenceStatus(a.getAbsenceStatus());
        r.setWageType(DeductionServiceImpl.lateWageType(a.getLateMinutes()));
        r.setEarlyLeaveSeconds(a.getEarlyLeaveSeconds());
        return r;
    }

    private boolean isExemptFromTimeEvaluation(Employee employee) {
        if (Boolean.TRUE.equals(employee.getFlexibleSchedule())) return true;
        String cat = employee.getCategory();
        if (cat != null && cat.equalsIgnoreCase("Top Management")) return true;
        return employee.getDepartmentWorkTime() != null
                && Boolean.TRUE.equals(employee.getDepartmentWorkTime().getFlexibleGroup());
    }

    private String cellStr(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                double v = cell.getNumericCellValue();
                yield v == Math.floor(v) ? String.valueOf((long) v) : String.valueOf(v);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    // ── Inner DTOs ────────────────────────────────────────────────────────────

    public static class AbsenceRequest {
        private String employeeName;
        private LocalDate date;
        private AbsenceType absenceType;
        /** 1.0 = 1 day, 2.0 = 2 days per 1 absent day (Egyptian law factories). */
        private BigDecimal penaltyMultiplier;

        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String v) { this.employeeName = v; }
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate v) { this.date = v; }
        public AbsenceType getAbsenceType() { return absenceType; }
        public void setAbsenceType(AbsenceType v) { this.absenceType = v; }
        public BigDecimal getPenaltyMultiplier() { return penaltyMultiplier; }
        public void setPenaltyMultiplier(BigDecimal v) { this.penaltyMultiplier = v; }
    }
}
