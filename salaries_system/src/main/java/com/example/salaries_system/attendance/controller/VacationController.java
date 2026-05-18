package com.example.salaries_system.attendance.controller;

import com.example.salaries_system.attendance.dto.AbsenceHistoryRecord;
import com.example.salaries_system.attendance.dto.LeaveRequest;
import com.example.salaries_system.attendance.dto.LeaveResponse;
import com.example.salaries_system.attendance.model.Attendance;
import com.example.salaries_system.attendance.service.VacationService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * SAP HCM Infotype 2001/2006 — Vacation & Absence Quota REST Controller.
 *
 * Endpoints:
 *   POST /api/vacation/leave          — record a leave entry (any of 3 types)
 *   GET  /api/vacation/{name}/balance — current vacation balance
 *   GET  /api/vacation/{name}/history — leave history (all absences)
 */
@RestController
@RequestMapping("/api/vacation")
@CrossOrigin
public class VacationController {

    private final VacationService vacationService;

    public VacationController(VacationService vacationService) {
        this.vacationService = vacationService;
    }

    /**
     * Record a leave entry.
     * Handles ANNUAL_LEAVE, UNEXCUSED_ABSENCE, MANUAL_DEDUCTION with Friday filter.
     */
    @PostMapping("/leave")
    public LeaveResponse recordLeave(@RequestBody LeaveRequest request) {
        return vacationService.recordLeave(request);
    }

    /**
     * Returns the employee's current vacation balance.
     * Defaults to the legal quota (21 or 30) if never set.
     */
    @GetMapping("/{employeeName}/balance")
    public ResponseEntity<Map<String, Object>> getBalance(@PathVariable String employeeName) {
        int balance = vacationService.getVacationBalance(employeeName);
        return ResponseEntity.ok(Map.of(
                "employeeName",    employeeName,
                "vacationBalance", balance,
                "legalQuota",      VacationService.DEFAULT_QUOTA,
                "seniorQuota",     VacationService.SENIOR_QUOTA
        ));
    }

    /**
     * Returns the full leave history for an employee.
     */
    @GetMapping("/{employeeName}/history")
    public List<Attendance> getLeaveHistory(@PathVariable String employeeName) {
        return vacationService.getLeaveHistory(employeeName);
    }

    /**
     * Manager's global absence history screen.
     * Optional query params: name (partial match), from, to (ISO dates).
     *
     * GET /api/vacation/history
     * GET /api/vacation/history?name=أحمد
     * GET /api/vacation/history?from=2026-04-01&to=2026-04-30
     * GET /api/vacation/history?name=أحمد&from=2026-04-01&to=2026-04-30
     */
    @GetMapping("/history")
    public List<AbsenceHistoryRecord> getAbsenceHistory(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return vacationService.getAbsenceHistoryRecords(name, from, to);
    }

    /**
     * Export absence history as XLSX.
     * GET /api/vacation/history/export
     * GET /api/vacation/history/export?name=Ahmed&from=2026-01-01&to=2026-04-30
     */
    @GetMapping("/history/export")
    public ResponseEntity<byte[]> exportAbsenceHistory(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        byte[] xlsx = vacationService.exportAbsenceHistoryXlsx(name, from, to);
        String filename = "absence_history_" + LocalDate.now() + ".xlsx";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", filename);
        return ResponseEntity.ok().headers(headers).body(xlsx);
    }
}
