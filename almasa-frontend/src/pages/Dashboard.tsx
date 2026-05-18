// import { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import {
//   Users, Building2, BarChart3, TrendingUp, Calendar, FileText,
//   Download, AlertCircle
// } from 'lucide-react';
// import StatCard from '@/components/StatCard';
// import { PageHeader, FormSection, ErrorAlert, LoadingSpinner } from '@/components/UI';
// import { getEmployees, getDepartments, getWeeklyReport, getCustomReport, exportReport } from '@/lib/api';

// export default function Dashboard() {
//   const [stats, setStats] = useState({ employees: 0, departments: 0 });
//   const [loading, setLoading] = useState(true);

//   // Weekly report
//   const [weeklyForm, setWeeklyForm] = useState({ startDate: '', endDate: '' });
//   const [weeklyResult, setWeeklyResult] = useState<any>(null);
//   const [weeklyLoading, setWeeklyLoading] = useState(false);
//   const [weeklyError, setWeeklyError] = useState('');

//   // Custom report
//   const [customForm, setCustomForm] = useState({ fromDate: '', toDate: '', reportType: 'payroll' });
//   const [customResult, setCustomResult] = useState<any>(null);
//   const [customLoading, setCustomLoading] = useState(false);
//   const [customError, setCustomError] = useState('');

//   const [exportLoading, setExportLoading] = useState(false);
//   const [activeReport, setActiveReport] = useState<'weekly' | 'custom' | null>(null);

//   useEffect(() => {
//     Promise.allSettled([getEmployees(), getDepartments()]).then(([emp, dep]) => {
//       setStats({
//         employees: emp.status === 'fulfilled' ? (emp.value.data?.length ?? 0) : 0,
//         departments: dep.status === 'fulfilled' ? (dep.value.data?.length ?? 0) : 0,
//       });
//       setLoading(false);
//     });
//   }, []);

//   const handleWeeklyReport = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setWeeklyError('');
//     setWeeklyLoading(true);
//     try {
//       const res = await getWeeklyReport(weeklyForm);
//       setWeeklyResult(res.data);
//       setActiveReport('weekly');
//     } catch (err: unknown) {
//       setWeeklyError(err instanceof Error ? err.message : 'حدث خطأ');
//     } finally {
//       setWeeklyLoading(false);
//     }
//   };

//   const handleCustomReport = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setCustomError('');
//     setCustomLoading(true);
//     try {
//       const res = await getCustomReport(customForm);
//       setCustomResult(res.data);
//       setActiveReport('custom');
//     } catch (err: unknown) {
//       setCustomError(err instanceof Error ? err.message : 'حدث خطأ');
//     } finally {
//       setCustomLoading(false);
//     }
//   };

//   const handleExport = async () => {
//     const reportData = activeReport === 'weekly' ? weeklyResult : customResult;
//     if (!reportData) return;
//     setExportLoading(true);
//     try {
//       const res = await exportReport(reportData);
//       const url = window.URL.createObjectURL(new Blob([res.data]));
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `report_${Date.now()}.csv`;
//       a.click();
//       window.URL.revokeObjectURL(url);
//     } catch (err: unknown) {
//       alert(err instanceof Error ? err.message : 'فشل التصدير');
//     } finally {
//       setExportLoading(false);
//     }
//   };

//   const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-cairo";
//   const labelClass = "block text-sm font-medium text-foreground font-cairo mb-1";

//   return (
//     <div className="space-y-6">
//       <PageHeader title="لوحة التحكم" titleEn="Dashboard" subtitle="نظرة عامة على بيانات الشركة والتقارير" />

//       {/* Stats */}
//       {loading ? (
//         <div className="flex justify-center py-8"><LoadingSpinner /></div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//           <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
//             <StatCard title="إجمالي الموظفين" titleEn="Total Employees" value={stats.employees} icon={<Users className="w-6 h-6" />} color="navy" />
//           </motion.div>
//           <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
//             <StatCard title="الأقسام" titleEn="Departments" value={stats.departments} icon={<Building2 className="w-6 h-6" />} color="gold" />
//           </motion.div>
//           <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
//             <StatCard title="التقارير الأسبوعية" titleEn="Weekly Reports" value="متاح" icon={<BarChart3 className="w-6 h-6" />} color="green" />
//           </motion.div>
//           <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
//             <StatCard title="تقارير مخصصة" titleEn="Custom Reports" value="متاح" icon={<TrendingUp className="w-6 h-6" />} color="rose" />
//           </motion.div>
//         </div>
//       )}

