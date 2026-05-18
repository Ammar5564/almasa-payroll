import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, Download, ClipboardList, RefreshCw } from 'lucide-react';
import { PageHeader, FormSection, ErrorAlert, LoadingSpinner } from '@/components/UI';
import { getAbsenceHistory, exportAbsenceHistoryXlsx } from '@/lib/api';

interface AbsenceRecord {
  employeeName: string;
  date: string;
  leaveType: string;
  deductionAmount: number;
  status: string;
}

const LEAVE_TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ANNUAL_LEAVE:      { label: 'إجازة سنوية',      color: 'hsl(142 76% 30%)', bg: 'hsl(142 76% 36% / 0.1)'  },
  WITH_PERMISSION:   { label: 'بإذن – مدفوعة',     color: 'hsl(142 76% 30%)', bg: 'hsl(142 76% 36% / 0.1)'  },
  UNEXCUSED_ABSENCE: { label: 'غياب بدون إذن',     color: 'hsl(0 84% 50%)',   bg: 'hsl(0 84% 60% / 0.1)'    },
  WITHOUT_PERMISSION:{ label: 'بدون إذن – قديم',   color: 'hsl(0 84% 50%)',   bg: 'hsl(0 84% 60% / 0.1)'    },
  MANUAL_DEDUCTION:  { label: 'خصم إداري',          color: 'hsl(43 96% 40%)',  bg: 'hsl(43 96% 56% / 0.12)'  },
};

const STATUS_COLORS: Record<string, string> = {
  'مدفوعة':      'hsl(142 76% 30%)',
  'غياب – خصم': 'hsl(0 84% 50%)',
  'خصم إداري':   'hsl(43 96% 40%)',
};

