import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/UI';
import { getAuditLogs, type AuditLogEntry, type AuditLogPage } from '@/lib/api';

function formatInstant(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'medium' });
  } catch {
    return iso;
  }
}

export default function AuditLogs() {
  const [page, setPage] = useState<AuditLogPage | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [action, setAction] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  async function fetchLogs() {
    setLoading(true);
    setError('');
    try {
      const res = await getAuditLogs({
        page: 0,
        size: 50,
        username: username.trim() || undefined,
        action: action.trim() || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setPage(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'تعذر تحميل السجل');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getAuditLogs({ page: 0, size: 50 });
        if (!cancelled) setPage(res.data);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'تعذر تحميل السجل');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows: AuditLogEntry[] = page?.content ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="سجل التدقيق"
        subtitle="من نفّذ أي إجراء ومتى — تصفية بالمستخدم والتاريخ والإجراء"
      />

      <div className="form-section grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-xs font-medium font-cairo mb-1 text-muted-foreground">المستخدم</label>
          <input
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm font-cairo"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="اسم الدخول"
          />
        </div>
        <div>
          <label className="block text-xs font-medium font-cairo mb-1 text-muted-foreground">الإجراء</label>
          <input
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono text-xs"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="ATTENDANCE_REGISTERED"
          />
        </div>
        <div>
          <label className="block text-xs font-medium font-cairo mb-1 text-muted-foreground">من تاريخ</label>
          <input
            type="date"
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium font-cairo mb-1 text-muted-foreground">إلى تاريخ</label>
          <input
            type="date"
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <button type="button" className="navy-btn h-10" onClick={() => fetchLogs()} disabled={loading}>
          {loading ? 'جاري التحميل...' : 'تحديث'}
        </button>
      </div>

      {loading && <p className="text-sm text-muted-foreground font-cairo">جاري التحميل...</p>}
      {error && (
        <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm font-cairo">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="form-section overflow-x-auto">
          <table className="data-table min-w-[960px]">
            <thead>
              <tr>
                <th className="font-cairo">متى</th>
                <th className="font-cairo">المستخدم</th>
                <th className="font-cairo">الوحدة</th>
                <th className="font-cairo">الإجراء</th>
                <th className="font-cairo">المورد</th>
                <th className="font-cairo">التفاصيل</th>
                <th className="font-cairo">قبل</th>
                <th className="font-cairo">بعد</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted-foreground font-cairo py-8">
                    لا توجد أحداث مطابقة
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs whitespace-nowrap">{formatInstant(r.occurredAt)}</td>
                    <td className="font-cairo text-sm">{r.username}</td>
                    <td className="font-mono text-xs">{r.moduleName ?? '—'}</td>
                    <td className="font-mono text-xs">{r.action}</td>
                    <td className="text-sm font-cairo">
                      <span className="text-muted-foreground">{r.resourceType}</span>
                      {r.resourceId ? (
                        <>
                          <br />
                          <span className="font-mono text-xs">{r.resourceId}</span>
                        </>
                      ) : null}
                    </td>
                    <td className="text-xs text-muted-foreground max-w-[140px] truncate" title={r.details ?? ''}>
                      {r.details ?? '—'}
                    </td>
                    <td className="text-xs font-mono max-w-[160px] truncate" title={r.valuesBefore ?? ''}>
                      {r.valuesBefore ?? '—'}
                    </td>
                    <td className="text-xs font-mono max-w-[160px] truncate" title={r.valuesAfter ?? ''}>
                      {r.valuesAfter ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {page != null && page.totalElements != null ? (
            <p className="text-xs text-muted-foreground font-cairo mt-2">
              إجمالي السجلات المطابقة: {page.totalElements}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