//       {/* Reports Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Weekly Report */}
//         <FormSection>
//           <div className="flex items-center gap-2 mb-4">
//             <Calendar className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
//             <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>التقرير الأسبوعي</h3>
//             <span className="text-muted-foreground text-xs">/ Weekly Report</span>
//           </div>
//           <form onSubmit={handleWeeklyReport} className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className={labelClass}>تاريخ البداية <span className="text-destructive">*</span></label>
//                 <input type="date" className={inputClass} value={weeklyForm.startDate}
//                   onChange={e => setWeeklyForm(p => ({ ...p, startDate: e.target.value }))} required />
//               </div>
//               <div>
//                 <label className={labelClass}>تاريخ النهاية <span className="text-destructive">*</span></label>
//                 <input type="date" className={inputClass} value={weeklyForm.endDate}
//                   onChange={e => setWeeklyForm(p => ({ ...p, endDate: e.target.value }))} required />
//               </div>
//             </div>
//             {weeklyError && <ErrorAlert message={weeklyError} />}
//             <button type="submit" className="navy-btn w-full" disabled={weeklyLoading}>
//               {weeklyLoading ? 'جاري التحميل...' : 'إنشاء التقرير الأسبوعي'}
//             </button>
//           </form>
//           {weeklyResult && (
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 rounded-lg bg-muted border border-border">
//               <p className="text-xs font-semibold text-muted-foreground mb-2 font-cairo">نتيجة التقرير:</p>
//               <pre className="text-xs overflow-auto max-h-40 text-foreground">{JSON.stringify(weeklyResult, null, 2)}</pre>
//             </motion.div>
//           )}
//         </FormSection>

//         {/* Custom Report */}
//         <FormSection>
//           <div className="flex items-center gap-2 mb-4">
//             <FileText className="w-5 h-5" style={{ color: 'hsl(var(--gold-dark))' }} />
//             <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>تقرير مخصص</h3>
//             <span className="text-muted-foreground text-xs">/ Custom Report</span>
//           </div>
//           <form onSubmit={handleCustomReport} className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className={labelClass}>من تاريخ <span className="text-destructive">*</span></label>
//                 <input type="date" className={inputClass} value={customForm.fromDate}
//                   onChange={e => setCustomForm(p => ({ ...p, fromDate: e.target.value }))} required />
//               </div>
//               <div>
//                 <label className={labelClass}>إلى تاريخ <span className="text-destructive">*</span></label>
//                 <input type="date" className={inputClass} value={customForm.toDate}
//                   onChange={e => setCustomForm(p => ({ ...p, toDate: e.target.value }))} required />
//               </div>
//             </div>
//             <div>
//               <label className={labelClass}>نوع التقرير <span className="text-destructive">*</span></label>
//               <select className={inputClass} value={customForm.reportType}
//                 onChange={e => setCustomForm(p => ({ ...p, reportType: e.target.value }))}>
//                 <option value="payroll">الرواتب - Payroll</option>
//                 <option value="attendance">الحضور - Attendance</option>
//                 <option value="loans">القروض - Loans</option>
//                 <option value="department">الأقسام - Department</option>
//               </select>
//             </div>
//             {customError && <ErrorAlert message={customError} />}
//             <button type="submit" className="gold-btn w-full" disabled={customLoading}>
//               {customLoading ? 'جاري التحميل...' : 'إنشاء التقرير المخصص'}
//             </button>
//           </form>
//           {customResult && (
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 rounded-lg bg-muted border border-border">
//               <p className="text-xs font-semibold text-muted-foreground mb-2 font-cairo">نتيجة التقرير:</p>
//               <pre className="text-xs overflow-auto max-h-40 text-foreground">{JSON.stringify(customResult, null, 2)}</pre>
//             </motion.div>
//           )}
//         </FormSection>
//       </div>

//       {/* Export Button */}
//       {(weeklyResult || customResult) && (
//         <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
//           <FormSection className="flex items-center justify-between">
//             <div>
//               <p className="font-cairo font-semibold" style={{ color: 'hsl(var(--navy))' }}>تصدير التقرير</p>
//               <p className="text-sm text-muted-foreground">تحميل آخر تقرير تم إنشاؤه بصيغة CSV</p>
//             </div>
//             <button onClick={handleExport} disabled={exportLoading} className="flex items-center gap-2 gold-btn">
//               <Download className="w-4 h-4" />
//               {exportLoading ? 'جاري التصدير...' : 'تحميل CSV / Excel'}
//             </button>
//           </FormSection>
//         </motion.div>
//       )}
//     </div>
//   );
// }

