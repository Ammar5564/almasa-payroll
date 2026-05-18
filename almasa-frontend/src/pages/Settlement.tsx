import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, User, Calendar, AlertTriangle,
  CheckCircle, Printer, ChevronRight, Briefcase,
  TrendingDown, TrendingUp, Scale
} from 'lucide-react';
import { PageHeader, FormSection, ErrorAlert, LoadingSpinner } from '@/components/UI';
import { getEmployees, previewSettlement, confirmSettlement, exportSettlementHtml } from '@/lib/api';
import { EmployeeOptionGroups, type EmployeeForSelect } from '@/components/EmployeeOptionGroups';

// ── Types ──────────────────────────────────────────────────────────────────────
interface SettlementData {
  documentNumber: string;
  settlementDate: string;
  confirmed: boolean;
  employeeName: string;
  employeeCode: string;
  jobTitle: string;
  departmentName: string;
  branchName: string;
  hireDate: string;
  terminationDate: string;
  yearsOfService: number;
  monthsOfService: number;
  baseSalary: number;
  dailyRate: number;
  daysWorked: number;
  proratedSalary: number;
  vacationDaysRemaining: number;
  vacationPayout: number;
  settlementGross: number;
  socialInsurance: number;
  incomeTax: number;
  martyrsFund: number;
  loanBalance: number;
  totalDeductions: number;
  netSettlement: number;
  netAlert: boolean;
  loansClosedCount: number;
  message: string;
}

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtEgp = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

