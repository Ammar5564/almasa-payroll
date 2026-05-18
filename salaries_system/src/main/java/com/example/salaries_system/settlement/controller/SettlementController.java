package com.example.salaries_system.settlement.controller;

import com.example.salaries_system.settlement.dto.SettlementRequest;
import com.example.salaries_system.settlement.dto.SettlementResponse;
import com.example.salaries_system.settlement.service.SettlementService;
import com.example.salaries_system.settlement.service.SettlementHtmlGenerator;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * End-of-Service Settlement REST Controller.
 *
 * POST /api/settlement/preview   — calculate without persisting (safe preview)
 * POST /api/settlement/confirm   — calculate + finalize (mark terminated, close loans)
 * POST /api/settlement/export    — generate printable HTML document
 */
@RestController
@RequestMapping("/api/settlement")
@CrossOrigin
public class SettlementController {

    private final SettlementService      settlementService;
    private final SettlementHtmlGenerator htmlGenerator;

    public SettlementController(SettlementService settlementService,
                                 SettlementHtmlGenerator htmlGenerator) {
        this.settlementService = settlementService;
        this.htmlGenerator     = htmlGenerator;
    }

    /**
     * Preview the settlement calculation.
     * Read-only; does not change any employee or loan data.
     */
    @PostMapping("/preview")
    public SettlementResponse preview(@RequestBody SettlementRequest request) {
        return settlementService.preview(request);
    }

    /**
     * Confirm and finalise the settlement.
     * Irreversible: sets employee to TERMINATED, closes loans, zeros vacation balance.
     */
    @PostMapping("/confirm")
    public SettlementResponse confirm(@RequestBody SettlementRequest request) {
        return settlementService.confirm(request);
    }

    /**
     * Export the settlement as a printable HTML document.
     * Accepts the calculated SettlementResponse body directly (no re-computation).
     */
    @PostMapping("/export")
    public ResponseEntity<String> exportHtml(@RequestBody SettlementResponse settlementData) {
        String html = htmlGenerator.generate(settlementData);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_HTML_VALUE + ";charset=UTF-8")
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"settlement_" + settlementData.getEmployeeName() + ".html\"")
                .body(html);
    }
}