// the code before any add feauters
// import { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import {
//   Users, Building2, BarChart3, TrendingUp, Calendar, FileText, Download
// } from 'lucide-react';
// import StatCard from '@/components/StatCard';
// import { PageHeader, FormSection, ErrorAlert, LoadingSpinner } from '@/components/UI';
// import { getEmployees, getDepartments, getWeeklyReport, getCustomReport, exportReport } from '@/lib/api';

// const fieldLabels: Record<string, string> = {
//   reportTitle: 'عنوان التقرير', generatedDate: 'تاريخ الإنشاء',
//   periodStart: 'بداية الفترة', periodEnd: 'نهاية الفترة',
//   totalEmployees: 'إجمالي الموظفين', totalAttendanceRecords: 'سجلات الحضور',
//   totalLateMinutes: 'دقائق التأخير', totalOvertimeMinutes: 'دقائق الإضافي',
//   totalPayrollRecords: 'سجلات الرواتب', totalOvertimePay: 'إجمالي الإضافي',
//   totalDeductions: 'إجمالي الخصومات', totalNetSalary: 'صافي الرواتب',
//   totalLoans: 'إجمالي القروض', totalLoanAmount: 'مبلغ القروض',
//   totalInstallments: 'إجمالي الأقساط', paidInstallments: 'أقساط مدفوعة',
//   unpaidInstallments: 'أقساط غير مدفوعة', totalDepartments: 'إجمالي الأقسام',
//   uniqueEmployees: 'موظفون فريدون',
//   employeeName: 'اسم الموظف', date: 'التاريخ', lateMinutes: 'دقائق التأخير',
//   overtimeMinutes: 'دقائق الإضافي', actualStart: 'وقت الحضور', actualEnd: 'وقت الانصراف',
//   finalSalary: 'صافي الراتب', overtimePay: 'بدل إضافي', lateDeduction: 'خصم تأخير',
//   loanDeduction: 'خصم قرض', workedDays: 'أيام العمل', month: 'الشهر',
//   totalAmount: 'مبلغ القرض', createdAt: 'تاريخ الإنشاء',
//   installmentCount: 'عدد الأقساط', departmentName: 'القسم',
//   employeeCount: 'عدد الموظفين', totalBaseSalary: 'إجمالي الرواتب',
// };

// const translateKey = (key: string) => fieldLabels[key] || key;

// function ReportSummary({ summary }: { summary: Record<string, any> }) {
//   return (
//     <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
//       {Object.entries(summary).map(([key, val]) => (
//         <div key={key} className="p-3 rounded-lg" style={{ background: 'hsl(var(--navy) / 0.05)' }}>
//           <p className="text-xs text-muted-foreground font-cairo">{translateKey(key)}</p>
//           <p className="text-sm font-bold font-cairo mt-1" style={{ color: 'hsl(var(--navy))' }}>
//             {typeof val === 'number' ? val.toLocaleString('ar-SA') : String(val)}
//           </p>
//         </div>
//       ))}
//     </div>
//   );
// }

// function ReportDetails({ details, reportType }: { details: any[]; reportType: string }) {
//   if (!details || details.length === 0) return null;