export default function AbsenceHistory() {
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [nameFilter, setNameFilter] = useState('');
  const [fromDate,   setFromDate]   = useState('');
  const [toDate,     setToDate]     = useState('');

  const labelClass = 'block text-xs font-medium font-cairo mb-1.5 text-muted-foreground';
  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-cairo focus:outline-none focus:ring-2 focus:ring-ring';

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAbsenceHistory(
        nameFilter.trim() || undefined,
        fromDate || undefined,
        toDate   || undefined,
      );
      const data = Array.isArray(res.data) ? res.data : [];
      // Sort newest first
      data.sort((a: AbsenceRecord, b: AbsenceRecord) =>
        new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecords(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل السجلات');
    } finally {
      setLoading(false);
    }
  };

  // Load all on mount
  useEffect(() => { fetchHistory(); }, []);

  const handleExportXlsx = async () => {
    try {
      const res = await exportAbsenceHistoryXlsx(
        nameFilter.trim() || undefined,
        fromDate || undefined,
        toDate   || undefined,
      );
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `absence_history_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('فشل تصدير الملف. حاول مرة أخرى.');
    }
  };

  const totalDeductions = records.reduce((s, r) => s + Number(r.deductionAmount ?? 0), 0);
  const paidCount    = records.filter(r => r.status === 'مدفوعة').length;
  const deductedCount= records.filter(r => r.status !== 'مدفوعة').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="سجل الإجازات والغيابات"
        subtitle="Manager Absence History — Infotype 2001"
      />

      {/* ── Filters ── */}
      <FormSection>
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
          <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
            فلاتر البحث / Search & Filter
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>بحث بالاسم / Search by Name</label>
            <div className="relative">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                className={inputClass + ' pr-9'}
                value={nameFilter}
                onChange={e => setNameFilter(e.target.value)}
                placeholder="اكتب اسم الموظف..."
                onKeyDown={e => e.key === 'Enter' && fetchHistory()}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>من تاريخ / From</label>
            <input type="date" className={inputClass} value={fromDate}
              onChange={e => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>إلى تاريخ / To</label>
            <input type="date" className={inputClass} value={toDate}
              onChange={e => setToDate(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button className="navy-btn flex items-center gap-2" onClick={fetchHistory} disabled={loading}>
            {loading ? <LoadingSpinner /> : <RefreshCw className="w-4 h-4" />}
            بحث / Search
          </button>
          <button className="gold-btn flex items-center gap-2 text-sm" onClick={() => {
            setNameFilter(''); setFromDate(''); setToDate('');
            setTimeout(fetchHistory, 0);
          }}>
            مسح الفلاتر
          </button>
          {records.length > 0 && (
            <button className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors font-cairo"
              onClick={handleExportXlsx}>
              <Download className="w-4 h-4" />
              تصدير Excel
            </button>
          )}
        </div>
      </FormSection>

      {/* ── Summary Stats ── */}
      {records.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'إجمالي السجلات', value: records.length, color: 'hsl(var(--navy))', bg: 'hsl(var(--navy) / 0.07)' },
            { label: 'إجازات مدفوعة', value: paidCount, color: 'hsl(142 76% 30%)', bg: 'hsl(142 76% 36% / 0.08)' },
            { label: 'إجمالي الخصومات', value: totalDeductions.toLocaleString('ar-EG', { minimumFractionDigits: 2 }) + ' ج.م', color: 'hsl(0 84% 50%)', bg: 'hsl(0 84% 60% / 0.07)' },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl p-4 text-center font-cairo" style={{ background: stat.bg }}>
              <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {error && <ErrorAlert message={error} />}

      {/* ── Records Table ── */}
      <FormSection>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
            <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
              سجلات الإجازات والغيابات
            </h3>
            {records.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: 'hsl(var(--navy) / 0.1)', color: 'hsl(var(--navy))' }}>
                {records.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-cairo">
              {fromDate && toDate ? `${fromDate} → ${toDate}` : 'جميع التواريخ'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-cairo">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>لا توجد سجلات مطابقة للفلاتر المحددة</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="font-cairo">#</th>
                  <th className="font-cairo">اسم الموظف</th>
                  <th className="font-cairo">التاريخ</th>
                  <th className="font-cairo">نوع الإجازة / Leave Type</th>
                  <th className="font-cairo">مبلغ الخصم</th>
                  <th className="font-cairo">الحالة / Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, i) => {
                  const typeInfo = LEAVE_TYPE_LABELS[rec.leaveType];
                  const statusColor = STATUS_COLORS[rec.status] ?? 'hsl(var(--navy))';
                  return (
                    <motion.tr key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.4) }}>
                      <td className="text-muted-foreground text-xs">{i + 1}</td>
                      <td className="font-cairo font-medium" style={{ color: 'hsl(var(--navy))' }}>
                        {rec.employeeName}
                      </td>
                      <td className="font-mono text-xs">{rec.date}</td>
                      <td>
                        {typeInfo ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-cairo font-medium"
                            style={{ color: typeInfo.color, background: typeInfo.bg }}>
                            {typeInfo.label}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{rec.leaveType}</span>
                        )}
                      </td>
                      <td className="font-mono text-sm font-semibold"
                        style={{ color: Number(rec.deductionAmount) > 0 ? 'hsl(0 84% 50%)' : 'hsl(142 76% 30%)' }}>
                        {Number(rec.deductionAmount) > 0
                          ? `(${Number(rec.deductionAmount).toFixed(2)}) ج.م`
                          : '—'}
                      </td>
                      <td>
                        <span className="px-2.5 py-1 rounded-full text-xs font-cairo font-semibold"
                          style={{
                            color: statusColor,
                            background: statusColor + '18',
                          }}>
                          {rec.status}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer totals */}
        {records.length > 0 && (
          <div className="mt-4 flex items-center justify-between px-2 py-3 rounded-lg border border-border bg-muted/30">
            <span className="text-sm font-cairo text-muted-foreground">
              إجمالي السجلات: <strong>{records.length}</strong> — مدفوعة: <strong>{paidCount}</strong> — غياب/خصم: <strong>{deductedCount}</strong>
            </span>
            <span className="text-sm font-cairo font-semibold" style={{ color: 'hsl(0 84% 50%)' }}>
              إجمالي الخصومات: {totalDeductions.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
            </span>
          </div>
        )}
      </FormSection>
    </div>
  );
}
