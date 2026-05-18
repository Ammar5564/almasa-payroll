package com.example.salaries_system.payroll.service;

import com.example.salaries_system.payroll.dto.PaySlipResponse;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Generates an SAP-style two-column Remuneration Statement (pay slip) as HTML.
 * Structure follows the standard:
 *   Header → Employee Info → Earnings | Deductions columns → Footer (Net Pay)
 */
@Component
public class PaySlipHtmlGenerator {

    public String generatePaySlipHTML(PaySlipResponse p) {
        StringBuilder h = new StringBuilder();
        h.append("<!DOCTYPE html><html dir='rtl' lang='ar'><head>")
         .append("<meta charset='UTF-8'>")
         .append("<title>Pay Slip – كشف راتب</title>")
         .append("<style>")
         .append("*{box-sizing:border-box;margin:0;padding:0}")
         .append("body{font-family:'Arial',sans-serif;font-size:13px;color:#1a1a2e;background:#f4f6fb;padding:24px}")
         .append(".slip{max-width:900px;margin:auto;background:#fff;border-radius:10px;box-shadow:0 4px 24px #0002;overflow:hidden}")
         .append(".slip-header{background:linear-gradient(135deg,#1a1a2e 0%,#2d3561 100%);color:#fff;padding:28px 32px;display:flex;justify-content:space-between;align-items:center}")
         .append(".company{font-size:22px;font-weight:700;letter-spacing:.5px}")
         .append(".slip-title{font-size:16px;opacity:.85;margin-top:4px}")
         .append(".period-badge{background:rgba(255,255,255,.15);padding:10px 20px;border-radius:8px;text-align:center}")
         .append(".period-badge .month{font-size:18px;font-weight:700}")
         .append(".period-badge .label{font-size:11px;opacity:.8;margin-top:2px}")
         .append(".emp-info{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:20px 32px;background:#f8f9ff;border-bottom:1px solid #e8ecf4}")
         .append(".info-item{padding:10px 14px;background:#fff;border-radius:6px;border:1px solid #e8ecf4}")
         .append(".info-item .lbl{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}")
         .append(".info-item .val{font-size:14px;font-weight:600;color:#1a1a2e}")
         .append(".two-col{display:grid;grid-template-columns:1fr 1fr;gap:0;padding:24px 32px}")
         .append(".col-head{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;padding:8px 0;border-bottom:2px solid;margin-bottom:8px}")
         .append(".earn-head{color:#1a6b3c;border-color:#1a6b3c}")
         .append(".ded-head{color:#c0392b;border-color:#c0392b}")
         .append(".row-item{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:12.5px}")
         .append(".row-item .desc{color:#444}")
         .append(".earn-amt{color:#1a6b3c;font-weight:600;font-size:13px}")
         .append(".ded-amt{color:#c0392b;font-weight:600;font-size:13px}")
         .append(".col-total{display:flex;justify-content:space-between;padding:10px 0;margin-top:8px;border-top:2px solid;font-weight:700;font-size:13px}")
         .append(".earn-total{border-color:#1a6b3c;color:#1a6b3c}")
         .append(".ded-total{border-color:#c0392b;color:#c0392b}")
         .append(".footer{background:#f8f9ff;border-top:2px solid #e8ecf4;padding:20px 32px;display:flex;justify-content:space-between;align-items:center}")
         .append(".net-box{background:linear-gradient(135deg,#1a6b3c,#27ae60);color:#fff;padding:16px 32px;border-radius:10px;text-align:center}")
         .append(".net-label{font-size:11px;opacity:.85;letter-spacing:.5px}")
         .append(".net-value{font-size:28px;font-weight:700;margin-top:4px}")
         .append(".alert-box{background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px 16px;color:#856404;font-size:12px;max-width:320px}")
         .append(".locked-badge{background:#6c757d;color:#fff;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700}")
         .append(".retro-badge{background:#fd7e14;color:#fff;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;margin-left:8px}")
         .append(".trace-section{padding:16px 32px;background:#fafafa;border-top:1px solid #e8ecf4}")
         .append(".trace-title{font-size:11px;font-weight:700;color:#888;letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px}")
         .append(".trace-box{background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:12px;font-family:monospace;font-size:11px;color:#333;white-space:pre-wrap;max-height:300px;overflow-y:auto}")
         .append(".leave-section{padding:16px 32px;background:#f0f7ff;border-top:1px solid #d0e4f7}")
         .append(".leave-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#1a4a7a;margin-bottom:10px}")
         .append(".leave-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}")
         .append(".leave-card{background:#fff;border-radius:8px;padding:10px 14px;border:1px solid #d0e4f7;text-align:center}")
         .append(".leave-card .lc-label{font-size:10px;color:#5a7a9a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}")
         .append(".leave-card .lc-value{font-size:20px;font-weight:700;color:#1a4a7a}")
         .append(".leave-card .lc-sub{font-size:10px;color:#888;margin-top:2px}")
         .append(".lc-warn{border-color:#f5a623!important}.lc-warn .lc-value{color:#c0392b!important}")
         .append("@media print{body{background:#fff;padding:0}.slip{box-shadow:none}.trace-section{display:none}}")
         .append("</style></head><body>")
         .append("<div class='slip'>");

        // ── Header ──────────────────────────────────────────────────────────
        h.append("<div class='slip-header'>")
         .append("<div><div class='company'>شركة الماسة – Al-Masa Company</div>")
         .append("<div class='slip-title'>كشف راتب / Remuneration Statement</div></div>")
         .append("<div class='period-badge'>")
         .append("<div class='month'>").append(p.getMonth()).append("</div>")
         .append("<div class='label'>Pay Period</div>")
         .append("</div>")
         .append("</div>");

        // ── Employee Info ────────────────────────────────────────────────────
        h.append("<div class='emp-info'>")
         .append(infoItem("الموظف / Employee",  p.getEmployeeName()))
         .append(infoItem("الكود / Code",       p.getEmployeeCode() != null ? p.getEmployeeCode() : "—"))
         .append(infoItem("الوظيفة / Title",    p.getJobTitle()))
         .append(infoItem("القسم / Department", p.getDepartmentName() != null ? p.getDepartmentName() : "—"))
         .append(infoItem("الموقع / Location",  p.getBranchName() != null ? p.getBranchName() : "المكتب الرئيسي"))
         .append(infoItem("الراتب الأساسي / Basic", fmt(p.getBaseSalary()) + " EGP"))
         .append("</div>");

        // ── Two-Column: Earnings | Deductions ────────────────────────────────
        h.append("<div class='two-col'>");

        // EARNINGS
        h.append("<div>")
         .append("<div class='col-head earn-head'>✚ الإضافات / Earnings</div>")
         .append(earnRow("الراتب الأساسي / Basic Salary",    p.getBaseSalary()))
         .append(earnRow("العمل الإضافي / Overtime",         p.getAdditions().getOvertimePay()))
         .append(earnRow("مكافآت / Bonus",                   p.getAdditions().getBonus()))
         .append(earnRow("مستحقات سابقة / Arrears",          p.getAdditions().getArrears()))
         .append(earnRow("بدلات / Allowances",               p.getAdditions().getAllowances()))
         .append("<div class='col-total earn-total'><span>إجمالي الإضافات / Total Earnings</span>")
         .append("<span>").append(fmt(p.getGrossPay())).append(" EGP</span></div>")
         .append("</div>");

        // DEDUCTIONS
        h.append("<div>")
         .append("<div class='col-head ded-head'>✖ الخصومات / Deductions</div>")
         .append(dedRow("تأخير / Late Penalty",              p.getDeductions().getLateDeduction()))
         .append(dedRow("انصراف مبكر / Leave Early",        p.getDeductions().getLeaveEarlyDeduction()))
         .append(dedRow("غياب / Absence",                   p.getDeductions().getAbsenceDeduction()))
         .append(dedRow("تأمين اجتماعي 11% / SI",          p.getDeductions().getSocialInsurance()))
         .append(dedRow("ضريبة الدخل / Income Tax",        p.getDeductions().getIncomeTax()))
         .append(dedRow("صندوق الشهداء 0.05% / Martyrs",   p.getDeductions().getMartysFundDeduction()))
         .append(dedRow("قرض / Loan",                       p.getDeductions().getLoanDeduction()))
         .append(dedRow("جزاءات تأديبية / Disciplinary",   p.getDeductions().getPenalties()))
         .append("<div class='col-total ded-total'><span>إجمالي الخصومات / Total Deductions</span>")
         .append("<span>").append(fmt(p.getTotalDeductions())).append(" EGP</span></div>")
         .append("</div>");

        h.append("</div>"); // two-col

        // ── Leave Quota Summary (SAP Infotype 2006) ──────────────────────────────
        if (p.getLeaveQuota() != null) {
            PaySlipResponse.LeaveQuota lq = p.getLeaveQuota();
            boolean lowBalance = lq.getCurrentBalance() <= 5;
            h.append("<div class='leave-section'>")
             .append("<div class='leave-title'>")
             .append("&#x1F4C5; &#x645;&#x644;&#x62E;&#x635; &#x627;&#x644;&#x625;&#x62C;&#x627;&#x632;&#x627;&#x62A; / Leave Quota Summary")
             .append("</div>")
             .append("<div class='leave-grid'>")
             .append("<div class='leave-card'>")
             .append("<div class='lc-label'>&#x627;&#x644;&#x631;&#x635;&#x64A;&#x62F; &#x627;&#x644;&#x643;&#x644;&#x64A; / Entitlement</div>")
             .append("<div class='lc-value'>").append(lq.getEntitlement()).append("</div>")
             .append("<div class='lc-sub'>&#x64A;&#x648;&#x645; &#x633;&#x646;&#x648;&#x64A;&#x627;&#x8B</div>")
             .append("</div>")
             .append("<div class='leave-card'>")
             .append("<div class='lc-label'>&#x623;&#x64A;&#x627;&#x645; &#x645;&#x633;&#x62A;&#x647;&#x644;&#x643;&#x629; / Days Taken</div>")
             .append("<div class='lc-value'>").append(lq.getDaysTaken()).append("</div>")
             .append("<div class='lc-sub'>&#x645;&#x646;&#x630; &#x628;&#x62F;&#x627;&#x64A;&#x629; &#x627;&#x644;&#x633;&#x646;&#x629;</div>")
             .append("</div>")
             .append(lowBalance ? "<div class='leave-card lc-warn'>" : "<div class='leave-card'>")
             .append("<div class='lc-label'>&#x627;&#x644;&#x631;&#x635;&#x64A;&#x62F; &#x627;&#x644;&#x645;&#x62A;&#x628;&#x642;&#x64A; / Balance</div>")
             .append("<div class='lc-value'>").append(lq.getCurrentBalance()).append("</div>")
             .append("<div class='lc-sub'>")
             .append(lowBalance ? "&#x26A0; &#x631;&#x635;&#x64A;&#x62F; &#x645;&#x646;&#x62E;&#x641;&#x636;"
                                : "&#x2714; &#x645;&#x62A;&#x627;&#x62D;")
             .append("</div></div>")
             .append("</div></div>"); // leave-grid + leave-section
        }

        // ── Footer: Net Pay ──────────────────────────────────────────────────
        h.append("<div class='footer'>");

        // Status badges
        h.append("<div style='display:flex;flex-direction:column;gap:8px'>");
        if (p.isLocked()) {
            h.append("<span class='locked-badge'>🔒 LOCKED</span>");
        }
        h.append("<div style='font-size:11px;color:#888'>Generated: ").append(p.getGeneratedAt()).append("</div>");
        h.append("</div>");

        // Net alert or Net Pay box
        if (p.isNetAlert()) {
            h.append("<div class='alert-box'>")
             .append("⚠ تنبيه: الراتب الصافي كان سالباً وتم تصفيره<br/>")
             .append("Net pay was negative – floored at zero. HR review required.")
             .append("</div>");
        }

        h.append("<div class='net-box'>")
         .append("<div class='net-label'>صافي الراتب / NET PAY</div>")
         .append("<div class='net-value'>").append(fmt(p.getNetSalary())).append(" EGP</div>")
         .append("</div>");

        h.append("</div>"); // footer

        // ── Calculation Trace (hidden in print) ──────────────────────────────
        if (p.getCalculationTrace() != null && !p.getCalculationTrace().isBlank()) {
            h.append("<div class='trace-section'>")
             .append("<div class='trace-title'>Calculation Trace (HR Audit Log)</div>")
             .append("<div class='trace-box'>").append(escapeHtml(p.getCalculationTrace())).append("</div>")
             .append("</div>");
        }

        h.append("</div></body></html>");
        return h.toString();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private String infoItem(String label, String value) {
        return "<div class='info-item'><div class='lbl'>" + label + "</div><div class='val'>" + value + "</div></div>";
    }

    private String earnRow(String label, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) return "";
        return "<div class='row-item'><span class='desc'>" + label + "</span>"
                + "<span class='earn-amt'>" + fmt(amount) + "</span></div>";
    }

    private String dedRow(String label, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) return "";
        return "<div class='row-item'><span class='desc'>" + label + "</span>"
                + "<span class='ded-amt'>(" + fmt(amount) + ")</span></div>";
    }

    private String fmt(BigDecimal v) {
        if (v == null) return "0.00";
        return String.format("%,.2f", v.doubleValue());
    }

    private String escapeHtml(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
