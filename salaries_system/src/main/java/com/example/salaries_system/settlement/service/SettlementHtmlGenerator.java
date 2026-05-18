package com.example.salaries_system.settlement.service;

import com.example.salaries_system.settlement.dto.SettlementResponse;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Generates a formal, print-ready HTML document for the End-of-Service Settlement.
 * Styled to match the SAP remuneration statement aesthetic — bilingual AR / EN.
 */
@Component
public class SettlementHtmlGenerator {

    public String generate(SettlementResponse s) {
        StringBuilder h = new StringBuilder();
        h.append("<!DOCTYPE html><html dir='rtl' lang='ar'><head>")
         .append("<meta charset='UTF-8'>")
         .append("<title>&#x648;&#x62B;&#x64A;&#x642;&#x629; &#x62A;&#x633;&#x648;&#x64A;&#x629; &#x646;&#x647;&#x627;&#x626;&#x64A;&#x629;</title>")
         .append("<style>")
         .append("*{box-sizing:border-box;margin:0;padding:0}")
         .append("body{font-family:'Arial',sans-serif;font-size:13px;color:#1a1a2e;background:#f4f6fb;padding:24px}")
         .append(".doc{max-width:820px;margin:auto;background:#fff;border-radius:10px;box-shadow:0 4px 24px #0002;overflow:hidden}")
         // Header bar
         .append(".doc-header{background:linear-gradient(135deg,#7b0c2b 0%,#b01040 100%);color:#fff;padding:28px 32px;display:flex;justify-content:space-between;align-items:center}")
         .append(".doc-company{font-size:20px;font-weight:700}")
         .append(".doc-subtitle{font-size:13px;opacity:.8;margin-top:4px}")
         .append(".doc-badge{background:rgba(255,255,255,.15);padding:10px 20px;border-radius:8px;text-align:center}")
         .append(".doc-badge .ref{font-size:15px;font-weight:700;letter-spacing:.5px}")
         .append(".doc-badge .lbl{font-size:10px;opacity:.8;margin-top:2px}")
         // Status banner
         .append(".status-banner{display:flex;align-items:center;justify-content:center;gap:12px;padding:10px 32px;font-size:12px;font-weight:700;letter-spacing:.5px}")
         .append(".status-confirmed{background:#e8f5e9;color:#2e7d32;border-bottom:2px solid #a5d6a7}")
         .append(".status-preview{background:#fff8e1;color:#f57f17;border-bottom:2px solid #ffe082}")
         // Employee info grid
         .append(".emp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:18px 32px;background:#fdf4f6;border-bottom:1px solid #f0d0d8}")
         .append(".info-cell{padding:8px 12px;background:#fff;border-radius:6px;border:1px solid #f0d0d8}")
         .append(".ic-lbl{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}")
         .append(".ic-val{font-size:13px;font-weight:600;color:#1a1a2e}")
         // Section headers
         .append(".section{padding:16px 32px}")
         .append(".section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid}")
         .append(".earn-title{color:#1a6b3c;border-color:#1a6b3c}")
         .append(".ded-title{color:#c0392b;border-color:#c0392b}")
         .append(".sum-title{color:#1a1a2e;border-color:#1a1a2e}")
         // Line items
         .append(".line{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f5f5f5;font-size:13px}")
         .append(".line-desc{color:#444}")
         .append(".line-sub{font-size:10px;color:#999;margin-top:1px}")
         .append(".earn-amt{color:#1a6b3c;font-weight:700;font-size:13.5px}")
         .append(".ded-amt{color:#c0392b;font-weight:700;font-size:13.5px}")
         // Sub-total row
         .append(".subtotal{display:flex;justify-content:space-between;padding:10px 0;margin-top:6px;border-top:2px solid;font-weight:700;font-size:14px}")
         .append(".subtotal-earn{border-color:#1a6b3c;color:#1a6b3c}")
         .append(".subtotal-ded{border-color:#c0392b;color:#c0392b}")
         // Net settlement box
         .append(".net-box{margin:0 32px 24px;padding:20px 28px;border-radius:12px;background:linear-gradient(135deg,#7b0c2b,#b01040);color:#fff;display:flex;justify-content:space-between;align-items:center}")
         .append(".net-label{font-size:13px;opacity:.85}")
         .append(".net-value{font-size:30px;font-weight:700;letter-spacing:-.5px}")
         // Alert
         .append(".net-alert{margin:0 32px 16px;padding:12px 16px;background:#fff3cd;border:1px solid #ffc107;border-radius:8px;color:#856404;font-size:12px}")
         // Footer
         .append(".doc-footer{padding:20px 32px;border-top:1px solid #eee;display:grid;grid-template-columns:1fr 1fr;gap:24px}")
         .append(".sig-block{text-align:center;padding-top:40px;border-top:1px solid #ccc;font-size:11px;color:#888}")
         .append("@media print{body{background:#fff;padding:0}.doc{box-shadow:none}}")
         .append("</style></head><body><div class='doc'>");

        // ── Header ───────────────────────────────────────────────────────────
        h.append("<div class='doc-header'>")
         .append("<div>")
         .append("<div class='doc-company'>&#x634;&#x631;&#x643;&#x629; &#x627;&#x644;&#x645;&#x627;&#x633;&#x647; &mdash; Al-Masa Company</div>")
         .append("<div class='doc-subtitle'>&#x648;&#x62B;&#x64A;&#x642;&#x629; &#x62A;&#x633;&#x648;&#x64A;&#x629; &#x646;&#x647;&#x627;&#x626;&#x64A;&#x629; / End-of-Service Settlement</div>")
         .append("</div>")
         .append("<div class='doc-badge'>")
         .append("<div class='ref'>").append(esc(s.getDocumentNumber())).append("</div>")
         .append("<div class='lbl'>&#x631;&#x642;&#x645; &#x627;&#x644;&#x645;&#x633;&#x62A;&#x646;&#x62F; / Document No.</div>")
         .append("</div></div>");

        // ── Status Banner ────────────────────────────────────────────────────
        if (s.isConfirmed()) {
            h.append("<div class='status-banner status-confirmed'>")
             .append("&#x2705; &#x62A;&#x645; &#x627;&#x644;&#x62A;&#x623;&#x643;&#x64A;&#x62F; &mdash; CONFIRMED &mdash; &#x62A;&#x627;&#x631;&#x64A;&#x62E;: ").append(s.getSettlementDate())
             .append("</div>");
        } else {
            h.append("<div class='status-banner status-preview'>")
             .append("&#x26A0; &#x645;&#x639;&#x627;&#x64A;&#x646;&#x629; &mdash; PREVIEW (Not Yet Confirmed)</div>");
        }

        // ── Employee Info ────────────────────────────────────────────────────
        h.append("<div class='emp-grid'>")
         .append(ic("&#x627;&#x644;&#x645;&#x648;&#x638;&#x641; / Employee",      s.getEmployeeName()))
         .append(ic("&#x643;&#x648;&#x62F; / Code",                               s.getEmployeeCode() != null ? s.getEmployeeCode() : "—"))
         .append(ic("&#x627;&#x644;&#x645;&#x633;&#x645;&#x649; / Title",         s.getJobTitle()))
         .append(ic("&#x627;&#x644;&#x642;&#x633;&#x645; / Dept",                 s.getDepartmentName() != null ? s.getDepartmentName() : "—"))
         .append(ic("&#x62A;&#x627;&#x631;&#x64A;&#x62E; &#x627;&#x644;&#x62A;&#x639;&#x64A;&#x64A;&#x646; / Hire",
                    s.getHireDate() != null ? s.getHireDate().toString() : "—"))
         .append(ic("&#x622;&#x62E;&#x631; &#x64A;&#x648;&#x645; / Last Day",
                    s.getTerminationDate() != null ? s.getTerminationDate().toString() : "—"))
         .append(ic("&#x645;&#x62F;&#x629; &#x627;&#x644;&#x62E;&#x62F;&#x645;&#x629; / Service",
                    s.getYearsOfService() + " &#x633;&#x646;&#x629; " + (s.getMonthsOfService() % 12) + " &#x634;&#x647;&#x631;"))
         .append(ic("&#x627;&#x644;&#x631;&#x627;&#x62A;&#x628; / Basic Salary",
                    fmt(s.getBaseSalary()) + " &#x62C;.&#x645;"))
         .append(ic("&#x627;&#x644;&#x645;&#x639;&#x62F;&#x644; &#x627;&#x644;&#x64A;&#x648;&#x645;&#x64A; / Daily Rate",
                    fmt(s.getDailyRate()) + " &#x62C;.&#x645;"))
         .append("</div>");

        // ── (+) EARNINGS ─────────────────────────────────────────────────────
        h.append("<div class='section'>")
         .append("<div class='section-title earn-title'>(+) &#x627;&#x644;&#x645;&#x633;&#x62A;&#x62D;&#x642;&#x627;&#x62A; / Earnings</div>")
         .append(earnLine(
             "&#x627;&#x644;&#x631;&#x627;&#x62A;&#x628; &#x627;&#x644;&#x646;&#x633;&#x628;&#x64A; / Pro-rated Salary",
             s.getBaseSalary() + " &#x62C;.&#x645; &divide; 30 &times; " + s.getDaysWorked() + " &#x64A;&#x648;&#x645;",
             s.getProratedSalary()))
         .append(earnLine(
             "&#x62A;&#x639;&#x648;&#x64A;&#x636; &#x627;&#x644;&#x625;&#x62C;&#x627;&#x632;&#x627;&#x62A; / Vacation Payout",
             s.getVacationDaysRemaining() + " &#x64A;&#x648;&#x645; &times; " + fmt(s.getDailyRate()) + " &#x62C;.&#x645;",
             s.getVacationPayout()))
         .append("<div class='subtotal subtotal-earn'>")
         .append("<span>&#x625;&#x62C;&#x645;&#x627;&#x644;&#x64A; &#x627;&#x644;&#x645;&#x633;&#x62A;&#x62D;&#x642;&#x627;&#x62A; / Settlement Gross</span>")
         .append("<span>").append(fmt(s.getSettlementGross())).append(" &#x62C;.&#x645;</span></div>")
         .append("</div>");

        // ── (-) DEDUCTIONS ────────────────────────────────────────────────────
        h.append("<div class='section'>")
         .append("<div class='section-title ded-title'>(-) &#x627;&#x644;&#x62E;&#x635;&#x648;&#x645;&#x627;&#x62A; / Deductions</div>");
        if (s.getSocialInsurance() != null && s.getSocialInsurance().compareTo(BigDecimal.ZERO) > 0) {
            h.append(dedLine("&#x62A;&#x623;&#x645;&#x64A;&#x646; &#x627;&#x62C;&#x62A;&#x645;&#x627;&#x639;&#x64A; 11% / Social Insurance",
                    "11% &#x645;&#x646; &#x627;&#x644;&#x648;&#x639;&#x627;&#x621; &#x627;&#x644;&#x635;&#x627;&#x641;&#x64A;", s.getSocialInsurance()));
        }
        if (s.getIncomeTax() != null && s.getIncomeTax().compareTo(BigDecimal.ZERO) > 0) {
            h.append(dedLine("&#x636;&#x631;&#x64A;&#x628;&#x629; &#x62F;&#x62E;&#x644; / Income Tax",
                    "&#x634;&#x631;&#x627;&#x626;&#x62D; &#x636;&#x631;&#x64A;&#x628;&#x629; &#x645;&#x635;&#x631;&#x64A;&#x629;", s.getIncomeTax()));
        }
        if (s.getMartysFund() != null && s.getMartysFund().compareTo(BigDecimal.ZERO) > 0) {
            h.append(dedLine("&#x635;&#x646;&#x62F;&#x648;&#x642; &#x627;&#x644;&#x634;&#x647;&#x62F;&#x627;&#x621; 0.05% / Martyrs' Fund",
                    "0.05% &#x645;&#x646; &#x627;&#x644;&#x648;&#x639;&#x627;&#x621;", s.getMartysFund()));
        }
        if (s.getLoanBalance() != null && s.getLoanBalance().compareTo(BigDecimal.ZERO) > 0) {
            h.append(dedLine("&#x627;&#x633;&#x62A;&#x631;&#x62F;&#x627;&#x62F; &#x627;&#x644;&#x642;&#x631;&#x648;&#x636; / Loan Recovery",
                    "&#x625;&#x62C;&#x645;&#x627;&#x644;&#x64A; &#x627;&#x644;&#x623;&#x631;&#x635;&#x62F;&#x629; &#x627;&#x644;&#x645;&#x62A;&#x628;&#x642;&#x64A;&#x629;", s.getLoanBalance()));
        }
        h.append("<div class='subtotal subtotal-ded'>")
         .append("<span>&#x625;&#x62C;&#x645;&#x627;&#x644;&#x64A; &#x627;&#x644;&#x62E;&#x635;&#x648;&#x645;&#x627;&#x62A; / Total Deductions</span>")
         .append("<span>(").append(fmt(s.getTotalDeductions())).append(") &#x62C;.&#x645;</span></div>")
         .append("</div>");

        // ── Net Alert ────────────────────────────────────────────────────────
        if (s.isNetAlert()) {
            h.append("<div class='net-alert'>")
             .append("&#x26A0; &#x62A;&#x646;&#x628;&#x64A;&#x647;: &#x635;&#x627;&#x641;&#x64A; &#x627;&#x644;&#x62A;&#x633;&#x648;&#x64A;&#x629; &#x643;&#x627;&#x646; &#x633;&#x627;&#x644;&#x628;&#x627;&#x8B &#x648;&#x62A;&#x645; &#x62A;&#x635;&#x641;&#x64A;&#x631;&#x647; &#x625;&#x644;&#x649; &#x635;&#x641;&#x631;. &#x64A;&#x631;&#x62C;&#x649; &#x645;&#x631;&#x627;&#x62C;&#x639;&#x629; &#x645;&#x648;&#x627;&#x631;&#x62F; &#x628;&#x634;&#x631;&#x64A;&#x629;.")
             .append(" Net amount was negative &mdash; floored at zero. HR review required.")
             .append("</div>");
        }

        // ── (=) Net Settlement ───────────────────────────────────────────────
        h.append("<div class='net-box'>")
         .append("<div>")
         .append("<div class='net-label'>(=) &#x635;&#x627;&#x641;&#x64A; &#x645;&#x628;&#x644;&#x63A; &#x627;&#x644;&#x62A;&#x633;&#x648;&#x64A;&#x629; / NET SETTLEMENT</div>")
         .append("<div style='font-size:11px;opacity:.7;margin-top:2px'>")
         .append("&#x648;&#x62B;&#x64A;&#x642;&#x629; &#x631;&#x642;&#x645;: ").append(esc(s.getDocumentNumber()))
         .append(" &mdash; ").append(s.getSettlementDate())
         .append("</div></div>")
         .append("<div class='net-value'>").append(fmt(s.getNetSettlement())).append(" &#x62C;.&#x645;</div>")
         .append("</div>");

        // ── Signature Footer ─────────────────────────────────────────────────
        h.append("<div class='doc-footer'>")
         .append("<div class='sig-block'>&#x62A;&#x648;&#x642;&#x64A;&#x639; &#x627;&#x644;&#x645;&#x648;&#x638;&#x641; / Employee Signature<br><small>")
         .append(esc(s.getEmployeeName())).append("</small></div>")
         .append("<div class='sig-block'>&#x62A;&#x648;&#x642;&#x64A;&#x639; &#x645;&#x62F;&#x64A;&#x631; &#x645;&#x648;&#x627;&#x631;&#x62F; &#x628;&#x634;&#x631;&#x64A;&#x629; / HR Manager</div>")
         .append("</div>");

        h.append("</div></body></html>");
        return h.toString();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private String ic(String label, String value) {
        return "<div class='info-cell'><div class='ic-lbl'>" + label +
               "</div><div class='ic-val'>" + esc(value) + "</div></div>";
    }

    private String earnLine(String desc, String sub, BigDecimal amt) {
        if (amt == null || amt.compareTo(BigDecimal.ZERO) == 0) return "";
        return "<div class='line'><div><div class='line-desc'>" + desc + "</div>" +
               "<div class='line-sub'>" + sub + "</div></div>" +
               "<span class='earn-amt'>+ " + fmt(amt) + " &#x62C;.&#x645;</span></div>";
    }

    private String dedLine(String desc, String sub, BigDecimal amt) {
        if (amt == null || amt.compareTo(BigDecimal.ZERO) == 0) return "";
        return "<div class='line'><div><div class='line-desc'>" + desc + "</div>" +
               "<div class='line-sub'>" + sub + "</div></div>" +
               "<span class='ded-amt'>(" + fmt(amt) + ") &#x62C;.&#x645;</span></div>";
    }

    private String fmt(BigDecimal v) {
        if (v == null) return "0.00";
        return String.format("%,.2f", v.doubleValue());
    }

    private String esc(String s) {
        if (s == null) return "—";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
