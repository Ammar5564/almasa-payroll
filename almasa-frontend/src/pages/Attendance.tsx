// import { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { Clock, Info } from 'lucide-react';
// import { PageHeader, FormSection, ErrorAlert, SuccessAlert, LoadingSpinner } from '@/components/UI';
// import { postAttendance, getAttendanceDefaults, getEmployees } from '@/lib/api';

// interface AttendanceDefaults { officialStartTime?: string; officialEndTime?: string; [key: string]: unknown; }
// interface AttendanceResult { lateMinutes?: number; overtimeMinutes?: number; [key: string]: unknown; }

// export default function Attendance() {
//   const [employees, setEmployees] = useState<{ name: string }[]>([]);
//   const [defaults, setDefaults] = useState<AttendanceDefaults | null>(null);
//   const [defaultsLoading, setDefaultsLoading] = useState(true);

//   const [form, setForm] = useState({
//     employeeName: '', date: '', actualStartTime: '', actualEndTime: ''
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [result, setResult] = useState<AttendanceResult | null>(null);

//   useEffect(() => {
//     Promise.allSettled([getEmployees(), getAttendanceDefaults()]).then(([empRes, defRes]) => {
//       if (empRes.status === 'fulfilled') {
//   const empData = empRes.value.data;
//   setEmployees(Array.isArray(empData) ? empData : empData?.content || empData?.data || []);
// }
//       if (defRes.status === 'fulfilled') {
//   const defData = defRes.value.data;
//   setDefaults(typeof defData === 'object' && !Array.isArray(defData) ? defData : null);
// }
//       setDefaultsLoading(false);
//     });
//   }, []);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setResult(null);
//     setLoading(true);
//     try {
//       const res = await postAttendance(form);
//       setResult(res.data);
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : 'حدث خطأ');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-cairo";
//   const labelClass = "block text-sm font-medium text-foreground font-cairo mb-1";

//   return (
//     <div className="space-y-6">
//       <PageHeader title="الحضور والوقت" titleEn="Attendance & Time Tracking" subtitle="تسجيل سجلات الحضور ومتابعة الأوقات" />