//   return (
//     <div className="overflow-x-auto rounded-lg border border-border">
//       <table className="data-table">
//         <thead>
//           <tr>
//             {reportType === 'attendance' && <>
//               <th>الموظف</th><th>التاريخ</th><th>دقائق التأخير</th><th>دقائق الإضافي</th>
//             </>}
//             {reportType === 'payroll' && <>
//               <th>الموظف</th><th>الشهر</th><th>أيام العمل</th><th>خصم التأخير</th><th>بدل إضافي</th><th>صافي الراتب</th>
//             </>}
//             {reportType === 'loans' && <>
//               <th>الموظف</th><th>مبلغ القرض</th><th>تاريخ الإنشاء</th><th>عدد الأقساط</th><th>أقساط مدفوعة</th>
//             </>}
//             {reportType === 'department' && <>
//               <th>القسم</th><th>عدد الموظفين</th><th>إجمالي الرواتب</th>
//             </>}
//             {reportType === 'weekly' && <>
//               <th>الموظف</th><th>التاريخ</th><th>دقائق التأخير</th><th>دقائق الإضافي</th>
//             </>}
//           </tr>
//         </thead>
//         <tbody>
//           {reportType === 'weekly' && details.map((emp: any, i: number) =>
//             emp.attendances?.map((att: any, j: number) => (
//               <tr key={`${i}-${j}`}>
//                 <td className="font-cairo">{emp.employeeName}</td>
//                 <td>{att.date}</td>
//                 <td style={{ color: att.lateMinutes > 0 ? 'hsl(0 84% 60%)' : 'hsl(142 76% 36%)' }}>{att.lateMinutes}</td>
//                 <td style={{ color: 'hsl(var(--gold-dark))' }}>{att.overtimeMinutes}</td>
//               </tr>
//             ))
//           )}
//           {reportType === 'attendance' && details.map((att: any, i: number) => (
//             <tr key={i}>
//               <td className="font-cairo">{att.employeeName}</td>
//               <td>{att.date}</td>
//               <td style={{ color: att.lateMinutes > 0 ? 'hsl(0 84% 60%)' : 'hsl(142 76% 36%)' }}>{att.lateMinutes}</td>
//               <td style={{ color: 'hsl(var(--gold-dark))' }}>{att.overtimeMinutes}</td>
//             </tr>
//           ))}
//           {reportType === 'payroll' && details.map((p: any, i: number) => (
//             <tr key={i}>
//               <td className="font-cairo">{p.employeeName}</td>
//               <td>{p.month}</td>
//               <td>{p.workedDays}</td>
//               <td style={{ color: 'hsl(0 84% 60%)' }}>{Number(p.lateDeduction).toLocaleString('ar-EG')}</td>
//               <td style={{ color: 'hsl(var(--gold-dark))' }}>{Number(p.overtimePay).toLocaleString('ar-EG')}</td>
//               <td className="font-bold" style={{ color: 'hsl(var(--navy))' }}>{Number(p.finalSalary).toLocaleString('ar-EG')} جنيه</td>
//             </tr>
//           ))}
//           {reportType === 'loans' && details.map((l: any, i: number) => (
//             <tr key={i}>
//               <td className="font-cairo">{l.employeeName}</td>
//               <td>{Number(l.totalAmount).toLocaleString('ar-EG')} جنيه</td>
//               <td>{l.createdAt}</td>
//               <td>{l.installmentCount}</td>
//               <td>{l.paidInstallments}</td>
//             </tr>
//           ))}
//           {reportType === 'department' && details.map((d: any, i: number) => (
//             <tr key={i}>
//               <td className="font-cairo">{d.departmentName}</td>
//               <td>{d.employeeCount}</td>
//               <td>{Number(d.totalBaseSalary).toLocaleString('ar-EG')}جنيه</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default function Dashboard() {
//   const [stats, setStats] = useState({ employees: 0, departments: 0 });
//   const [loading, setLoading] = useState(true);

//   const [weeklyForm, setWeeklyForm] = useState({ startDate: '', endDate: '' });
//   const [weeklyResult, setWeeklyResult] = useState<any>(null);
//   const [weeklyLoading, setWeeklyLoading] = useState(false);
//   const [weeklyError, setWeeklyError] = useState('');

//   const [customForm, setCustomForm] = useState({ fromDate: '', toDate: '', reportType: 'payroll' });
//   const [customResult, setCustomResult] = useState<any>(null);
//   const [customLoading, setCustomLoading] = useState(false);
//   const [customError, setCustomError] = useState('');

//   const [exportLoading, setExportLoading] = useState(false);
//   const [activeReport, setActiveReport] = useState<'weekly' | 'custom' | null>(null);

//   useEffect(() => {
//     Promise.allSettled([getEmployees(), getDepartments()]).then(([emp, dep]) => {
//       setStats({
//         employees: emp.status === 'fulfilled' ? (emp.value.data?.length ?? 0) : 0,
//         departments: dep.status === 'fulfilled' ? (dep.value.data?.length ?? 0) : 0,
//       });
//       setLoading(false);
//     });
//   }, []);

//   const handleWeeklyReport = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setWeeklyError('');
//     setWeeklyLoading(true);
//     try {
//       const res = await getWeeklyReport(weeklyForm);
//       setWeeklyResult(res.data);
//       setActiveReport('weekly');
//     } catch (err: unknown) {
//       setWeeklyError(err instanceof Error ? err.message : 'حدث خطأ');
//     } finally {
//       setWeeklyLoading(false);
//     }
//   };

//   const handleCustomReport = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setCustomError('');
//     setCustomLoading(true);
//     try {
//       const res = await getCustomReport(customForm);
//       setCustomResult(res.data);
//       setActiveReport('custom');
//     } catch (err: unknown) {
//       setCustomError(err instanceof Error ? err.message : 'حدث خطأ');
//     } finally {
//       setCustomLoading(false);
//     }
//   };

