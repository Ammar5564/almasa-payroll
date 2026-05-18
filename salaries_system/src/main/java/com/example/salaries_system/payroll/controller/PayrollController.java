package com.example.salaries_system.payroll.controller;

import com.example.salaries_system.deduction.dto.TaxBreakdown;
import com.example.salaries_system.payroll.model.PayrollRecord;
import com.example.salaries_system.payroll.dto.PaySlipResponse;
import com.example.salaries_system.payroll.service.PayrollService;
import com.example.salaries_system.payroll.service.PaySlipHtmlGenerator;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payroll")
@CrossOrigin
public class PayrollController {

    private final PayrollService       payrollService;
    private final PaySlipHtmlGenerator paySlipHtmlGenerator;

    public PayrollController(PayrollService payrollService, PaySlipHtmlGenerator paySlipHtmlGenerator) {
        this.payrollService       = payrollService;
        this.paySlipHtmlGenerator = paySlipHtmlGenerator;
    }

    // ── Calculate & persist ───────────────────────────────────────────────────

    @PostMapping("/{employeeName}")
    public PayrollRecord calculateSalary(
            @PathVariable String employeeName,
            @RequestParam int year,
            @RequestParam int month) {
        return payrollService.calculateMonthlySalary(employeeName, year, month);
    }

    // ── Pay Slip ──────────────────────────────────────────────────────────────

    @GetMapping("/{employeeName}/payslip")
    public PaySlipResponse getPaySlip(
            @PathVariable String employeeName,
            @RequestParam int year,
            @RequestParam int month) {
        return payrollService.generatePaySlip(employeeName, year, month);
    }

    @GetMapping("/{employeeName}/payslip/export")
    public ResponseEntity<byte[]> exportPaySlip(
            @PathVariable String employeeName,
            @RequestParam int year,
            @RequestParam int month) {
        PaySlipResponse paySlip = payrollService.generatePaySlip(employeeName, year, month);
        String htmlContent      = paySlipHtmlGenerator.generatePaySlipHTML(paySlip);
        HttpHeaders headers     = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_HTML);
        headers.setContentDispositionFormData("attachment",
                "payslip_" + employeeName.replaceAll(" ", "_") + "_" + year + "_" + month + ".html");
        return ResponseEntity.ok().headers(headers).body(htmlContent.getBytes());
    }

    // ── Tax Breakdown ─────────────────────────────────────────────────────────

    @GetMapping("/{employeeName}/tax-breakdown")
    public TaxBreakdown getTaxBreakdown(
            @PathVariable String employeeName,
            @RequestParam int year,
            @RequestParam int month) {
        return payrollService.getTaxBreakdown(employeeName, year, month);
    }

    // ── Calculation Log ───────────────────────────────────────────────────────

    @GetMapping("/{employeeName}/calculation-log")
    public ResponseEntity<Map<String, String>> getCalculationLog(
            @PathVariable String employeeName,
            @RequestParam int year,
            @RequestParam int month) {
        PaySlipResponse paySlip = payrollService.generatePaySlip(employeeName, year, month);
        String trace = paySlip.getCalculationTrace();
        if (trace == null || trace.isBlank()) {
            return ResponseEntity.ok(Map.of("trace", "No calculation trace available for this period."));
        }
        return ResponseEntity.ok(Map.of("trace", trace));
    }

    // ── Payroll Control Record Lock ───────────────────────────────────────────

    /**
     * POST /api/payroll/lock?year=2026&month=4
     * Locks all payroll records for the given month.
     * Once locked, recalculation is blocked until manually unlocked in the DB.
     */
    @PostMapping("/lock")
    public ResponseEntity<Map<String, Object>> lockPayrollPeriod(
            @RequestParam int year,
            @RequestParam int month) {
        int count = payrollService.lockPayrollPeriod(year, month);
        return ResponseEntity.ok(Map.of(
                "status",  "LOCKED",
                "period",  year + "-" + String.format("%02d", month),
                "records", count
        ));
    }

    // ── Bank Transfer File ────────────────────────────────────────────────────

    /**
     * GET /api/payroll/bank-transfer?year=2026&month=4
     * Downloads an XLSX file ready to upload to the bank:
     * Employee Code, Employee Name, Bank Account, Net Pay (EGP), Alert
     */
    @GetMapping("/bank-transfer")
    public ResponseEntity<byte[]> downloadBankTransfer(
            @RequestParam int year,
            @RequestParam int month) {
        byte[] xlsx     = payrollService.generateBankTransferXlsx(year, month);
        String filename = "bank_transfer_" + year + "_" + String.format("%02d", month) + ".xlsx";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", filename);
        return ResponseEntity.ok().headers(headers).body(xlsx);
    }
}
