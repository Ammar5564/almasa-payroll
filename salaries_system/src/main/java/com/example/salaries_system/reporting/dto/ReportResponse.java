package com.example.salaries_system.reporting.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class ReportResponse {
    
    private String reportTitle;
    private LocalDate generatedDate;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private Map<String, Object> summary;
    private List<Map<String, Object>> details;

    // ── Rich reporting payload (used by Dashboard previews + SheetJS exports) ──
    private Map<String, Object> employeeInfo;
    private List<Map<String, Object>> attendanceRecords;
    private List<Map<String, Object>> absenceRecords;
    private List<Map<String, Object>> payrollRecords;
    private List<Map<String, Object>> loans;
    private List<Map<String, Object>> disciplinaryActions;
    
    public ReportResponse() {}

    public ReportResponse(String title, LocalDate start, LocalDate end) {
        this.reportTitle = title;
        this.generatedDate = LocalDate.now();
        this.periodStart = start;
        this.periodEnd = end;
    }

    public String getReportTitle() { return reportTitle; }
    public void setReportTitle(String reportTitle) { this.reportTitle = reportTitle; }

    public LocalDate getGeneratedDate() { return generatedDate; }
    public void setGeneratedDate(LocalDate generatedDate) { this.generatedDate = generatedDate; }

    public LocalDate getPeriodStart() { return periodStart; }
    public void setPeriodStart(LocalDate periodStart) { this.periodStart = periodStart; }

    public LocalDate getPeriodEnd() { return periodEnd; }
    public void setPeriodEnd(LocalDate periodEnd) { this.periodEnd = periodEnd; }

    public Map<String, Object> getSummary() { return summary; }
    public void setSummary(Map<String, Object> summary) { this.summary = summary; }

    public List<Map<String, Object>> getDetails() { return details; }
    public void setDetails(List<Map<String, Object>> details) { this.details = details; }

    public Map<String, Object> getEmployeeInfo() { return employeeInfo; }
    public void setEmployeeInfo(Map<String, Object> employeeInfo) { this.employeeInfo = employeeInfo; }

    public List<Map<String, Object>> getAttendanceRecords() { return attendanceRecords; }
    public void setAttendanceRecords(List<Map<String, Object>> attendanceRecords) { this.attendanceRecords = attendanceRecords; }

    public List<Map<String, Object>> getAbsenceRecords() { return absenceRecords; }
    public void setAbsenceRecords(List<Map<String, Object>> absenceRecords) { this.absenceRecords = absenceRecords; }

    public List<Map<String, Object>> getPayrollRecords() { return payrollRecords; }
    public void setPayrollRecords(List<Map<String, Object>> payrollRecords) { this.payrollRecords = payrollRecords; }

    public List<Map<String, Object>> getLoans() { return loans; }
    public void setLoans(List<Map<String, Object>> loans) { this.loans = loans; }

    public List<Map<String, Object>> getDisciplinaryActions() { return disciplinaryActions; }
    public void setDisciplinaryActions(List<Map<String, Object>> disciplinaryActions) { this.disciplinaryActions = disciplinaryActions; }
}