//   const handleExport = async () => {
//     const reportData = activeReport === 'weekly' ? weeklyResult : customResult;
//     if (!reportData) return;
//     setExportLoading(true);
//     try {
//       const res = await exportReport(reportData);
//       const url = window.URL.createObjectURL(new Blob([res.data]));
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `report_${Date.now()}.csv`;
//       a.click();
//       window.URL.revokeObjectURL(url);
//     } catch (err: unknown) {
//       alert(err instanceof Error ? err.message : 'فشل التصدير');
//     } finally {
//       setExportLoading(false);
//     }
//   };

//   const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-cairo";
//   const labelClass = "block text-sm font-medium text-foreground font-cairo mb-1";

//   return (
//     <div className="space-y-6">
//       <PageHeader title="لوحة التحكم"  subtitle="نظرة عامة على بيانات الشركة والتقارير" />

//       {loading ? (
//         <div className="flex justify-center py-8"><LoadingSpinner /></div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//           <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
//             <StatCard title="إجمالي الموظفين" value={stats.employees} icon={<Users className="w-6 h-6" />} color="navy" />
//           </motion.div>
//           <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
//             <StatCard title="الأقسام" value={stats.departments} icon={<Building2 className="w-6 h-6" />} color="gold" />
//           </motion.div>
//           <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
//             <StatCard title="التقارير الأسبوعية" value="متاح" icon={<BarChart3 className="w-6 h-6" />} color="green" />
//           </motion.div>
//           <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
//             <StatCard title="تقارير مخصصة" value="متاح" icon={<BarChart3 className="w-6 h-6" />} color="navy" />
//           </motion.div>
//         </div>
//       )}

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Weekly Report */}
//         <FormSection>
//           <div className="flex items-center gap-2 mb-4">
//             <Calendar className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
//             <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>التقرير الأسبوعي</h3>
//             <span className="text-muted-foreground text-xs">/ Weekly Report</span>
//           </div>
//           <form onSubmit={handleWeeklyReport} className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className={labelClass}>تاريخ البداية <span className="text-destructive">*</span></label>
//                 <input type="date" className={inputClass} value={weeklyForm.startDate}
//                   onChange={e => setWeeklyForm(p => ({ ...p, startDate: e.target.value }))} required />
//               </div>
//               <div>
//                 <label className={labelClass}>تاريخ النهاية <span className="text-destructive">*</span></label>
//                 <input type="date" className={inputClass} value={weeklyForm.endDate}
//                   onChange={e => setWeeklyForm(p => ({ ...p, endDate: e.target.value }))} required />
//               </div>
//             </div>
//             {weeklyError && <ErrorAlert message={weeklyError} />}
//             <button type="submit" className="navy-btn w-full" disabled={weeklyLoading}>
//               {weeklyLoading ? 'جاري التحميل...' : 'إنشاء التقرير الأسبوعي'}
//             </button>
//           </form>

//           {weeklyResult && (
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">
//               <p className="text-xs font-semibold font-cairo" style={{ color: 'hsl(var(--navy))' }}>
//                 📊 {weeklyResult.reportTitle} — {weeklyResult.periodStart} إلى {weeklyResult.periodEnd}
//               </p>
//               {weeklyResult.summary && <ReportSummary summary={weeklyResult.summary} />}
//               {weeklyResult.details && <ReportDetails details={weeklyResult.details} reportType="weekly" />}
//             </motion.div>
//           )}
//         </FormSection>

//         {/* Custom Report */}
//         <FormSection>
//           <div className="flex items-center gap-2 mb-4">
//             <FileText className="w-5 h-5" style={{ color: 'hsl(var(--gold-dark))' }} />
//             <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>تقرير مخصص</h3>
//             <span className="text-muted-foreground text-xs">/ Custom Report</span>
//           </div>
//           <form onSubmit={handleCustomReport} className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className={labelClass}>من تاريخ <span className="text-destructive">*</span></label>
//                 <input type="date" className={inputClass} value={customForm.fromDate}
//                   onChange={e => setCustomForm(p => ({ ...p, fromDate: e.target.value }))} required />
//               </div>
//               <div>
//                 <label className={labelClass}>إلى تاريخ <span className="text-destructive">*</span></label>
//                 <input type="date" className={inputClass} value={customForm.toDate}
//                   onChange={e => setCustomForm(p => ({ ...p, toDate: e.target.value }))} required />
//               </div>
//             </div>
//             <div>
//               <label className={labelClass}>نوع التقرير <span className="text-destructive">*</span></label>
//               <select className={inputClass} value={customForm.reportType}
//                 onChange={e => setCustomForm(p => ({ ...p, reportType: e.target.value }))}>
//                 <option value="payroll">الرواتب</option>
//                 <option value="attendance">الحضور</option>
//                 <option value="loans">القروض</option>
//                 <option value="department">الأقسام</option>
//               </select>
//             </div>
//             {customError && <ErrorAlert message={customError} />}
//             <button type="submit" className="gold-btn w-full" disabled={customLoading}>
//               {customLoading ? 'جاري التحميل...' : 'إنشاء التقرير المخصص'}
//             </button>
//           </form>

