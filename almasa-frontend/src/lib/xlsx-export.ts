/**
 * Client-side XLSX export utilities — SheetJS (xlsx).
 * All column headers and labels are in Arabic (UTF-8 inherent in XLSX).
 */
import * as XLSX from 'xlsx';

// ── Layout constants ──────────────────────────────────────────────────────────
const COL = {
  LABEL:  28,
  VALUE:  24,
  CODE:   12,
  NAME:   22,
  TITLE:  20,
  DATE:   14,
  NUM:    13,
  AMOUNT: 15,
  REASON: 35,
  TINY:    5,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function setRTL(ws: XLSX.WorkSheet) {
  ws['!views'] = [{ rightToLeft: true }];
}

function mergeRow(row: number, fromCol: number, toCol: number): XLSX.Range {
  return { s: { r: row, c: fromCol }, e: { r: row, c: toCol } };
}

/**
 * Appends a table sheet to the workbook.
 * Row 0  → sheet title (merged across all columns)
 * Row 1  → column headers
 * Row 2+ → data rows
 */
function appendTableSheet(
  wb: XLSX.WorkBook,
  sheetName: string,
  records: Record<string, unknown>[],
  titleLabel: string,
  colWidths?: number[],
) {
  const safe = sheetName.length > 31 ? sheetName.slice(0, 31) : sheetName;

  if (!records.length) {
    const ws = XLSX.utils.aoa_to_sheet([[titleLabel], ['لا توجد بيانات في هذه الفترة']]);
    setRTL(ws);
    XLSX.utils.book_append_sheet(wb, ws, safe);
    return;
  }

  const headers = Object.keys(records[0]);
  const dataRows = records.map(r =>
    headers.map(h => {
      const v = r[h];
      return (v === null || v === undefined) ? '' : v;
    }),
  );

  const wsData: unknown[][] = [[titleLabel], headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  if (headers.length > 1) {
    ws['!merges'] = [mergeRow(0, 0, headers.length - 1)];
  }

  ws['!cols'] = colWidths
    ? colWidths.map(wch => ({ wch }))
    : headers.map(h => ({ wch: Math.max(12, Math.min(38, h.length * 2.2 + 2)) }));

  setRTL(ws);
  XLSX.utils.book_append_sheet(wb, ws, safe);
}

// ── Employee Report ───────────────────────────────────────────────────────────
export interface EmployeeReportParams {
  employeeName: string;
  fromDate: string;
  toDate: string;
}

export function exportEmployeeReport(data: Record<string, unknown>, params: EmployeeReportParams) {
  const wb = XLSX.utils.book_new();
  const period = `الفترة: ${params.fromDate}  ←  ${params.toDate}`;

  // Sheet 1: Employee profile + period summary
  const empInfo = (data.employeeInfo ?? {}) as Record<string, unknown>;
  const summary = (data.summary     ?? {}) as Record<string, unknown>;

  const infoRows: unknown[][] = [
    [`تقرير موظف: ${params.employeeName}`],
    [period],
    [],
    ['بيانات الموظف الأساسية', ''],
    ...Object.entries(empInfo).map(([k, v]) => [k, v ?? '-']),
    [],
    ['ملخص الفترة', ''],
    ...Object.entries(summary).map(([k, v]) => [k, v ?? '-']),
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(infoRows);
  const summaryHeaderRow = 4 + Object.keys(empInfo).length + 1;
  ws1['!merges'] = [
    mergeRow(0, 0, 1),
    mergeRow(1, 0, 1),
    mergeRow(3, 0, 1),
    mergeRow(summaryHeaderRow, 0, 1),
  ];
  ws1['!cols'] = [{ wch: COL.LABEL }, { wch: COL.VALUE }];
  setRTL(ws1);
  XLSX.utils.book_append_sheet(wb, ws1, 'بيانات الموظف');

  appendTableSheet(wb, 'سجلات الحضور',
    (data.attendanceRecords ?? []) as Record<string, unknown>[],
    period, [COL.DATE, COL.NUM, COL.NUM, COL.NUM, COL.NUM]);

  appendTableSheet(wb, 'الغيابات',
    (data.absenceRecords ?? []) as Record<string, unknown>[],
    period, [COL.DATE, COL.TITLE]);

  appendTableSheet(wb, 'الرواتب',
    (data.payrollRecords ?? []) as Record<string, unknown>[],
    period, [COL.DATE, COL.NUM, COL.AMOUNT, COL.AMOUNT, COL.AMOUNT,
             COL.AMOUNT, COL.AMOUNT, COL.AMOUNT, COL.AMOUNT,
             COL.AMOUNT, COL.AMOUNT, COL.AMOUNT, COL.AMOUNT]);

  appendTableSheet(wb, 'القروض',
    (data.loans ?? []) as Record<string, unknown>[],
    period, [COL.TITLE, COL.AMOUNT, COL.AMOUNT, COL.AMOUNT, COL.DATE, COL.DATE, COL.NUM]);

  appendTableSheet(wb, 'الإجراءات التأديبية',
    (data.disciplinaryActions ?? []) as Record<string, unknown>[],
    period, [COL.DATE, COL.AMOUNT, COL.REASON, COL.DATE]);

  const filename = `تقرير_موظف_${params.employeeName}_${params.fromDate}_${params.toDate}.xlsx`;
  XLSX.writeFile(wb, filename, { bookType: 'xlsx', type: 'binary' });
}

// ── Department Report ─────────────────────────────────────────────────────────
export interface DeptReportParams {
  departmentName: string;
  fromDate: string;
  toDate: string;
}

export function exportDepartmentReport(data: Record<string, unknown>, params: DeptReportParams) {
  const wb      = XLSX.utils.book_new();
  const period  = `الفترة: ${params.fromDate}  ←  ${params.toDate}`;
  const summary = (data.summary ?? {}) as Record<string, unknown>;
  const details = (data.details ?? []) as Record<string, unknown>[];

  const NUM_COLS = 11;
  const headers  = [
    'م', 'كود الموظف', 'الاسم', 'الوظيفة',
    'الراتب الأساسي', 'أيام الغياب', 'دقائق التأخير',
    'التأمين الاجتماعي', 'إجمالي القروض', 'رصيد القروض', 'الراتب النهائي',
  ];

  let totBase = 0, totAbsent = 0, totLate = 0, totLoans = 0, totLoansRem = 0, totFinal = 0;

  const dataRows: unknown[][] = details.map((emp, i) => {
    const base   = Number(emp.baseSalary            ?? 0);
    const absent = Number(emp.totalAbsenceDays      ?? 0);
    const late   = Number(emp.totalLateMinutes      ?? 0);
    const loans  = Number(emp.totalLoansAmount      ?? 0);
    const loansR = Number(emp.loansRemainingBalance ?? 0);
    const final_ = Number(emp.finalSalary           ?? 0);
    totBase += base; totAbsent += absent; totLate += late;
    totLoans += loans; totLoansRem += loansR; totFinal += final_;
    return [i + 1, emp.employeeCode ?? '-', emp.name ?? '-', emp.jobTitle ?? '-',
            base, absent, late, emp.hasSocialInsurance ?? '-',
            loans, loansR, final_];
  });

  const totalsRow: unknown[] = [
    'الإجمالي', '', '', '',
    totBase, totAbsent, totLate, '',
    totLoans, totLoansRem, totFinal,
  ];

  const statsLine =
    `عدد الموظفين: ${summary.totalEmployees ?? 0}  |  ` +
    `إجمالي الرواتب: ${Number(summary.totalPayrollCost ?? 0).toLocaleString('ar-EG')}  |  ` +
    `إجمالي الغياب: ${summary.totalAbsenceDays ?? 0} يوم`;

  const wsData: unknown[][] = [
    [`تقرير قسم: ${params.departmentName}`],
    [period],
    [statsLine],
    [],
    headers,
    ...dataRows,
    totalsRow,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const lastRow = wsData.length - 1;
  ws['!merges'] = [
    mergeRow(0, 0, NUM_COLS - 1),
    mergeRow(1, 0, NUM_COLS - 1),
    mergeRow(2, 0, NUM_COLS - 1),
    mergeRow(lastRow, 0, 3),
  ];
  ws['!cols'] = [
    { wch: COL.TINY }, { wch: COL.CODE }, { wch: COL.NAME }, { wch: COL.TITLE },
    { wch: COL.AMOUNT }, { wch: COL.NUM }, { wch: COL.NUM }, { wch: COL.TITLE },
    { wch: COL.AMOUNT }, { wch: COL.AMOUNT }, { wch: COL.AMOUNT },
  ];
  setRTL(ws);
  XLSX.utils.book_append_sheet(wb, ws, 'تقرير القسم');

  const filename = `تقرير_قسم_${params.departmentName}_${params.fromDate}_${params.toDate}.xlsx`;
  XLSX.writeFile(wb, filename, { bookType: 'xlsx', type: 'binary' });
}

// ── Pay Stub — قسيمة الراتب ───────────────────────────────────────────────────
export interface PayStubData {
  employeeName:         string;
  employeeCode?:        string;
  jobTitle?:            string;
  departmentName?:      string;
  branchName?:          string;
  month:                string;
  baseSalary:           number;
  overtimePay:          number;
  bonus:                number;
  grossPay:             number;
  lateDeduction:        number;
  leaveEarlyDeduction:  number;
  absenceDeduction:     number;
  socialInsurance:      number;
  incomeTax:            number;
  loanDeduction:        number;
  penalties:            number;
  martyrsFundDeduction: number;
  totalAdditions:       number;
  totalDeductions:      number;
  netSalary:            number;
  vacationBalance:      number;
  generatedAt:          string;
}

export function exportPayStub(d: PayStubData) {
  const wb  = XLSX.utils.book_new();
  const n   = (v: number) => v || 0;
  const SEP = '─────────────────────────────────────────';

  const rows: unknown[][] = [
    // ── Header ────────────────────────────────────────────────────
    ['شركة الماسة',                  '',   '',             ''],
    [`قسيمة راتب — ${d.month}`,      '',   '',             ''],
    [SEP,                            '',   '',             ''],
    // ── Employee info ─────────────────────────────────────────────
    ['الموظف',      d.employeeName,           'الوظيفة',   d.jobTitle       ?? '—'],
    ['كود الموظف',  d.employeeCode ?? '—',    'القسم',     d.departmentName ?? '—'],
    ['الموقع',      d.branchName   ?? 'المكتب الرئيسي', 'تاريخ الإصدار', d.generatedAt],
    [SEP,                            '',   '',             ''],
    // ── Table headers ─────────────────────────────────────────────
    ['الإضافات',               'المبلغ (جنيه)', 'الخصومات',                    'المبلغ (جنيه)'],
    // ── Earnings vs Deductions ────────────────────────────────────
    ['الراتب الأساسي',         n(d.baseSalary),  'خصم التأخير',                  n(d.lateDeduction)],
    ['بدل إضافي',               n(d.overtimePay), 'خصم الانصراف المبكر',          n(d.leaveEarlyDeduction)],
    ['مكافأة',                  n(d.bonus),       'خصم الغياب',                   n(d.absenceDeduction)],
    ['',                        '',               'التأمينات الاجتماعية (11%)',    n(d.socialInsurance)],
    ['',                        '',               'كسب العمل / الضرائب',           n(d.incomeTax)],
    ['',                        '',               'قسط القرض',                    n(d.loanDeduction)],
    ['',                        '',               'الجزاءات التأديبية',            n(d.penalties)],
    ['',                        '',               'صندوق الشهداء (0.05%)',         n(d.martyrsFundDeduction)],
    // ── Totals ────────────────────────────────────────────────────
    ['إجمالي الإضافات',        n(d.totalAdditions), 'إجمالي الخصومات',           n(d.totalDeductions)],
    [SEP,                      '',   '',             ''],
    // ── Net Salary ────────────────────────────────────────────────
    ['صافي الراتب النهائي',    n(d.netSalary), 'جنيه مصري', ''],
    [SEP,                      '',   '',             ''],
    // ── Footer ────────────────────────────────────────────────────
    ['رصيد الإجازات المتبقي',  `${d.vacationBalance} يوم`, '', ''],
    ['',                       '',   '',             ''],
    ['شركة الماسة — للاستفسار يُرجى التواصل مع قسم الموارد البشرية', '', '', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!merges'] = [
    mergeRow(0,  0, 3),  // شركة الماسة
    mergeRow(1,  0, 3),  // قسيمة راتب — month
    mergeRow(2,  0, 3),  // sep
    mergeRow(6,  0, 3),  // sep
    mergeRow(17, 0, 3),  // sep
    mergeRow(19, 0, 3),  // sep
    mergeRow(22, 0, 3),  // footer
  ];

  ws['!cols'] = [
    { wch: 26 },  // A — label (Arabic)
    { wch: 16 },  // B — amount / value
    { wch: 26 },  // C — label (Arabic)
    { wch: 16 },  // D — amount / value
  ];

  setRTL(ws);
  XLSX.utils.book_append_sheet(wb, ws, 'قسيمة الراتب');

  const safe = d.employeeName.replace(/\s+/g, '_');
  XLSX.writeFile(wb, `قسيمة_راتب_${safe}_${d.month}.xlsx`, { bookType: 'xlsx', type: 'binary' });
}
