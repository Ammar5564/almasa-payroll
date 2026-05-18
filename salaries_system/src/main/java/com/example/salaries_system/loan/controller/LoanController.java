package com.example.salaries_system.loan.controller;

import com.example.salaries_system.loan.dto.LoanRequest;
import com.example.salaries_system.loan.model.Loan;
import com.example.salaries_system.loan.service.LoanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loans")
@CrossOrigin
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @PostMapping("/{employeeName}")
    public Loan createLoan(@PathVariable String employeeName,
                           @RequestBody LoanRequest loanRequest) {
        return loanService.createLoan(employeeName, loanRequest);
    }

    // ── Query ─────────────────────────────────────────────────────────────────

    @GetMapping("/{employeeName}")
    public List<Loan> getEmployeeLoans(@PathVariable String employeeName) {
        return loanService.getEmployeeLoans(employeeName);
    }

    // ── Manual Cash Repayment ─────────────────────────────────────────────────

    /**
     * POST /api/loans/{loanId}/cash-payment?amount=500
     * Records a cash repayment made at the office (not via payroll deduction).
     */
    @PostMapping("/{loanId}/cash-payment")
    public Loan recordCashPayment(@PathVariable Long loanId,
                                  @RequestParam BigDecimal amount) {
        return loanService.recordCashPayment(loanId, amount);
    }

    // ── End-of-Service Settlement ─────────────────────────────────────────────

    /**
     * GET /api/loans/{employeeName}/settlement
     * Returns the total outstanding loan balance.
     * Used during termination to deduct from the final settlement.
     */
    @GetMapping("/{employeeName}/settlement")
    public ResponseEntity<Map<String, Object>> getSettlementBalance(
            @PathVariable String employeeName) {
        BigDecimal balance = loanService.getSettlementBalance(employeeName);
        return ResponseEntity.ok(Map.of(
                "employeeName",      employeeName,
                "settlementBalance", balance,
                "hasOutstanding",    balance.compareTo(BigDecimal.ZERO) > 0
        ));
    }
}