//           {customResult && (
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">
//               <p className="text-xs font-semibold font-cairo" style={{ color: 'hsl(var(--navy))' }}>
//                 📊 {customResult.reportTitle} — {customResult.periodStart} إلى {customResult.periodEnd}
//               </p>
//               {customResult.summary && <ReportSummary summary={customResult.summary} />}
//               {customResult.details && <ReportDetails details={customResult.details} reportType={customForm.reportType} />}
//             </motion.div>
//           )}
//         </FormSection>
//       </div>

//       {(weeklyResult || customResult) && (
//         <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
//           <FormSection className="flex items-center justify-between">
//             <div>
//               <p className="font-cairo font-semibold" style={{ color: 'hsl(var(--navy))' }}>تصدير التقرير</p>
//               <p className="text-sm text-muted-foreground">تحميل آخر تقرير تم إنشاؤه بصيغة CSV</p>
//             </div>
//             <button onClick={handleExport} disabled={exportLoading} className="flex items-center gap-2 gold-btn">
//               <Download className="w-4 h-4" />
//               {exportLoading ? 'جاري التصدير...' : 'تحميل CSV / Excel'}
//             </button>
//           </FormSection>
//         </motion.div>
//       )}
//     </div>
//   );
// }


// the code after refinements:

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, Download, UserSearch, FolderSearch, BarChart3 } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { PageHeader, FormSection, ErrorAlert, LoadingSpinner } from '@/components/UI';
import { getEmployees, getDepartments, getEmployeeReport, getDepartmentReport, exportEmployeeReportXlsx, exportDepartmentsAggregatedXlsx } from '@/lib/api';
import { exportDepartmentReport } from '@/lib/xlsx-export';
import { EmployeeOptionGroups, type EmployeeForSelect } from '@/components/EmployeeOptionGroups';

