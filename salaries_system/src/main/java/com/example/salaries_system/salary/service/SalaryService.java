package com.example.salaries_system.salary.service;

import com.example.salaries_system.attendance.model.Attendance;
import com.example.salaries_system.audit.AuditActions;
import com.example.salaries_system.audit.AuditModules;
import com.example.salaries_system.audit.service.AuditLogService;
import com.example.salaries_system.worktime.model.DepartmentWorkTime;
import com.example.salaries_system.employee.model.Employee;
import com.example.salaries_system.attendance.repository.AttendanceRepository;
import com.example.salaries_system.employee.repository.EmployeeRepository;
import com.example.salaries_system.common.util.TimeCalculator;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class SalaryService {

    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public SalaryService(
            EmployeeRepository employeeRepository,
            AttendanceRepository attendanceRepository,
            AuditLogService auditLogService,
            ObjectMapper objectMapper
    ) {
        this.employeeRepository = employeeRepository;
        this.attendanceRepository = attendanceRepository;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    /**
     * Registers attendance under a transaction: resolve employee by name, lock employee row by surrogate PK,
     * duplicate-check by {@code employee_id}, persist with DB unique (employee_id, date) as final guard.
     */
    @Transactional
    public Attendance registerAttendance(
            String employeeName,
            LocalDate date,
            LocalTime actualStart,
            LocalTime actualEnd
    ) {
        Employee resolved = employeeRepository.findByName(employeeName)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Employee employee = employeeRepository.findByIdForUpdate(resolved.getId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        String proposedSnapshot = jsonAttendanceProposal(employee.getId(), employee.getName(), date, actualStart, actualEnd);

        if (attendanceRepository.existsByEmployee_IdAndDate(employee.getId(), date)) {
            auditLogService.record(
                    AuditModules.ATTENDANCE,
                    AuditActions.ATTENDANCE_DUPLICATE_REJECTED,
                    "Attendance",
                    attendanceResourceKey(employee.getId(), date),
                    "Rejected under row lock (already recorded)",
                    null,
                    proposedSnapshot);
            throw new RuntimeException("Attendance already recorded for " + date);
        }

        DepartmentWorkTime dept = employee.getDepartmentWorkTime();
        LocalTime officialStart = (dept != null) ? dept.getOfficialStart() : LocalTime.of(8, 30);
        LocalTime officialEnd   = (dept != null) ? dept.getOfficialEnd()   : LocalTime.of(17, 30);

        long lateMinutes       = 0;
        long overtimeMinutes   = 0;
        long leaveEarlyMinutes = 0;
        Long earlyLeaveSeconds = null;

        boolean isFriday = date.getDayOfWeek() == DayOfWeek.FRIDAY;
        boolean isExempt = isExemptFromTimeEvaluation(employee);

        if (!isFriday && !isExempt) {
            lateMinutes     = TimeCalculator.calculateLate(officialStart, actualStart);
            overtimeMinutes = TimeCalculator.calculateOvertime(officialEnd, actualEnd);

            if (actualEnd != null && actualEnd.isBefore(officialEnd)) {
                long secondsEarly = Duration.between(actualEnd, officialEnd).getSeconds();
                earlyLeaveSeconds = secondsEarly;
                leaveEarlyMinutes = secondsEarly / 60;
                overtimeMinutes   = 0;
            }
        }

        Attendance attendance = new Attendance();
        attendance.setEmployee(employee);
        attendance.setDate(date);
        attendance.setActualStart(actualStart);
        attendance.setActualEnd(actualEnd);
        attendance.setLateMinutes(lateMinutes);
        attendance.setOvertimeMinutes(overtimeMinutes);
        attendance.setLeaveEarlyMinutes(leaveEarlyMinutes);
        attendance.setEarlyLeaveSeconds(earlyLeaveSeconds);

        try {
            Attendance saved = attendanceRepository.save(attendance);
            String afterSnapshot = jsonAttendanceResult(saved.getId(), employee.getId(), employee.getName(), date,
                    actualStart, actualEnd, lateMinutes, overtimeMinutes);
            auditLogService.record(
                    AuditModules.ATTENDANCE,
                    AuditActions.ATTENDANCE_REGISTERED,
                    "Attendance",
                    attendanceResourceKey(employee.getId(), date),
                    "Attendance recorded",
                    null,
                    afterSnapshot);
            return saved;
        } catch (DataIntegrityViolationException ex) {
            auditLogService.record(
                    AuditModules.ATTENDANCE,
                    AuditActions.ATTENDANCE_DUPLICATE_REJECTED,
                    "Attendance",
                    attendanceResourceKey(employee.getId(), date),
                    "Rejected by unique constraint (employee_id, date)",
                    null,
                    proposedSnapshot);
            throw new RuntimeException("Attendance already recorded for " + date);
        }
    }

    private static String attendanceResourceKey(Long employeeId, LocalDate date) {
        return employeeId + "|" + date;
    }

    private String jsonAttendanceProposal(Long employeeId, String employeeName, LocalDate date,
                                          LocalTime actualStart, LocalTime actualEnd) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("employeeId", employeeId);
        m.put("employeeName", employeeName);
        m.put("date", date.toString());
        m.put("actualStart", actualStart != null ? actualStart.toString() : null);
        m.put("actualEnd", actualEnd != null ? actualEnd.toString() : null);
        return writeJson(m);
    }

    private String jsonAttendanceResult(Long attendanceRowId, Long employeeId, String employeeName, LocalDate date,
                                        LocalTime actualStart, LocalTime actualEnd,
                                        long lateMinutes, long overtimeMinutes) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("attendanceId", attendanceRowId);
        m.put("employeeId", employeeId);
        m.put("employeeName", employeeName);
        m.put("date", date.toString());
        m.put("actualStart", actualStart != null ? actualStart.toString() : null);
        m.put("actualEnd", actualEnd != null ? actualEnd.toString() : null);
        m.put("lateMinutes", lateMinutes);
        m.put("overtimeMinutes", overtimeMinutes);
        return writeJson(m);
    }

    private String writeJson(Map<String, Object> map) {
        try {
            return objectMapper.writeValueAsString(map);
        } catch (JacksonException e) {
            return map.toString();
        }
    }

    private boolean isExemptFromTimeEvaluation(Employee employee) {
        if (Boolean.TRUE.equals(employee.getFlexibleSchedule())) return true;
        String cat = employee.getCategory();
        if (cat != null && cat.equalsIgnoreCase("Top Management")) return true;
        return employee.getDepartmentWorkTime() != null
                && Boolean.TRUE.equals(employee.getDepartmentWorkTime().getFlexibleGroup());
    }
}