// ── Line item component ───────────────────────────────────────────────────────
function DocLine({
  label, sublabel, amount, type, highlight = false,
}: {
  label: string; sublabel?: string; amount: number; type: 'earn' | 'ded' | 'total';
  highlight?: boolean;
}) {
  const isEarn = type === 'earn';
  const isTotal = type === 'total';
  const color   = isEarn ? 'hsl(142 76% 30%)' : 'hsl(0 84% 50%)';
  const sign    = isEarn ? '+' : '(';
  const close   = isEarn ? '' : ')';

  return (
    <div
      className={`flex items-center justify-between py-2.5 border-b border-dashed font-cairo ${isTotal ? 'border-t-2 border-b-0 pt-3 mt-2 font-bold text-sm' : 'text-sm'}`}
      style={{
        borderColor: isTotal ? color : undefined,
        background: highlight ? `${color}08` : undefined,
      }}>
      <div>
        <span style={{ color: isTotal ? color : 'hsl(var(--foreground))' }}>{label}</span>
        {sublabel && <span className="block text-xs text-muted-foreground mt-0.5">{sublabel}</span>}
      </div>
      <span className="font-mono font-semibold text-sm tabular-nums" style={{ color }}>
        {sign}{fmtEgp(amount)}{close} ج.م
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Settlement() {
  const [employees, setEmployees] = useState<EmployeeForSelect[]>([]);
  const [form, setForm] = useState({ employeeName: '', terminationDate: '' });
  const [preview, setPreview] = useState<SettlementData | null>(null);
  const [confirmed, setConfirmed] = useState<SettlementData | null>(null);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [printLoading, setPrintLoading]     = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const inputClass  = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-cairo focus:outline-none focus:ring-2 focus:ring-ring';
  const labelClass  = 'block text-xs font-medium font-cairo mb-1.5 text-muted-foreground';

  useEffect(() => {
    getEmployees().then(res => {
      const data = Array.isArray(res.data) ? res.data : [];
      setEmployees(data);
    }).catch(() => {});
  }, []);

  const activeEmployees = employees.filter(e => !e.status || e.status === 'ACTIVE');

  const handlePreview = async () => {
    if (!form.employeeName || !form.terminationDate) {
      setError('يرجى اختيار الموظف وتحديد تاريخ الإنهاء.');
      return;
    }
    setError(''); setPreview(null);
    setPreviewLoading(true);
    try {
      const res = await previewSettlement(form);
      setPreview(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في الحساب');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    setError(''); setSuccess('');
    setConfirmLoading(true);
    try {
      const res = await confirmSettlement(form);
      setConfirmed(res.data);
      setPreview(null);
      setSuccess(res.data.message || 'تم تأكيد التسوية بنجاح.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في التأكيد');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handlePrint = async (data: SettlementData) => {
    setPrintLoading(true);
    try {
      const res = await exportSettlementHtml(data);
      const win = window.open('', '_blank');
      if (win) { win.document.write(res.data); win.document.close(); win.print(); }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل التصدير');
    } finally {
      setPrintLoading(false);
    }
  };

  const activeData = confirmed ?? preview;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="تسوية نهاية الخدمة"
        subtitle="End-of-Service Full & Final Settlement"
      />

      {/* ── Input Form ── */}
      <FormSection>
        <div className="flex items-center gap-2 mb-5">
          <Scale className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
          <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
            بيانات الإنهاء / Termination Details
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>اختر الموظف / Select Employee <span className="text-destructive">*</span></label>
            <select className={inputClass} value={form.employeeName}
              onChange={e => { setForm(p => ({ ...p, employeeName: e.target.value })); setPreview(null); setConfirmed(null); }}
              disabled={!!confirmed}>
              <option value="">-- اختر الموظف --</option>
              <EmployeeOptionGroups employees={activeEmployees} includeInactive={false} />
            </select>
            {employees.find(e => e.name === form.employeeName)?.status === 'TERMINATED' && (
              <p className="text-xs mt-1 font-cairo" style={{ color: 'hsl(0 84% 50%)' }}>
                ⚠ هذا الموظف تم إنهاء خدمته مسبقاً
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>تاريخ الإنهاء / Termination Date <span className="text-destructive">*</span></label>
            <input type="date" className={inputClass} value={form.terminationDate}
              onChange={e => { setForm(p => ({ ...p, terminationDate: e.target.value })); setPreview(null); setConfirmed(null); }}
              disabled={!!confirmed} />
            <p className="text-xs text-muted-foreground font-cairo mt-1">
              آخر يوم عمل فعلي — يُحدد عدد أيام الراتب النسبي
            </p>
          </div>
        </div>

        {error && <ErrorAlert message={error} />}

        {!confirmed && (
          <button className="navy-btn mt-4 flex items-center gap-2" onClick={handlePreview}
            disabled={previewLoading || !form.employeeName || !form.terminationDate}>
            {previewLoading ? <LoadingSpinner /> : <FileText className="w-4 h-4" />}
            احتساب التسوية / Calculate Settlement
          </button>
        )}
      </FormSection>

      {/* ── Settlement Document ── */}
      <AnimatePresence>
        {activeData && (
          <motion.div
            key="settlement-doc"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}>

            {/* ── Document Header ── */}
            <div className="rounded-t-2xl overflow-hidden shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7b0c2b 0%, #b01040 100%)' }}>
              <div className="flex justify-between items-center px-8 py-6">
                <div>
                  <p className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-1">
                    شركة الماسه — Al-Masa Company
                  </p>
                  <h2 className="text-white font-bold text-xl font-cairo">
                    وثيقة تسوية نهاية الخدمة
                  </h2>
                  <p className="text-white/70 text-sm mt-0.5">
                    Full &amp; Final Settlement Statement
                  </p>
                </div>
                <div className="text-center bg-white/15 rounded-xl px-5 py-3">
                  <p className="text-white font-mono font-bold text-sm tracking-wider">
                    {activeData.documentNumber}
                  </p>
                  <p className="text-white/60 text-xs mt-1">رقم المستند</p>
                </div>
              </div>

              {/* Status ribbon */}
              <div className={`px-8 py-2 text-xs font-bold font-cairo tracking-wide flex items-center gap-2 ${
                activeData.confirmed
                  ? 'bg-green-800/60 text-green-100'
                  : 'bg-amber-800/60 text-amber-100'
              }`}>
                {activeData.confirmed
                  ? <><CheckCircle className="w-3.5 h-3.5" /> مُؤكَّد ونهائي — CONFIRMED &amp; FINAL — {fmtDate(activeData.settlementDate)}</>
                  : <><AlertTriangle className="w-3.5 h-3.5" /> معاينة فقط — PREVIEW (Not Yet Confirmed)</>}
              </div>
            </div>

            {/* ── Employee Info Grid ── */}
            <div className="border border-t-0 border-border rounded-b-none p-6 grid grid-cols-2 md:grid-cols-3 gap-3"
              style={{ background: 'hsl(350 40% 98%)' }}>
              {[
                { lbl: 'الموظف / Employee', val: activeData.employeeName },
                { lbl: 'الكود / Code',      val: activeData.employeeCode ?? '—' },
                { lbl: 'المسمى / Title',    val: activeData.jobTitle },
                { lbl: 'القسم / Dept',      val: activeData.departmentName ?? '—' },
                { lbl: 'تاريخ التعيين / Hire', val: fmtDate(activeData.hireDate) },
                { lbl: 'آخر يوم / Last Day',   val: fmtDate(activeData.terminationDate) },
                { lbl: 'مدة الخدمة / Service', val: `${activeData.yearsOfService} سنة ${activeData.monthsOfService % 12} شهر` },
                { lbl: 'الراتب الأساسي / Basic', val: fmtEgp(activeData.baseSalary) + ' ج.م' },
                { lbl: 'المعدل اليومي / Daily',  val: fmtEgp(activeData.dailyRate) + ' ج.م' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground font-cairo mb-0.5">{item.lbl}</p>
                  <p className="text-sm font-semibold font-cairo" style={{ color: 'hsl(var(--navy))' }}>{item.val}</p>
                </div>
              ))}
            </div>

            {/* ── Two Column Body ── */}
            <div className="border border-t-0 border-border grid md:grid-cols-2 divide-x divide-x-reverse divide-border">

              {/* EARNINGS */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4" style={{ color: 'hsl(142 76% 36%)' }} />
                  <h4 className="font-cairo font-bold text-sm" style={{ color: 'hsl(142 76% 30%)' }}>
                    (+) المستحقات / Earnings
                  </h4>
                </div>
                <DocLine
                  label="الراتب النسبي / Pro-rated Salary"
                  sublabel={`${fmtEgp(activeData.baseSalary)} ج.م ÷ 30 × ${activeData.daysWorked} أيام`}
                  amount={activeData.proratedSalary}
                  type="earn" />
                <DocLine
                  label="تعويض الإجازات / Vacation Payout"
                  sublabel={`${activeData.vacationDaysRemaining} يوم × ${fmtEgp(activeData.dailyRate)} ج.م/يوم`}
                  amount={activeData.vacationPayout}
                  type="earn" />
                <DocLine
                  label="إجمالي المستحقات / Settlement Gross"
                  amount={activeData.settlementGross}
                  type="total"
                  highlight />
              </div>

              {/* DEDUCTIONS */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-4 h-4" style={{ color: 'hsl(0 84% 50%)' }} />
                  <h4 className="font-cairo font-bold text-sm" style={{ color: 'hsl(0 84% 50%)' }}>
                    (-) الخصومات / Deductions
                  </h4>
                </div>
                {activeData.socialInsurance > 0 && (
                  <DocLine label="تأمين اجتماعي 11% / Social Insurance"
                    sublabel="على الوعاء الصافي" amount={activeData.socialInsurance} type="ded" />
                )}
                {activeData.incomeTax > 0 && (
                  <DocLine label="ضريبة دخل / Income Tax"
                    sublabel="شرائح ضريبة مصرية" amount={activeData.incomeTax} type="ded" />
                )}
                {activeData.martyrsFund > 0 && (
                  <DocLine label="صندوق الشهداء 0.05% / Martyrs' Fund"
                    sublabel="" amount={activeData.martyrsFund} type="ded" />
                )}
                {activeData.loanBalance > 0 && (
                  <DocLine label="استرداد القروض / Loan Recovery"
                    sublabel="إجمالي الأرصدة المتبقية" amount={activeData.loanBalance} type="ded"
                    highlight />
                )}
                {activeData.totalDeductions === 0 && (
                  <p className="text-sm text-muted-foreground font-cairo py-4 text-center">
                    لا توجد خصومات
                  </p>
                )}
                <DocLine label="إجمالي الخصومات / Total Deductions"
                  amount={activeData.totalDeductions} type="total" highlight />
              </div>
            </div>

            {/* ── Net Alert ── */}
            {activeData.netAlert && (
              <div className="border border-x border-border mx-0 px-6 py-3 flex items-center gap-3"
                style={{ background: 'hsl(38 92% 95%)' }}>
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-sm font-cairo text-amber-800">
                  تنبيه: صافي التسوية المحسوب كان سالباً وتم تصفيره. يرجى مراجعة القروض أو الخصومات مع الموظف.
                </p>
              </div>
            )}

            {/* ── Net Settlement ── */}
            <div className="border border-t-0 border-b border-border rounded-b-2xl overflow-hidden">
              <div className="flex items-center justify-between px-8 py-5"
                style={{ background: 'linear-gradient(135deg, #7b0c2b, #b01040)' }}>
                <div>
                  <p className="text-white/70 text-xs font-cairo tracking-widest uppercase mb-1">
                    (=) صافي مبلغ التسوية / NET SETTLEMENT AMOUNT
                  </p>
                  <p className="text-white/50 text-xs font-cairo">{activeData.documentNumber} — {fmtDate(activeData.settlementDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-3xl font-mono tabular-nums">
                    {fmtEgp(activeData.netSettlement)}
                  </p>
                  <p className="text-white/60 text-sm mt-1">جنيه مصري</p>
                </div>
              </div>

              {/* Signature line */}
              <div className="grid grid-cols-2 gap-8 px-8 py-6 bg-white">
                <div className="text-center">
                  <div className="border-t border-dashed border-border pt-3">
                    <p className="text-xs font-cairo text-muted-foreground">توقيع الموظف / Employee Signature</p>
                    <p className="text-sm font-cairo font-semibold mt-1" style={{ color: 'hsl(var(--navy))' }}>
                      {activeData.employeeName}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-dashed border-border pt-3">
                    <p className="text-xs font-cairo text-muted-foreground">مدير الموارد البشرية / HR Manager</p>
                    <p className="text-sm font-cairo font-semibold mt-1" style={{ color: 'hsl(var(--navy))' }}>
                      أ/ ياسر بشير
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Actions ── */}
            {!activeData.confirmed && (
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-cairo font-bold text-sm transition-all text-white shadow-lg hover:shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #7b0c2b, #b01040)' }}
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={confirmLoading}>
                  {confirmLoading ? <LoadingSpinner /> : <CheckCircle className="w-4 h-4" />}
                  تأكيد التسوية — Confirm Settlement
                </button>
                <button
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-cairo hover:bg-muted/40 transition-colors"
                  onClick={() => handlePrint(activeData)}
                  disabled={printLoading}>
                  {printLoading ? <LoadingSpinner /> : <Printer className="w-4 h-4" />}
                  طباعة / Print
                </button>
              </div>
            )}

            {activeData.confirmed && (
              <div className="mt-4 flex gap-3">
                <div className="flex-1 p-4 rounded-xl border-2 border-green-300 bg-green-50 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                  <div>
                    <p className="font-cairo font-bold text-sm text-green-800">تم إتمام التسوية بنجاح</p>
                    <p className="font-cairo text-xs text-green-600 mt-0.5">{activeData.message}</p>
                    {activeData.loansClosedCount > 0 && (
                      <p className="font-cairo text-xs text-green-600">
                        تم إغلاق {activeData.loansClosedCount} قرض/قروض تلقائياً
                      </p>
                    )}
                  </div>
                </div>
                <button
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-cairo hover:bg-muted/40 transition-colors"
                  onClick={() => handlePrint(activeData)}
                  disabled={printLoading}>
                  {printLoading ? <LoadingSpinner /> : <Printer className="w-4 h-4" />}
                  طباعة / Print
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirm Dialog ── */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'hsl(0 84% 96%)' }}>
                  <AlertTriangle className="w-6 h-6" style={{ color: 'hsl(0 84% 50%)' }} />
                </div>
                <div>
                  <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
                    تأكيد إنهاء الخدمة
                  </h3>
                  <p className="text-xs text-muted-foreground font-cairo">Confirm End of Service</p>
                </div>
              </div>

              <div className="rounded-xl p-4 mb-5 space-y-2"
                style={{ background: 'hsl(0 84% 98%)', border: '1px solid hsl(0 84% 88%)' }}>
                <p className="font-cairo text-sm font-semibold" style={{ color: 'hsl(0 84% 40%)' }}>
                  ⚠ هذا الإجراء لا يمكن التراجع عنه
                </p>
                <ul className="font-cairo text-xs space-y-1" style={{ color: 'hsl(0 84% 45%)' }}>
                  <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> سيتم تغيير حالة الموظف إلى "مُنهى الخدمة"</li>
                  <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> سيتم إغلاق جميع القروض النشطة</li>
                  <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> سيتم تصفير رصيد الإجازة السنوية</li>
                </ul>
              </div>

              {preview && (
                <div className="rounded-xl p-4 mb-5 text-center"
                  style={{ background: 'hsl(142 76% 97%)', border: '1px solid hsl(142 76% 80%)' }}>
                  <p className="font-cairo text-xs text-muted-foreground mb-1">صافي مبلغ التسوية</p>
                  <p className="font-bold text-2xl font-cairo" style={{ color: 'hsl(142 76% 30%)' }}>
                    {fmtEgp(preview.netSettlement)} ج.م
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  className="flex-1 py-3 rounded-xl font-cairo font-bold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #7b0c2b, #b01040)' }}
                  onClick={handleConfirm}>
                  نعم، تأكيد التسوية
                </button>
                <button
                  className="px-6 py-3 rounded-xl border border-border font-cairo text-sm hover:bg-muted/40 transition-colors"
                  onClick={() => setShowConfirmDialog(false)}>
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Employee Status Overview (terminated employees) ── */}
      {employees.some(e => e.status === 'TERMINATED') && (
        <FormSection>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
            <h3 className="font-cairo font-bold text-sm" style={{ color: 'hsl(var(--navy))' }}>
              الموظفون المُنهى خدمتهم / Terminated Employees
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {employees.filter(e => e.status === 'TERMINATED').map((emp, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-xs font-cairo"
                style={{ background: 'hsl(0 84% 96%)', color: 'hsl(0 84% 45%)', border: '1px solid hsl(0 84% 85%)' }}>
                {emp.name}
              </span>
            ))}
          </div>
        </FormSection>
      )}

      {success && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-4 rounded-xl flex items-center gap-3"
          style={{ background: 'hsl(142 76% 97%)', border: '1px solid hsl(142 76% 70%)' }}>
          <CheckCircle className="w-5 h-5 shrink-0" style={{ color: 'hsl(142 76% 36%)' }} />
          <p className="font-cairo text-sm" style={{ color: 'hsl(142 76% 30%)' }}>{success}</p>
        </motion.div>
      )}
    </div>
  );
}