function KeyValueGrid({ title, data }: { title: string; data: Record<string, unknown> }) {
  const entries = Object.entries(data ?? {}).filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (!entries.length) return null;
  return (
    <div className="p-4 rounded-xl border border-border" style={{ background: 'hsl(var(--navy) / 0.04)' }}>
      <p className="text-xs font-semibold font-cairo text-muted-foreground mb-2">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {entries.map(([k, v]) => (
          <div key={k}>
            <p className="text-xs text-muted-foreground font-cairo">{k}</p>
            <p className="text-sm font-bold font-cairo" style={{ color: 'hsl(var(--navy))' }}>
              {typeof v === 'number' ? v.toLocaleString('ar-EG') : String(v)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleTable({ title, rows }: { title: string; rows: Record<string, unknown>[] }) {
  if (!rows?.length) return null;
  const cols = Object.keys(rows[0]);
  return (
    <div>
      <p className="text-xs font-semibold font-cairo mb-2" style={{ color: 'hsl(var(--navy))' }}>
        {title} ({rows.length})
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="data-table">
          <thead>
            <tr>{cols.map(c => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {cols.map(c => (
                  <td key={c} className="font-cairo text-xs">
                    {r[c] === null || r[c] === undefined ? '—' : String(r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ employees: 0, departments: 0 });
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeForSelect[]>([]);
  const [departments, setDepartments] = useState<{ departmentName: string }[]>([]);

  const [empReportForm, setEmpReportForm] = useState({ employeeName: '', fromDate: '', toDate: '' });
  const [empReportResult, setEmpReportResult] = useState<any>(null);
  const [empReportLoading, setEmpReportLoading] = useState(false);
  const [empReportError, setEmpReportError] = useState('');
  const [reportUser, setReportUser] = useState('');

  const [deptReportForm, setDeptReportForm] = useState({ departmentName: '', fromDate: '', toDate: '' });
  const [deptReportResult, setDeptReportResult] = useState<any>(null);
  const [deptReportLoading, setDeptReportLoading] = useState(false);
  const [deptReportError, setDeptReportError] = useState('');

  const [deptAggForm, setDeptAggForm] = useState({ fromDate: '', toDate: '' });
  const [deptAggLoading, setDeptAggLoading] = useState(false);
  const [deptAggUser, setDeptAggUser] = useState('');
  const [deptAggError, setDeptAggError] = useState('');

  useEffect(() => {
    Promise.allSettled([getEmployees(), getDepartments()]).then(([emp, dep]) => {
      const empData = emp.status === 'fulfilled' ? emp.value.data : [];
      const depData = dep.status === 'fulfilled' ? dep.value.data : [];
      const empArr = Array.isArray(empData) ? empData : empData?.content || empData?.data || [];
      const depArr = Array.isArray(depData) ? depData : depData?.content || depData?.data || [];
      setEmployees(empArr);
      setDepartments(depArr);
      setStats({ employees: empArr.length, departments: depArr.length });
      setLoading(false);
    });
  }, []);

  const uniqueDeptNames = useMemo(() =>
    [...new Set(departments.map(d => d.departmentName))], [departments]);

  const handleEmployeeReportExport = async () => {
    if (!empReportForm.employeeName || !empReportForm.fromDate || !empReportForm.toDate) return;
    try {
      const res = await exportEmployeeReportXlsx(empReportForm, reportUser.trim() || undefined);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employee_report_${empReportForm.employeeName}_${empReportForm.fromDate}_${empReportForm.toDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'فشل تصدير تقرير الموظف');
    }
  };

  const handleEmployeeReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpReportError('');
    setEmpReportResult(null);
    setEmpReportLoading(true);
    try {
      const res = await getEmployeeReport(empReportForm);
      setEmpReportResult(res.data);
    } catch (err: unknown) {
      setEmpReportError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setEmpReportLoading(false);
    }
  };

  const handleDepartmentReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptReportError('');
    setDeptReportResult(null);
    setDeptReportLoading(true);
    try {
      const res = await getDepartmentReport(deptReportForm);
      setDeptReportResult(res.data);
    } catch (err: unknown) {
      setDeptReportError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setDeptReportLoading(false);
    }
  };

  const handleDeptAggregatedExport = async () => {
    if (!deptAggForm.fromDate || !deptAggForm.toDate) return;
    setDeptAggError('');
    setDeptAggLoading(true);
    try {
      const res = await exportDepartmentsAggregatedXlsx(deptAggForm, deptAggUser.trim() || undefined);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `departments_aggregated_${deptAggForm.fromDate}_${deptAggForm.toDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setDeptAggError(err instanceof Error ? err.message : 'فشل تصدير التقرير المجمع للأقسام');
    } finally {
      setDeptAggLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-cairo";
  const labelClass = "block text-sm font-medium text-foreground font-cairo mb-1";

  return (
    <div className="space-y-6">
      <PageHeader title="لوحة التحكم" subtitle="تقارير الموظفين والأقسام بصيغة Excel (XLSX)" />

      {/* Stat Cards */}
      {loading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <StatCard title="إجمالي الموظفين" value={stats.employees} icon={<Users className="w-6 h-6" />} color="navy" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <StatCard title="الأقسام" value={stats.departments} icon={<Building2 className="w-6 h-6" />} color="gold" />
          </motion.div>
        </div>
      )}

      {/* ─── Employee Report ─── */}
      <FormSection>
        <div className="flex items-center gap-2 mb-4">
          <UserSearch className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
          <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>تقرير موظف</h3>
        </div>

        <form onSubmit={handleEmployeeReport} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>اسم الموظف <span className="text-destructive">*</span></label>
              <select className={inputClass} value={empReportForm.employeeName}
                onChange={e => setEmpReportForm(p => ({ ...p, employeeName: e.target.value }))} required>
                <option value="">-- اختر الموظف --</option>
                <EmployeeOptionGroups employees={employees} />
              </select>
            </div>
            <div>
              <label className={labelClass}>من تاريخ <span className="text-destructive">*</span></label>
              <input type="date" className={inputClass} value={empReportForm.fromDate}
                onChange={e => setEmpReportForm(p => ({ ...p, fromDate: e.target.value }))} required />
            </div>
            <div>
              <label className={labelClass}>إلى تاريخ <span className="text-destructive">*</span></label>
              <input type="date" className={inputClass} value={empReportForm.toDate}
                onChange={e => setEmpReportForm(p => ({ ...p, toDate: e.target.value }))} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>اسم المستخدم الذي أنشأ التقرير (اختياري)</label>
              <input className={inputClass} value={reportUser}
                placeholder="مثال: HR Manager"
                onChange={e => setReportUser(e.target.value)} />
            </div>
          </div>

          {empReportError && <ErrorAlert message={empReportError} />}

          <div className="flex flex-wrap gap-2">
            <button type="submit" className="navy-btn" disabled={empReportLoading}>
              {empReportLoading ? 'جاري التحميل...' : 'معاينة التقرير'}
            </button>
            {empReportResult && (
              <button
                type="button"
                onClick={handleEmployeeReportExport}
                className="gold-btn flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> تحميل XLSX
              </button>
            )}
          </div>
        </form>

        {empReportResult && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-4">
            <KeyValueGrid title="بيانات الموظف" data={empReportResult.employeeInfo ?? {}} />
            <KeyValueGrid title="ملخص الفترة" data={empReportResult.summary ?? {}} />
            <SimpleTable title="سجلات الحضور" rows={empReportResult.attendanceRecords ?? []} />
            <SimpleTable title="الغيابات" rows={empReportResult.absenceRecords ?? []} />
            <SimpleTable title="الرواتب" rows={empReportResult.payrollRecords ?? []} />
            <SimpleTable title="القروض" rows={empReportResult.loans ?? []} />
            <SimpleTable title="الإجراءات التأديبية" rows={empReportResult.disciplinaryActions ?? []} />
          </motion.div>
        )}
      </FormSection>

      {/* ─── Department Report ─── */}
      <FormSection>
        <div className="flex items-center gap-2 mb-4">
          <FolderSearch className="w-5 h-5" style={{ color: 'hsl(var(--gold-dark))' }} />
          <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>تقرير قسم</h3>
        </div>

        <form onSubmit={handleDepartmentReport} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>القسم <span className="text-destructive">*</span></label>
              <select className={inputClass} value={deptReportForm.departmentName}
                onChange={e => setDeptReportForm(p => ({ ...p, departmentName: e.target.value }))} required>
                <option value="">-- اختر القسم --</option>
                {uniqueDeptNames.map((name, i) => (
                  <option key={i} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>من تاريخ <span className="text-destructive">*</span></label>
              <input type="date" className={inputClass} value={deptReportForm.fromDate}
                onChange={e => setDeptReportForm(p => ({ ...p, fromDate: e.target.value }))} required />
            </div>
            <div>
              <label className={labelClass}>إلى تاريخ <span className="text-destructive">*</span></label>
              <input type="date" className={inputClass} value={deptReportForm.toDate}
                onChange={e => setDeptReportForm(p => ({ ...p, toDate: e.target.value }))} required />
            </div>
          </div>

          {deptReportError && <ErrorAlert message={deptReportError} />}

          <div className="flex flex-wrap gap-2">
            <button type="submit" className="gold-btn" disabled={deptReportLoading}>
              {deptReportLoading ? 'جاري التحميل...' : 'معاينة التقرير'}
            </button>
            {deptReportResult && (
              <button
                type="button"
                onClick={() => exportDepartmentReport(deptReportResult, deptReportForm)}
                className="navy-btn flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> تحميل XLSX
              </button>
            )}
          </div>
        </form>

        {deptReportResult && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-4">
            <KeyValueGrid title="ملخص القسم" data={deptReportResult.summary ?? {}} />
            <SimpleTable title="موظفو القسم" rows={deptReportResult.details ?? []} />
          </motion.div>
        )}
      </FormSection>

      {/* ─── Department Aggregated Report (Grouped) ─── */}
      <FormSection>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
          <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
            تقرير الأقسام (ملخص مجمع)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>من تاريخ <span className="text-destructive">*</span></label>
            <input type="date" className={inputClass} value={deptAggForm.fromDate}
              onChange={e => setDeptAggForm(p => ({ ...p, fromDate: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>إلى تاريخ <span className="text-destructive">*</span></label>
            <input type="date" className={inputClass} value={deptAggForm.toDate}
              onChange={e => setDeptAggForm(p => ({ ...p, toDate: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>اسم المستخدم (اختياري)</label>
            <input className={inputClass} value={deptAggUser}
              placeholder="مثال: Accountant"
              onChange={e => setDeptAggUser(e.target.value)} />
          </div>
        </div>

        {deptAggError && <ErrorAlert message={deptAggError} />}

        <button
          type="button"
          onClick={handleDeptAggregatedExport}
          className="gold-btn mt-4 flex items-center gap-2"
          disabled={deptAggLoading || !deptAggForm.fromDate || !deptAggForm.toDate}
        >
          <Download className="w-4 h-4" />
          {deptAggLoading ? 'جاري التصدير...' : 'تحميل XLSX (ملخص الأقسام + الموظفين)'}
        </button>

        <p className="text-xs text-muted-foreground font-cairo mt-2">
          يشمل: عدد الموظفين، إجمالي الرواتب، إجمالي الخصومات، متوسط الراتب، ومعدل الحضور لكل قسم.
        </p>
      </FormSection>
    </div>
  );
}