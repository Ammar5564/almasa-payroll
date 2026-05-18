package com.example.salaries_system.attendance.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AttendanceResponse {

    private Long id;
    private String employeeName;
    private LocalDate date;
    private LocalTime actualStart;
    private LocalTime actualEnd;
    private long lateMinutes;
    private long overtimeMinutes;
    private long leaveEarlyMinutes;
    private BigDecimal deduction;
    private String absenceStatus;
    /** SAP wage type for late bracket: N/A, /401, /402, /403 */
    private String wageType;
    /** Seconds the employee left before official end time (for pro-rata deduction audit). */
    private Long earlyLeaveSeconds;

    public AttendanceResponse() {}

    public AttendanceResponse(Long id, String employeeName, LocalDate date,
                          LocalTime actualStart, LocalTime actualEnd,
                          long lateMinutes, long overtimeMinutes, long leaveEarlyMinutes) {
        this.id = id;
        this.employeeName = employeeName;
        this.date = date;
        this.actualStart = actualStart;
        this.actualEnd = actualEnd;
        this.lateMinutes = lateMinutes;
        this.overtimeMinutes = overtimeMinutes;
        this.leaveEarlyMinutes = leaveEarlyMinutes;
    }
}