//       {/* Today's Defaults */}
//       <FormSection>
//         <div className="flex items-center gap-2 mb-4">
//           <Info className="w-5 h-5" style={{ color: 'hsl(var(--gold-dark))' }} />
//           <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>إعدادات الوقت الافتراضية / Today's Defaults</h3>
//         </div>
//         {defaultsLoading ? (
//           <LoadingSpinner />
//         ) : defaults ? (
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {Object.entries(defaults).map(([key, val]) => (
//               <div key={key} className="p-3 rounded-lg" style={{ background: 'hsl(var(--navy) / 0.05)' }}>
//                 <p className="text-xs text-muted-foreground font-cairo mb-1">{key}</p>
//                 <p className="text-sm font-semibold font-cairo" style={{ color: 'hsl(var(--navy))' }}>{String(val)}</p>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="text-sm text-muted-foreground font-cairo">لا توجد إعدادات افتراضية</p>
//         )}
//       </FormSection>

//       {/* Attendance Form */}
//       <FormSection>
//         <div className="flex items-center gap-2 mb-4">
//           <Clock className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
//           <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>تسجيل الحضور / Register Attendance</h3>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className={labelClass}>اسم الموظف <span className="text-destructive">*</span></label>
//               <select className={inputClass} value={form.employeeName}
//                 onChange={e => setForm(p => ({ ...p, employeeName: e.target.value }))} required>
//                 <option value="">-- اختر الموظف --</option>
//                 {employees.map((emp, i) => (
//                   <option key={i} value={emp.name}>{emp.name}</option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label className={labelClass}>التاريخ (YYYY-MM-DD) <span className="text-destructive">*</span></label>
//               <input type="date" className={inputClass} value={form.date}
//                 onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
//             </div>
//             <div>
//               <label className={labelClass}>وقت الحضور الفعلي <span className="text-destructive">*</span></label>
//               <input type="time" className={inputClass} value={form.actualStartTime}
//                 onChange={e => setForm(p => ({ ...p, actualStartTime: e.target.value }))} required />
//             </div>
//             <div>
//               <label className={labelClass}>وقت الانصراف الفعلي <span className="text-destructive">*</span></label>
//               <input type="time" className={inputClass} value={form.actualEndTime}
//                 onChange={e => setForm(p => ({ ...p, actualEndTime: e.target.value }))} required />
//             </div>
//           </div>

//           {error && <ErrorAlert message={error} />}

//           <button type="submit" className="navy-btn" disabled={loading}>
//             {loading ? 'جاري التسجيل...' : 'تسجيل الحضور'}
//           </button>
//         </form>

//         {/* Result Card */}
//         {result && (
//           <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
//             className="mt-6 p-5 rounded-xl border-2"
//             style={{ background: 'hsl(var(--navy) / 0.03)', borderColor: 'hsl(var(--navy) / 0.15)' }}>
//             <p className="font-cairo font-bold text-sm mb-4" style={{ color: 'hsl(var(--navy))' }}>
//               ✅ تم تسجيل الحضور بنجاح / Attendance Registered Successfully
//             </p>
//             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//               {result.lateMinutes !== undefined && (
//                 <div className="p-3 rounded-lg" style={{ background: result.lateMinutes > 0 ? 'hsl(0 84% 60% / 0.1)' : 'hsl(142 76% 36% / 0.1)' }}>
//                   <p className="text-xs text-muted-foreground font-cairo">دقائق التأخير</p>
//                   <p className="text-2xl font-bold mt-1" style={{ color: result.lateMinutes > 0 ? 'hsl(0 84% 60%)' : 'hsl(142 76% 36%)' }}>
//                     {result.lateMinutes}
//                   </p>
//                   <p className="text-xs text-muted-foreground">Late Minutes</p>
//                 </div>
//               )}
//               {result.overtimeMinutes !== undefined && (
//                 <div className="p-3 rounded-lg" style={{ background: 'hsl(43 96% 56% / 0.1)' }}>
//                   <p className="text-xs text-muted-foreground font-cairo">دقائق الإضافي</p>
//                   <p className="text-2xl font-bold mt-1" style={{ color: 'hsl(var(--gold-dark))' }}>
//                     {result.overtimeMinutes}
//                   </p>
//                   <p className="text-xs text-muted-foreground">Overtime Minutes</p>
//                 </div>
//               )}
//               {Object.entries(result).filter(([k]) => k !== 'lateMinutes' && k !== 'overtimeMinutes').map(([k, v]) => (
//                 <div key={k} className="p-3 rounded-lg border border-border">
//                   <p className="text-xs text-muted-foreground font-cairo">{k}</p>
//                   <p className="text-sm font-semibold mt-1 font-cairo">{String(v)}</p>
//                 </div>
//               ))}
//             </div>
//           </motion.div>
//         )}
//       </FormSection>
//     </div>
//   );
// }

// the basic one before refinements and new features :
// import { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { Clock, Info } from 'lucide-react';
// import { PageHeader, FormSection, ErrorAlert, LoadingSpinner } from '@/components/UI';
// import { postAttendance, getAttendanceDefaults, getEmployees } from '@/lib/api';

// interface AttendanceDefaults { date?: string; officialStart?: string; officialEnd?: string; [key: string]: unknown; }
// interface AttendanceResult { lateMinutes?: number; overtimeMinutes?: number; [key: string]: unknown; }

// export default function Attendance() {
//   const [employees, setEmployees] = useState<{ name: string }[]>([]);
//   const [defaults, setDefaults] = useState<AttendanceDefaults | null>(null);
//   const [defaultsLoading, setDefaultsLoading] = useState(true);

//   const [form, setForm] = useState({
//     employeeName: '', date: '', actualStartTime: '', actualEndTime: ''
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [result, setResult] = useState<AttendanceResult | null>(null);

//   useEffect(() => {
//     Promise.allSettled([getEmployees(), getAttendanceDefaults()]).then(([empRes, defRes]) => {
//       if (empRes.status === 'fulfilled') {
//         const empData = empRes.value.data;
//         setEmployees(Array.isArray(empData) ? empData : empData?.content || empData?.data || []);
//       }
//       if (defRes.status === 'fulfilled') {
//         const defData = defRes.value.data;
//         if (typeof defData === 'string') {
//           try { setDefaults(JSON.parse(defData)); } catch { setDefaults(null); }
//         } else if (typeof defData === 'object' && !Array.isArray(defData)) {
//           setDefaults(defData);
//         } else {
//           setDefaults(null);
//         }
//       }
//       setDefaultsLoading(false);
//     });
//   }, []);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setResult(null);
//     setLoading(true);
//     try {
//       const res = await postAttendance({
//         employeeName: form.employeeName,
//         date: form.date,
//         actualStart: form.actualStartTime,
//         actualEnd: form.actualEndTime,
//       });
//       setResult(res.data);
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : 'حدث خطأ');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-cairo";
//   const labelClass = "block text-sm font-medium text-foreground font-cairo mb-1";

//   return (
//     <div className="space-y-6">
//       <PageHeader title="الحضور والوقت" subtitle="تسجيل سجلات الحضور ومتابعة الأوقات" />

//       {/* Today's Defaults */}
//       <FormSection>
//         <div className="flex items-center gap-2 mb-4">
//           <Info className="w-5 h-5" style={{ color: 'hsl(var(--gold-dark))' }} />
//           <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>إعدادات الوقت الافتراضية</h3>
//         </div>
//         {defaultsLoading ? (
//           <LoadingSpinner />
//         ) : defaults ? (
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {Object.entries(defaults).filter(([, val]) => val !== null && val !== undefined).map(([key, val]) => (
//               <div key={key} className="p-3 rounded-lg" style={{ background: 'hsl(var(--navy) / 0.05)' }}>
//                 <p className="text-xs text-muted-foreground font-cairo mb-1">{key}</p>
//                 <p className="text-sm font-semibold font-cairo" style={{ color: 'hsl(var(--navy))' }}>{String(val)}</p>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="text-sm text-muted-foreground font-cairo">لا توجد إعدادات افتراضية</p>
//         )}
//       </FormSection>

//       {/* Attendance Form */}
//       <FormSection>
//         <div className="flex items-center gap-2 mb-4">
//           <Clock className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
//           <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>تسجيل الحضور</h3>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className={labelClass}>اسم الموظف <span className="text-destructive">*</span></label>
//               <select className={inputClass} value={form.employeeName}
//                 onChange={e => setForm(p => ({ ...p, employeeName: e.target.value }))} required>
//                 <option value="">-- اختر الموظف --</option>
//                 {employees.map((emp, i) => (
//                   <option key={i} value={emp.name}>{emp.name}</option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label className={labelClass}>التاريخ <span className="text-destructive">*</span></label>
//               <input type="date" className={inputClass} value={form.date}
//                 onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
//             </div>
//             <div>
//               <label className={labelClass}>وقت الحضور الفعلي <span className="text-destructive">*</span></label>
//               <input type="time" className={inputClass} value={form.actualStartTime}
//                 onChange={e => setForm(p => ({ ...p, actualStartTime: e.target.value }))} required />
//             </div>
//             <div>
//               <label className={labelClass}>وقت الانصراف الفعلي <span className="text-destructive">*</span></label>
//               <input type="time" className={inputClass} value={form.actualEndTime}
//                 onChange={e => setForm(p => ({ ...p, actualEndTime: e.target.value }))} required />
//             </div>
//           </div>

//           {error && <ErrorAlert message={error} />}

//           <button type="submit" className="navy-btn" disabled={loading}>
//             {loading ? 'جاري التسجيل...' : 'تسجيل الحضور'}
//           </button>
//         </form>

//         {result && (
//           <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
//             className="mt-6 p-5 rounded-xl border-2"
//             style={{ background: 'hsl(var(--navy) / 0.03)', borderColor: 'hsl(var(--navy) / 0.15)' }}>
//             <p className="font-cairo font-bold text-sm mb-4" style={{ color: 'hsl(var(--navy))' }}>
//               ✅ تم تسجيل الحضور بنجاح
//             </p>
//             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//               {result.lateMinutes !== undefined && (
//                 <div className="p-3 rounded-lg" style={{ background: result.lateMinutes > 0 ? 'hsl(0 84% 60% / 0.1)' : 'hsl(142 76% 36% / 0.1)' }}>
//                   <p className="text-xs text-muted-foreground font-cairo">دقائق التأخير</p>
//                   <p className="text-2xl font-bold mt-1" style={{ color: result.lateMinutes > 0 ? 'hsl(0 84% 60%)' : 'hsl(142 76% 36%)' }}>
//                     {result.lateMinutes}
//                   </p>
//                   <p className="text-xs text-muted-foreground">Late Minutes</p>
//                 </div>
//               )}
//               {result.overtimeMinutes !== undefined && (
//                 <div className="p-3 rounded-lg" style={{ background: 'hsl(43 96% 56% / 0.1)' }}>
//                   <p className="text-xs text-muted-foreground font-cairo">دقائق الإضافي</p>
//                   <p className="text-2xl font-bold mt-1" style={{ color: 'hsl(var(--gold-dark))' }}>
//                     {result.overtimeMinutes}
//                   </p>
//                   <p className="text-xs text-muted-foreground">Overtime Minutes</p>
//                 </div>
//               )}
//               {Object.entries(result).filter(([k]) => k !== 'lateMinutes' && k !== 'overtimeMinutes').map(([k, v]) => (
//                 <div key={k} className="p-3 rounded-lg border border-border">
//                   <p className="text-xs text-muted-foreground font-cairo">{k}</p>
//                   <p className="text-sm font-semibold mt-1 font-cairo">{String(v)}</p>
//                 </div>
//               ))}
//             </div>
//           </motion.div>
//         )}
//       </FormSection>
//     </div>
//   );
// }

//the code after adding and edit the features :

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Info, List, Upload, Download, Plus, AlertTriangle, UserX } from 'lucide-react';
import { PageHeader, FormSection, ErrorAlert, SuccessAlert, LoadingSpinner } from '@/components/UI';
import { postAttendance, getAttendanceDefaults, getEmployees, getAbsences, getBranches, createBranch, postAbsence, detectNoPunch, recordLeave, getVacationBalance, importAttendanceExcel, downloadAttendanceTemplate } from '@/lib/api';
import type { LeaveType } from '@/lib/api';
import { EmployeeOptionGroups, type EmployeeForSelect } from '@/components/EmployeeOptionGroups';

interface AttendanceDefaults { date?: string; officialStart?: string; officialEnd?: string; [key: string]: unknown; }
interface AttendanceResult { lateMinutes?: number; overtimeMinutes?: number; [key: string]: unknown; }
interface AbsenceRecord { id?: number; employeeName: string; date: string; absenceType: 'WITH_PERMISSION' | 'WITHOUT_PERMISSION'; deduction?: number; overtimeMinutes?: number; penaltyMultiplier?: number; }
interface NoPunchRecord { employeeName: string; date: string; alert: string; }
interface LeaveResult { employeeName: string; leaveType: string; workingDays: number; vacationBalanceUsed: number; remainingVacationBalance: number; payrollDeduction: number; affectedDates: string[]; message: string; }
interface ImportRecord { id?: number; employeeName: string; date: string; actualStart?: string; actualEnd?: string; lateMinutes?: number; overtimeMinutes?: number; deduction?: number; absenceStatus?: string; }

export default function Attendance() {
  const [employees, setEmployees] = useState<EmployeeForSelect[]>([]);
  const [defaults, setDefaults] = useState<AttendanceDefaults | null>(null);
  const [defaultsLoading, setDefaultsLoading] = useState(true);

  // Attendance form
  const [form, setForm] = useState({ employeeName: '', date: '', actualStartTime: '', actualEndTime: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AttendanceResult | null>(null);

  // Excel Import
  const [branches, setBranches] = useState<{ name: string }[]>([]);
  const [branchId, setBranchId] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchError, setBranchError] = useState('');
  const [importMode, setImportMode] = useState<'Daily' | 'Monthly'>('Daily');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [importResults, setImportResults] = useState<ImportRecord[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);

  // Absence records
  const [filterName, setFilterName] = useState('');
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [absListLoading, setAbsListLoading] = useState(false);
  const [absListError, setAbsListError] = useState('');

  // Absence recording form
  const [absForm, setAbsForm] = useState({
    employeeName: '', date: '', absenceType: 'WITHOUT_PERMISSION' as 'WITH_PERMISSION' | 'WITHOUT_PERMISSION', penaltyMultiplier: '1'
  });
  const [absLoading, setAbsLoading] = useState(false);
  const [absError, setAbsError] = useState('');
  const [absSuccess, setAbsSuccess] = useState('');

  // ── SAP Infotype 2001/2006 — Leave Entry ────────────────────────────────
  const [leaveForm, setLeaveForm] = useState({
    employeeName: '', startDate: '', endDate: '',
    leaveType: 'ANNUAL_LEAVE' as LeaveType,
    manualDeductionAmount: '', penaltyMultiplier: '1',
  });
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [leaveResult, setLeaveResult] = useState<LeaveResult | null>(null);
  const [vacationBalance, setVacationBalance] = useState<number | null>(null);

  // No-punch detection
  const [noPunchFrom, setNoPunchFrom] = useState('');
  const [noPunchTo, setNoPunchTo] = useState('');
  const [noPunchLoading, setNoPunchLoading] = useState(false);
  const [noPunchError, setNoPunchError] = useState('');
  const [noPunchResults, setNoPunchResults] = useState<NoPunchRecord[]>([]);

  useEffect(() => {
    Promise.allSettled([getEmployees(), getAttendanceDefaults(), getBranches()]).then(([empRes, defRes, branchRes]) => {
      if (empRes.status === 'fulfilled') {
        const empData = empRes.value.data;
        setEmployees(Array.isArray(empData) ? empData : empData?.content || empData?.data || []);
      }
      if (branchRes.status === 'fulfilled') {
        const bData = branchRes.value.data;
        setBranches(Array.isArray(bData) ? bData : []);
      }
      if (defRes.status === 'fulfilled') {
        const defData = defRes.value.data;
        if (typeof defData === 'string') {
          try { setDefaults(JSON.parse(defData)); } catch { setDefaults(null); }
        } else if (typeof defData === 'object' && !Array.isArray(defData)) {
          setDefaults(defData);
        } else {
          setDefaults(null);
        }
      }
      setDefaultsLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await postAttendance({
        employeeName: form.employeeName,
        date: form.date,
        actualStart: form.actualStartTime,
        actualEnd: form.actualEndTime,
      });
      setResult(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    setBranchError('');
    setBranchLoading(true);
    try {
      await createBranch({ name: newBranchName.trim() });
      const res = await getBranches();
      setBranches(Array.isArray(res.data) ? res.data : []);
      setNewBranchName('');
      setShowAddBranch(false);
    } catch (err: unknown) {
      setBranchError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setBranchLoading(false);
    }
  };

  const downloadTemplate = async () => {
    setTemplateLoading(true);
    try {
      const res = await downloadAttendanceTemplate();
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance_import_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'تعذر تحميل القالب');
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportError('');
    setImportSuccess('');
    setImportLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      fd.append('branchId', branchId);
      fd.append('importMode', importMode);
      const res = await importAttendanceExcel(fd);
      const summary = res.data;
      const records = Array.isArray(summary.imported) ? summary.imported : [];
      setImportResults(records as ImportRecord[]);
      setImportSuccess(
        `صفوف تمت قراءتها: ${summary.rowsRead} — تم الاستيراد: ${summary.rowsImported} — تخطي مكرر: ${summary.skippedDuplicate} — موظف غير معروف: ${summary.skippedInvalidEmployee} — أخرى: ${summary.skippedOther}`,
      );
      setImportFile(null);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'فشل الاستيراد');
    } finally {
      setImportLoading(false);
    }
  };

  const handleFetchAbsences = async () => {
    if (!filterName) return;
    setAbsListError('');
    setAbsListLoading(true);
    try {
      const res = await getAbsences(filterName);
      setAbsences(Array.isArray(res.data) ? res.data : []);
    } catch (err: unknown) {
      setAbsListError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setAbsListLoading(false);
    }
  };

  const handleRecordAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    setAbsError('');
    setAbsSuccess('');
    setAbsLoading(true);
    try {
      await postAbsence({
        employeeName: absForm.employeeName,
        date: absForm.date,
        absenceType: absForm.absenceType,
        penaltyMultiplier: absForm.absenceType === 'WITHOUT_PERMISSION' ? Number(absForm.penaltyMultiplier) : undefined,
      });
      setAbsSuccess(`تم تسجيل غياب ${absForm.employeeName} بتاريخ ${absForm.date} بنجاح`);
      setAbsForm(p => ({ ...p, employeeName: '', date: '' }));
    } catch (err: unknown) {
      setAbsError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setAbsLoading(false);
    }
  };

  // ── Leave entry handler (SAP Infotype 2001/2006) ────────────────────────
  const handleRecordLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveError('');
    setLeaveResult(null);
    setLeaveLoading(true);
    try {
      const payload: Record<string, unknown> = {
        employeeName: leaveForm.employeeName,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate || leaveForm.startDate,
        leaveType: leaveForm.leaveType,
      };
      if (leaveForm.leaveType === 'UNEXCUSED_ABSENCE' && leaveForm.penaltyMultiplier !== '1') {
        payload.penaltyMultiplier = Number(leaveForm.penaltyMultiplier);
      }
      if (leaveForm.leaveType === 'MANUAL_DEDUCTION') {
        payload.manualDeductionAmount = Number(leaveForm.manualDeductionAmount);
      }
      const res = await recordLeave(payload as Parameters<typeof recordLeave>[0]);
      setLeaveResult(res.data);
      // refresh displayed balance
      if (leaveForm.employeeName) {
        const balRes = await getVacationBalance(leaveForm.employeeName);
        setVacationBalance(balRes.data.vacationBalance);
      }
    } catch (err: unknown) {
      setLeaveError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleLeaveEmployeeChange = async (name: string) => {
    setLeaveForm(p => ({ ...p, employeeName: name }));
    setVacationBalance(null);
    if (name) {
      try {
        const res = await getVacationBalance(name);
        setVacationBalance(res.data.vacationBalance);
      } catch { /* ignore */ }
    }
  };

  const handleDetectNoPunch = async () => {
    if (!noPunchFrom || !noPunchTo) return;
    setNoPunchError('');
    setNoPunchLoading(true);
    try {
      const res = await detectNoPunch(noPunchFrom, noPunchTo);
      setNoPunchResults(Array.isArray(res.data) ? res.data : []);
    } catch (err: unknown) {
      setNoPunchError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setNoPunchLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-cairo";
  const labelClass = "block text-sm font-medium text-foreground font-cairo mb-1";

  return (
    <div className="space-y-6">
      <PageHeader title="الحضور والوقت" subtitle="تسجيل سجلات الحضور ومتابعة الأوقات" />

      {/* Today's Defaults */}
      <FormSection>
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5" style={{ color: 'hsl(var(--gold-dark))' }} />
          <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
            إعدادات الوقت الافتراضية
          </h3>
        </div>
        {defaultsLoading ? (
          <LoadingSpinner />
        ) : defaults ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(defaults)
              .filter(([, val]) => val !== null && val !== undefined)
              .map(([key, val]) => (
                <div key={key} className="p-3 rounded-lg" style={{ background: 'hsl(var(--navy) / 0.05)' }}>
                  <p className="text-xs text-muted-foreground font-cairo mb-1">{key}</p>
                  <p className="text-sm font-semibold font-cairo" style={{ color: 'hsl(var(--navy))' }}>
                    {String(val)}
                  </p>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground font-cairo">لا توجد إعدادات افتراضية</p>
        )}
      </FormSection>

      {/* Attendance Form */}
      <FormSection>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
          <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
            تسجيل الحضور
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>اسم الموظف <span className="text-destructive">*</span></label>
              <select className={inputClass} value={form.employeeName}
                onChange={e => setForm(p => ({ ...p, employeeName: e.target.value }))} required>
                <option value="">-- اختر الموظف --</option>
                <EmployeeOptionGroups employees={employees} />
              </select>
            </div>
            <div>
              <label className={labelClass}>التاريخ <span className="text-destructive">*</span></label>
              <input type="date" className={inputClass} value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
            </div>
            <div>
              <label className={labelClass}>وقت الحضور الفعلي <span className="text-destructive">*</span></label>
              <input type="time" className={inputClass} value={form.actualStartTime}
                onChange={e => setForm(p => ({ ...p, actualStartTime: e.target.value }))} required />
            </div>
            <div>
              <label className={labelClass}>وقت الانصراف الفعلي <span className="text-destructive">*</span></label>
              <input type="time" className={inputClass} value={form.actualEndTime}
                onChange={e => setForm(p => ({ ...p, actualEndTime: e.target.value }))} required />
            </div>
          </div>

          {error && <ErrorAlert message={error} />}

          <button type="submit" className="navy-btn" disabled={loading}>
            {loading ? 'جاري التسجيل...' : 'تسجيل الحضور'}
          </button>
        </form>

        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-5 rounded-xl border-2"
            style={{ background: 'hsl(var(--navy) / 0.03)', borderColor: 'hsl(var(--navy) / 0.15)' }}>
            <p className="font-cairo font-bold text-sm mb-4" style={{ color: 'hsl(var(--navy))' }}>
              ✅ تم تسجيل الحضور بنجاح
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {result.lateMinutes !== undefined && (
                <div className="p-3 rounded-lg"
                  style={{ background: result.lateMinutes > 0 ? 'hsl(0 84% 60% / 0.1)' : 'hsl(142 76% 36% / 0.1)' }}>
                  <p className="text-xs text-muted-foreground font-cairo">دقائق التأخير</p>
                  <p className="text-2xl font-bold mt-1"
                    style={{ color: result.lateMinutes > 0 ? 'hsl(0 84% 60%)' : 'hsl(142 76% 36%)' }}>
                    {result.lateMinutes}
                  </p>
                  <p className="text-xs text-muted-foreground">Late Minutes</p>
                </div>
              )}
              {result.overtimeMinutes !== undefined && (
                <div className="p-3 rounded-lg" style={{ background: 'hsl(43 96% 56% / 0.1)' }}>
                  <p className="text-xs text-muted-foreground font-cairo">دقائق الإضافي</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: 'hsl(var(--gold-dark))' }}>
                    {result.overtimeMinutes}
                  </p>
                  <p className="text-xs text-muted-foreground">Overtime Minutes</p>
                </div>
              )}
              {Object.entries(result)
                .filter(([k]) => k !== 'lateMinutes' && k !== 'overtimeMinutes')
                .map(([k, v]) => (
                  <div key={k} className="p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground font-cairo">{k}</p>
                    <p className="text-sm font-semibold mt-1 font-cairo">{String(v)}</p>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </FormSection>

      {/* ─── Excel Import ─── */}
      <FormSection>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
            <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
              استيراد الحضور (Excel)
            </h3>
          </div>
          <button type="button" onClick={() => void downloadTemplate()}
            disabled={templateLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-cairo border disabled:opacity-50"
            style={{ borderColor: 'hsl(var(--navy) / 0.2)', color: 'hsl(var(--navy))' }}>
            <Download className="w-4 h-4" />
            {templateLoading ? 'جاري التحميل...' : 'تحميل القالب / Download Template'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground font-cairo mb-3 max-w-3xl leading-relaxed">
          القالب يحتوي على أسماء الأعمدة المطلوبة، صف مثال، وورقة تعليمات. احفظ الملف كـ .xlsx ثم املأ ورقة
          Attendance وارفعها هنا. الصف التوضيحي يمكن حذفه أو استبداله قبل الاستيراد.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelClass.replace('mb-1', '')}>الفرع <span className="text-destructive">*</span></label>
              <button type="button" onClick={() => setShowAddBranch(v => !v)}
                className="flex items-center gap-1 text-xs font-cairo"
                style={{ color: 'hsl(var(--navy))' }}>
                <Plus className="w-3 h-3" />
                {showAddBranch ? 'إلغاء' : 'فرع جديد'}
              </button>
            </div>
            {showAddBranch && (
              <form onSubmit={handleAddBranch} className="flex gap-2 mb-2">
                <input className={inputClass} value={newBranchName} placeholder="اسم الفرع"
                  onChange={e => setNewBranchName(e.target.value)} required />
                <button type="submit" className="navy-btn text-xs px-3 whitespace-nowrap" disabled={branchLoading}>
                  {branchLoading ? '...' : 'حفظ'}
                </button>
              </form>
            )}
            {branchError && <p className="text-xs text-destructive font-cairo mb-1">{branchError}</p>}
            <select className={inputClass} value={branchId}
              onChange={e => setBranchId(e.target.value)} required>
              <option value="">-- اختر الفرع --</option>
              {branches.map((b, i) => (
                <option key={i} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>نوع الاستيراد</label>
            <select className={inputClass} value={importMode}
              onChange={e => setImportMode(e.target.value as 'Daily' | 'Monthly')}>
              <option value="Daily">يومي — Daily</option>
              <option value="Monthly">شهري — Monthly</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>ملف Excel <span className="text-destructive">*</span></label>
            <input type="file" accept=".xlsx,.xls" className={inputClass} required
              onChange={e => setImportFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>

        {importError && <ErrorAlert message={importError} />}
        {importSuccess && <SuccessAlert message={importSuccess} />}

        <button onClick={handleImport} className="navy-btn" disabled={importLoading || !importFile || !branchId}>
          {importLoading ? 'جاري الاستيراد...' : 'استيراد'}
        </button>

        {importResults.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الموظف</th>
                  <th>التاريخ</th>
                  <th>حضور</th>
                  <th>انصراف</th>
                  <th>ملاحظة</th>
                  <th>تأخير (د)</th>
                  <th style={{ color: 'hsl(0 84% 60%)' }}>الخصم</th>
                  <th style={{ color: 'hsl(142 76% 36%)' }}>الإضافي (د)</th>
                </tr>
              </thead>
              <tbody>
                {importResults.map((rec, i) => (
                  <tr key={i}>
                    <td className="text-muted-foreground">{i + 1}</td>
                    <td className="font-cairo font-medium">{rec.employeeName}</td>
                    <td>{rec.date}</td>
                    <td>{rec.actualStart ?? '—'}</td>
                    <td>{rec.actualEnd ?? '—'}</td>
                    <td className="font-cairo text-xs">{rec.absenceStatus ?? '—'}</td>
                    <td>{rec.lateMinutes ?? 0}</td>
                    <td className="font-cairo font-semibold"
                      style={{ color: (rec.deduction ?? 0) > 0 ? 'hsl(0 84% 60%)' : 'inherit' }}>
                      {Number(rec.deduction ?? 0).toFixed(2)}
                    </td>
                    <td className="font-cairo font-semibold"
                      style={{ color: (rec.overtimeMinutes ?? 0) > 0 ? 'hsl(142 76% 36%)' : 'inherit' }}>
                      {rec.overtimeMinutes ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </FormSection>

      {/* ─── Absence Records ─── */}
      <FormSection>
        <div className="flex items-center gap-2 mb-4">
          <List className="w-5 h-5" style={{ color: 'hsl(var(--gold-dark))' }} />
          <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
            سجل الغياب
          </h3>
        </div>

        <div className="flex gap-3 mb-4">
          <select className={inputClass} value={filterName}
            onChange={e => setFilterName(e.target.value)}>
            <option value="">-- اختر الموظف --</option>
            <EmployeeOptionGroups employees={employees} />
          </select>
          <button onClick={handleFetchAbsences} className="gold-btn whitespace-nowrap"
            disabled={!filterName || absListLoading}>
            {absListLoading ? 'جاري البحث...' : 'عرض السجل'}
          </button>
        </div>

        {absListError && <ErrorAlert message={absListError} />}

        {absences.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="overflow-x-auto rounded-lg border border-border">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الموظف</th>
                  <th>التاريخ</th>
                  <th>نوع الغياب</th>
                  <th style={{ color: 'hsl(0 84% 60%)' }}>الخصم</th>
                  <th style={{ color: 'hsl(142 76% 36%)' }}>الإضافي (د)</th>
                </tr>
              </thead>
              <tbody>
                {absences.map((abs, i) => (
                  <tr key={i}>
                    <td className="text-muted-foreground">{i + 1}</td>
                    <td className="font-cairo font-medium">{abs.employeeName}</td>
                    <td>{abs.date}</td>
                    <td>
                      <span className="px-2 py-1 rounded-full text-xs font-cairo font-medium"
                        style={{
                          background: abs.absenceType === 'WITH_PERMISSION'
                            ? 'hsl(142 76% 36% / 0.1)' : 'hsl(0 84% 60% / 0.1)',
                          color: abs.absenceType === 'WITH_PERMISSION'
                            ? 'hsl(142 76% 36%)' : 'hsl(0 84% 60%)',
                        }}>
                        {abs.absenceType === 'WITH_PERMISSION' ? 'بإذن ✅' : 'بدون إذن ❌'}
                      </span>
                    </td>
                    <td className="font-cairo font-semibold"
                      style={{ color: (abs.deduction ?? 0) > 0 ? 'hsl(0 84% 60%)' : 'inherit' }}>
                      {abs.deduction != null
                        ? Number(abs.deduction).toFixed(2)
                        : (abs.absenceType === 'WITH_PERMISSION' ? '0.00' : 'يوم كامل')}
                    </td>
                    <td className="font-cairo font-semibold"
                      style={{ color: (abs.overtimeMinutes ?? 0) > 0 ? 'hsl(142 76% 36%)' : 'inherit' }}>
                      {abs.overtimeMinutes ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {absences.length === 0 && filterName && !absListLoading && (
          <p className="text-sm text-muted-foreground font-cairo text-center py-4">
            لا توجد سجلات غياب لهذا الموظف
          </p>
        )}
      </FormSection>

      {/* ─── SAP Infotype 2001/2006 — Leave Entry ─── */}
      <FormSection>
        <div className="flex items-center gap-2 mb-4">
          <UserX className="w-5 h-5" style={{ color: 'hsl(0 84% 60%)' }} />
          <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
            تسجيل إجازة / غياب — Leave Entry (Infotype 2001)
          </h3>
        </div>

        <form onSubmit={handleRecordLeave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Employee selector */}
            <div>
              <label className={labelClass}>اسم الموظف <span className="text-destructive">*</span></label>
              <select className={inputClass} value={leaveForm.employeeName}
                onChange={e => handleLeaveEmployeeChange(e.target.value)} required>
                <option value="">-- اختر الموظف --</option>
                <EmployeeOptionGroups employees={employees} />
              </select>
              {vacationBalance !== null && (
                <p className="text-xs mt-1 font-cairo" style={{ color: vacationBalance <= 5 ? 'hsl(0 84% 60%)' : 'hsl(142 76% 36%)' }}>
                  رصيد الإجازة السنوية: <strong>{vacationBalance} يوم</strong>
                  {vacationBalance <= 5 && ' ⚠ رصيد منخفض'}
                </p>
              )}
            </div>

            {/* Leave Type dropdown — the 3 SAP Infotype 2001 options */}
            <div>
              <label className={labelClass}>نوع الإجازة / Leave Type <span className="text-destructive">*</span></label>
              <select className={inputClass} value={leaveForm.leaveType}
                onChange={e => setLeaveForm(p => ({ ...p, leaveType: e.target.value as LeaveType }))}>
                <option value="ANNUAL_LEAVE">إجازة سنوية — Annual Leave (يُخصم من الرصيد، بدون خصم مالي)</option>
                <option value="UNEXCUSED_ABSENCE">غياب بدون إذن — Unexcused Absence (خصم يومي من الراتب)</option>
                <option value="MANUAL_DEDUCTION">خصم إداري — Manual Deduction (مبلغ ثابت يحدده المدير)</option>
              </select>
            </div>

            {/* Date range */}
            <div>
              <label className={labelClass}>من تاريخ / From Date <span className="text-destructive">*</span></label>
              <input type="date" className={inputClass} value={leaveForm.startDate}
                onChange={e => setLeaveForm(p => ({ ...p, startDate: e.target.value, endDate: p.endDate || e.target.value }))} required />
            </div>
            <div>
              <label className={labelClass}>إلى تاريخ / To Date</label>
              <input type="date" className={inputClass} value={leaveForm.endDate}
                onChange={e => setLeaveForm(p => ({ ...p, endDate: e.target.value }))} />
              <p className="text-xs text-muted-foreground font-cairo mt-1">اتركه فارغاً ليوم واحد — الجمعة تُستثنى تلقائياً</p>
            </div>

            {/* Penalty multiplier — only for UNEXCUSED_ABSENCE */}
            {leaveForm.leaveType === 'UNEXCUSED_ABSENCE' && (
              <div>
                <label className={labelClass}>معامل الجزاء / Penalty Multiplier</label>
                <select className={inputClass} value={leaveForm.penaltyMultiplier}
                  onChange={e => setLeaveForm(p => ({ ...p, penaltyMultiplier: e.target.value }))}>
                  <option value="1">1× – خصم يوم واحد (Standard)</option>
                  <option value="2">2× – خصم يومان (Egyptian Labour Law)</option>
                </select>
              </div>
            )}

            {/* Manual amount — only for MANUAL_DEDUCTION */}
            {leaveForm.leaveType === 'MANUAL_DEDUCTION' && (
              <div>
                <label className={labelClass}>مبلغ الخصم (جنيه) <span className="text-destructive">*</span></label>
                <input type="number" min="0.01" step="0.01" className={inputClass}
                  placeholder="مثال: 200.00"
                  value={leaveForm.manualDeductionAmount}
                  onChange={e => setLeaveForm(p => ({ ...p, manualDeductionAmount: e.target.value }))} required />
                <p className="text-xs text-muted-foreground font-cairo mt-1">سيُخصم هذا المبلغ كاملاً من راتب الشهر القادم</p>
              </div>
            )}
          </div>

          {leaveError && <ErrorAlert message={leaveError} />}

          {/* Leave entry result summary */}
          {leaveResult && (
            <div className="rounded-lg border p-4 space-y-2 text-sm font-cairo" style={{ borderColor: 'hsl(var(--gold))', background: 'hsl(43 96% 98%)' }}>
              <p className="font-bold" style={{ color: 'hsl(var(--navy))' }}>✅ تم تسجيل الإجازة بنجاح</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="text-muted-foreground">أيام العمل المتأثرة:</span>
                <span className="font-semibold">{leaveResult.workingDays} يوم (الجمعة مستثناة)</span>
                {leaveResult.vacationBalanceUsed > 0 && <>
                  <span className="text-muted-foreground">تم خصم من الرصيد:</span>
                  <span className="font-semibold">{leaveResult.vacationBalanceUsed} يوم</span>
                  <span className="text-muted-foreground">الرصيد المتبقي:</span>
                  <span className="font-semibold" style={{ color: leaveResult.remainingVacationBalance <= 5 ? 'hsl(0 84% 60%)' : 'hsl(142 76% 36%)' }}>
                    {leaveResult.remainingVacationBalance} يوم
                  </span>
                </>}
                {leaveResult.payrollDeduction > 0 && <>
                  <span className="text-muted-foreground">خصم مالي من الراتب:</span>
                  <span className="font-semibold" style={{ color: 'hsl(0 84% 60%)' }}>
                    {leaveResult.payrollDeduction.toFixed(2)} ج.م
                  </span>
                </>}
                {leaveResult.payrollDeduction === 0 && leaveResult.leaveType === 'ANNUAL_LEAVE' && <>
                  <span className="text-muted-foreground">الأثر المالي:</span>
                  <span className="font-semibold" style={{ color: 'hsl(142 76% 36%)' }}>بدون خصم — مدفوع</span>
                </>}
              </div>
              {leaveResult.message && (
                <p className="text-xs mt-1" style={{ color: 'hsl(43 96% 40%)' }}>{leaveResult.message}</p>
              )}
            </div>
          )}

          <button type="submit" className="navy-btn" disabled={leaveLoading}>
            {leaveLoading ? <LoadingSpinner /> : 'تسجيل الإجازة / Record Leave'}
          </button>
        </form>
      </FormSection>

      {/* ─── No-Punch Alert ─── */}
      <FormSection>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5" style={{ color: 'hsl(43 96% 56%)' }} />
          <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
            تنبيه الغياب بدون تسجيل / No-Punch Alert
          </h3>
        </div>
        <p className="text-sm text-muted-foreground font-cairo mb-4">
          فحص الموظفين الذين لم يسجلوا حضوراً ولم يُسجل لهم غياب في الفترة المحددة (الجمعة مستثناة).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={labelClass}>من تاريخ</label>
            <input type="date" className={inputClass} value={noPunchFrom}
              onChange={e => setNoPunchFrom(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>إلى تاريخ</label>
            <input type="date" className={inputClass} value={noPunchTo}
              onChange={e => setNoPunchTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={handleDetectNoPunch} className="gold-btn w-full"
              disabled={!noPunchFrom || !noPunchTo || noPunchLoading}>
              {noPunchLoading ? 'جاري الفحص...' : 'فحص الآن'}
            </button>
          </div>
        </div>

        {noPunchError && <ErrorAlert message={noPunchError} />}

        {noPunchResults.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="overflow-x-auto rounded-lg border border-border">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الموظف</th>
                  <th>التاريخ</th>
                  <th>التنبيه</th>
                </tr>
              </thead>
              <tbody>
                {noPunchResults.map((rec, i) => (
                  <tr key={i}>
                    <td className="text-muted-foreground">{i + 1}</td>
                    <td className="font-cairo font-medium">{rec.employeeName}</td>
                    <td>{rec.date}</td>
                    <td>
                      <span className="px-2 py-1 rounded-full text-xs font-medium font-cairo"
                        style={{ background: 'hsl(0 84% 60% / 0.1)', color: 'hsl(0 84% 60%)' }}>
                        {rec.alert}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {noPunchResults.length === 0 && noPunchFrom && noPunchTo && !noPunchLoading && (
          <p className="text-sm text-muted-foreground font-cairo text-center py-4">
            ✅ لا يوجد موظفون بدون تسجيل في هذه الفترة
          </p>
        )}
      </FormSection>
    </div>
  );
}