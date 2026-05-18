// import { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { DollarSign, CreditCard, Plus, Trash2 } from 'lucide-react';
// import { PageHeader, FormSection, ErrorAlert, SuccessAlert, LoadingSpinner } from '@/components/UI';
// import { calculatePayroll, createLoan, getEmployees } from '@/lib/api';

// interface PayrollResult { finalSalary?: number; [key: string]: unknown; }
// interface LoanInstallment { monthName: string; dueDate: string; amount: string; }

// export default function Payroll() {
//   const [employees, setEmployees] = useState<{ name: string }[]>([]);
//   const [empLoading, setEmpLoading] = useState(true);

//   // Payroll
//   const [payForm, setPayForm] = useState({ employeeName: '', year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
//   const [payLoading, setPayLoading] = useState(false);
//   const [payError, setPayError] = useState('');
//   const [payResult, setPayResult] = useState<PayrollResult | null>(null);

//   // Loans
//   const [loanMode, setLoanMode] = useState<'default' | 'custom'>('default');
//   const [loanForm, setLoanForm] = useState({ employeeName: '', totalAmount: '' });
//   const [installments, setInstallments] = useState<LoanInstallment[]>([
//     { monthName: '', dueDate: '', amount: '' }
//   ]);
//   const [loanLoading, setLoanLoading] = useState(false);
//   const [loanError, setLoanError] = useState('');
//   const [loanSuccess, setLoanSuccess] = useState('');

//   useEffect(() => {
//     getEmployees().then(res => {
//   const empData = res.data;
//   setEmployees(Array.isArray(empData) ? empData : empData?.content || empData?.data || []);
//       setEmpLoading(false);
//     }).catch(() => setEmpLoading(false));
//   }, []);

//   const handlePayroll = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setPayError('');
//     setPayResult(null);
//     setPayLoading(true);
//     try {
//       const res = await calculatePayroll(payForm.employeeName, payForm.year, payForm.month);
//       setPayResult(res.data);
//     } catch (err: unknown) {
//       setPayError(err instanceof Error ? err.message : 'حدث خطأ');
//     } finally {
//       setPayLoading(false);
//     }
//   };

//   const handleLoan = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoanError('');
//     setLoanSuccess('');
//     setLoanLoading(true);
//     try {
//       const body = loanMode === 'default'
//         ? { totalAmount: Number(loanForm.totalAmount) }
//         : {
//             totalAmount: Number(loanForm.totalAmount),
//             customInstallments: installments.map(i => ({ ...i, amount: Number(i.amount) }))
//           };
//       await createLoan(loanForm.employeeName, body);
//       setLoanSuccess('تم إنشاء القرض بنجاح! / Loan created successfully!');
//       setLoanForm({ employeeName: '', totalAmount: '' });
//       setInstallments([{ monthName: '', dueDate: '', amount: '' }]);
//     } catch (err: unknown) {
//       setLoanError(err instanceof Error ? err.message : 'حدث خطأ');
//     } finally {
//       setLoanLoading(false);
//     }
//   };

//   const addInstallment = () => setInstallments(p => [...p, { monthName: '', dueDate: '', amount: '' }]);
//   const removeInstallment = (i: number) => setInstallments(p => p.filter((_, idx) => idx !== i));
//   const updateInstallment = (i: number, field: keyof LoanInstallment, val: string) =>
//     setInstallments(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

//   const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-cairo";
//   const labelClass = "block text-sm font-medium text-foreground font-cairo mb-1";

//   const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

//   return (
//     <div className="space-y-6">
//       <PageHeader title="الرواتب والقروض" titleEn="Payroll & Loans" subtitle="احتساب الرواتب وإدارة القروض والأقساط" />

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Payroll Calculator */}
//         <div className="space-y-4">
//           <FormSection>
//             <div className="flex items-center gap-2 mb-4">
//               <DollarSign className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
//               <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>احتساب الراتب / Calculate Payroll</h3>
//             </div>

//             {empLoading ? <LoadingSpinner /> : (
//               <form onSubmit={handlePayroll} className="space-y-4">
//                 <div>
//                   <label className={labelClass}>اسم الموظف <span className="text-destructive">*</span></label>
//                   <select className={inputClass} value={payForm.employeeName}
//                     onChange={e => setPayForm(p => ({ ...p, employeeName: e.target.value }))} required>
//                     <option value="">-- اختر الموظف --</option>
//                     {employees.map((emp, i) => <option key={i} value={emp.name}>{emp.name}</option>)}
//                   </select>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className={labelClass}>السنة <span className="text-destructive">*</span></label>
//                     <input type="number" className={inputClass} value={payForm.year} min={2000} max={2100}
//                       onChange={e => setPayForm(p => ({ ...p, year: Number(e.target.value) }))} required />
//                   </div>
//                   <div>
//                     <label className={labelClass}>الشهر <span className="text-destructive">*</span></label>
//                     <select className={inputClass} value={payForm.month}
//                       onChange={e => setPayForm(p => ({ ...p, month: Number(e.target.value) }))} required>
//                       {months.map((m, i) => <option key={i} value={i + 1}>{m} ({i + 1})</option>)}
//                     </select>
//                   </div>
//                 </div>
//                 {payError && <ErrorAlert message={payError} />}
//                 <button type="submit" className="navy-btn w-full" disabled={payLoading}>
//                   {payLoading ? 'جاري الاحتساب...' : 'احتساب الراتب'}
//                 </button>
//               </form>
//             )}
//           </FormSection>

//           {/* Payroll Result */}
//           {payResult && (
//             <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
//               <FormSection>
//                 <p className="font-cairo font-bold text-sm mb-4" style={{ color: 'hsl(var(--navy))' }}>
//                   📊 تفاصيل الراتب / Salary Breakdown
//                 </p>
//                 {payResult.finalSalary !== undefined && (
//                   <div className="p-4 rounded-xl mb-4 text-center"
//                     style={{ background: 'var(--gradient-hero)' }}>
//                     <p className="text-sm text-white/70 font-cairo">صافي الراتب / Net Salary</p>
//                     <p className="text-3xl font-bold text-white mt-1">
//                       {Number(payResult.finalSalary).toLocaleString('ar-SA')} <span className="text-lg">ريال</span>
//                     </p>
//                   </div>
//                 )}
//                 <div className="space-y-2">
//                   {Object.entries(payResult).filter(([k]) => k !== 'finalSalary').map(([key, val]) => (
//                     <div key={key} className="flex justify-between items-center py-2 border-b border-border last:border-0">
//                       <span className="text-sm text-muted-foreground font-cairo">{key}</span>
//                       <span className="text-sm font-semibold font-cairo" style={{ color: 'hsl(var(--navy))' }}>{String(val)}</span>
//                     </div>
//                   ))}
//                 </div>
//               </FormSection>
//             </motion.div>
//           )}
//         </div>

//         {/* Loans */}
//         <FormSection>
//           <div className="flex items-center gap-2 mb-4">
//             <CreditCard className="w-5 h-5" style={{ color: 'hsl(var(--gold-dark))' }} />
//             <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>إنشاء قرض / Create Loan</h3>
//           </div>

//           {/* Mode Toggle */}
//           <div className="flex rounded-lg border border-border overflow-hidden mb-4">
//             <button type="button"
//               className={`flex-1 py-2 text-sm font-cairo font-medium transition-colors ${loanMode === 'default' ? 'text-white' : 'text-muted-foreground hover:bg-muted'}`}
//               style={loanMode === 'default' ? { background: 'hsl(var(--navy))' } : {}}
//               onClick={() => setLoanMode('default')}>
//               أقساط متساوية (12 شهر)
//             </button>
//             <button type="button"
//               className={`flex-1 py-2 text-sm font-cairo font-medium transition-colors ${loanMode === 'custom' ? 'text-white' : 'text-muted-foreground hover:bg-muted'}`}
//               style={loanMode === 'custom' ? { background: 'hsl(var(--navy))' } : {}}
//               onClick={() => setLoanMode('custom')}>
//               أقساط مخصصة
//             </button>
//           </div>

//           {loanSuccess && <SuccessAlert message={loanSuccess} />}
//           {loanError && <ErrorAlert message={loanError} />}

//           {empLoading ? <LoadingSpinner /> : (
//             <form onSubmit={handleLoan} className="space-y-4">
//               <div>
//                 <label className={labelClass}>اسم الموظف <span className="text-destructive">*</span></label>
//                 <select className={inputClass} value={loanForm.employeeName}
//                   onChange={e => setLoanForm(p => ({ ...p, employeeName: e.target.value }))} required>
//                   <option value="">-- اختر الموظف --</option>
//                   {employees.map((emp, i) => <option key={i} value={emp.name}>{emp.name}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <label className={labelClass}>إجمالي مبلغ القرض (ريال) <span className="text-destructive">*</span></label>
//                 <input type="number" className={inputClass} value={loanForm.totalAmount} placeholder="0.00" min={0}
//                   onChange={e => setLoanForm(p => ({ ...p, totalAmount: e.target.value }))} required />
//               </div>

//               {loanMode === 'custom' && (
//                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
//                   <div className="flex items-center justify-between">
//                     <p className="text-sm font-semibold font-cairo" style={{ color: 'hsl(var(--navy))' }}>الأقساط المخصصة</p>
//                     <button type="button" onClick={addInstallment} className="flex items-center gap-1 text-xs gold-btn px-3 py-1.5">
//                       <Plus className="w-3 h-3" /> إضافة قسط
//                     </button>
//                   </div>
//                   {installments.map((inst, i) => (
//                     <div key={i} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
//                       <div className="flex items-center justify-between">
//                         <span className="text-xs font-cairo text-muted-foreground">قسط #{i + 1}</span>
//                         {installments.length > 1 && (
//                           <button type="button" onClick={() => removeInstallment(i)}
//                             className="text-destructive hover:bg-destructive/10 rounded p-1">
//                             <Trash2 className="w-3 h-3" />
//                           </button>
//                         )}
//                       </div>
//                       <div className="grid grid-cols-3 gap-2">
//                         <div>
//                           <input className={inputClass} placeholder="اسم الشهر" value={inst.monthName}
//                             onChange={e => updateInstallment(i, 'monthName', e.target.value)} required />
//                         </div>
//                         <div>
//                           <input type="date" className={inputClass} value={inst.dueDate}
//                             onChange={e => updateInstallment(i, 'dueDate', e.target.value)} required />
//                         </div>
//                         <div>
//                           <input type="number" className={inputClass} placeholder="المبلغ" value={inst.amount}
//                             onChange={e => updateInstallment(i, 'amount', e.target.value)} required min={0} />
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </motion.div>
//               )}

//               <button type="submit" className="gold-btn w-full" disabled={loanLoading}>
//                 {loanLoading ? 'جاري الإنشاء...' : 'إنشاء القرض'}
//               </button>
//             </form>
//           )}
//         </FormSection>
//       </div>
//     </div>
//   );
// }


// the old code before editing
// import { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { DollarSign, CreditCard, Plus, Trash2 } from 'lucide-react';
// import { PageHeader, FormSection, ErrorAlert, SuccessAlert, LoadingSpinner } from '@/components/UI';
// import { calculatePayroll, createLoan, getEmployees } from '@/lib/api';

// interface PayrollResult { finalSalary?: number; employee?: { name: string; baseSalary: number }; [key: string]: unknown; }
// interface LoanInstallment { monthName: string; dueDate: string; amount: string; }

// export default function Payroll() {
//   const [employees, setEmployees] = useState<{ name: string }[]>([]);
//   const [empLoading, setEmpLoading] = useState(true);

//   const [payForm, setPayForm] = useState({ employeeName: '', year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
//   const [payLoading, setPayLoading] = useState(false);
//   const [payError, setPayError] = useState('');
//   const [payResult, setPayResult] = useState<PayrollResult | null>(null);

//   const [loanMode, setLoanMode] = useState<'default' | 'custom'>('default');
//   const [loanForm, setLoanForm] = useState({ employeeName: '', totalAmount: '' });
//   const [installments, setInstallments] = useState<LoanInstallment[]>([
//     { monthName: '', dueDate: '', amount: '' }
//   ]);
//   const [loanLoading, setLoanLoading] = useState(false);
//   const [loanError, setLoanError] = useState('');
//   const [loanSuccess, setLoanSuccess] = useState('');

//   useEffect(() => {
//     getEmployees().then(res => {
//       const empData = res.data;
//       setEmployees(Array.isArray(empData) ? empData : empData?.content || empData?.data || []);
//       setEmpLoading(false);
//     }).catch(() => setEmpLoading(false));
//   }, []);

//   const handlePayroll = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setPayError('');
//     setPayResult(null);
//     setPayLoading(true);
//     try {
//       const res = await calculatePayroll(payForm.employeeName, payForm.year, payForm.month);
//       setPayResult(res.data);
//     } catch (err: unknown) {
//       setPayError(err instanceof Error ? err.message : 'حدث خطأ');
//     } finally {
//       setPayLoading(false);
//     }
//   };

//   const handleLoan = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoanError('');
//     setLoanSuccess('');
//     setLoanLoading(true);
//     try {
//       const body = loanMode === 'default'
//         ? { totalAmount: Number(loanForm.totalAmount), customInstallments: null }
//         : {
//             totalAmount: Number(loanForm.totalAmount),
//             customInstallments: installments.map(i => ({
//               monthName: i.monthName,
//               dueDate: i.dueDate,
//               amount: Number(i.amount)
//             }))
//           };
//       await createLoan(loanForm.employeeName, body);
//       setLoanSuccess('تم إنشاء القرض بنجاح!');
//       setLoanForm({ employeeName: '', totalAmount: '' });
//       setInstallments([{ monthName: '', dueDate: '', amount: '' }]);
//     } catch (err: unknown) {
//       setLoanError(err instanceof Error ? err.message : 'حدث خطأ');
//     } finally {
//       setLoanLoading(false);
//     }
//   };

//   const addInstallment = () => setInstallments(p => [...p, { monthName: '', dueDate: '', amount: '' }]);
//   const removeInstallment = (i: number) => setInstallments(p => p.filter((_, idx) => idx !== i));
//   const updateInstallment = (i: number, field: keyof LoanInstallment, val: string) =>
//     setInstallments(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

//   const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-cairo";
//   const labelClass = "block text-sm font-medium text-foreground font-cairo mb-1";
//   const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

//   return (
//     <div className="space-y-6">
//       <PageHeader title="الرواتب والقروض" subtitle="احتساب الرواتب وإدارة القروض والأقساط" />

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Payroll Calculator */}
//         <div className="space-y-4">
//           <FormSection>
//             <div className="flex items-center gap-2 mb-4">
              
//               <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>احتساب الراتب</h3>
//             </div>

//             {empLoading ? <LoadingSpinner /> : (
//               <form onSubmit={handlePayroll} className="space-y-4">
//                 <div>
//                   <label className={labelClass}>اسم الموظف <span className="text-destructive">*</span></label>
//                   <select className={inputClass} value={payForm.employeeName}
//                     onChange={e => setPayForm(p => ({ ...p, employeeName: e.target.value }))} required>
//                     <option value="">-- اختر الموظف --</option>
//                     {employees.map((emp, i) => <option key={i} value={emp.name}>{emp.name}</option>)}
//                   </select>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className={labelClass}>السنة <span className="text-destructive">*</span></label>
//                     <input type="number" className={inputClass} value={payForm.year} min={2000} max={2100}
//                       onChange={e => setPayForm(p => ({ ...p, year: Number(e.target.value) }))} required />
//                   </div>
//                   <div>
//                     <label className={labelClass}>الشهر <span className="text-destructive">*</span></label>
//                     <select className={inputClass} value={payForm.month}
//                       onChange={e => setPayForm(p => ({ ...p, month: Number(e.target.value) }))} required>
//                       {months.map((m, i) => <option key={i} value={i + 1}>{m} ({i + 1})</option>)}
//                     </select>
//                   </div>
//                 </div>
//                 {payError && <ErrorAlert message={payError} />}
//                 <button type="submit" className="navy-btn w-full" disabled={payLoading}>
//                   {payLoading ? 'جاري الاحتساب...' : 'احتساب الراتب'}
//                 </button>
//               </form>
//             )}
//           </FormSection>

//           {payResult && (
//             <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
//               <FormSection>
//                 <p className="font-cairo font-bold text-sm mb-4" style={{ color: 'hsl(var(--navy))' }}>
//                   📊 تفاصيل الراتب
//                 </p>
//                 {payResult.finalSalary !== undefined && (
//                   <div className="p-4 rounded-xl mb-4 text-center" style={{ background: 'var(--gradient-hero)' }}>
//                     <p className="text-sm text-white/70 font-cairo">صافي الراتب</p>
//                     <p className="text-3xl font-bold text-white mt-1">
//                       {Number(payResult.finalSalary).toLocaleString('ar-EG')} <span className="text-lg">جنيه</span>
//                     </p>
//                   </div>
//                 )}
//                 <div className="space-y-2">
//                   {Object.entries(payResult)
//                     .filter(([k]) => k !== 'finalSalary' && k !== 'employee')
//                     .map(([key, val]) => (
//                       <div key={key} className="flex justify-between items-center py-2 border-b border-border last:border-0">
//                         <span className="text-sm text-muted-foreground font-cairo">{key}</span>
//                         <span className="text-sm font-semibold font-cairo" style={{ color: 'hsl(var(--navy))' }}>
//                           {typeof val === 'object' ? JSON.stringify(val) : String(val)}
//                         </span>
//                       </div>
//                     ))}
//                 </div>
//               </FormSection>
//             </motion.div>
//           )}
//         </div>

//         {/* Loans */}
//         <FormSection>
//           <div className="flex items-center gap-2 mb-4">
//             <CreditCard className="w-5 h-5" style={{ color: 'hsl(var(--gold-dark))' }} />
//             <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>إنشاء قرض</h3>
//           </div>

//           <div className="flex rounded-lg border border-border overflow-hidden mb-4">
//             <button type="button"
//               className={`flex-1 py-2 text-sm font-cairo font-medium transition-colors ${loanMode === 'default' ? 'text-white' : 'text-muted-foreground hover:bg-muted'}`}
//               style={loanMode === 'default' ? { background: 'hsl(var(--navy))' } : {}}
//               onClick={() => setLoanMode('default')}>
//               أقساط متساوية (12 شهر)
//             </button>
//             <button type="button"
//               className={`flex-1 py-2 text-sm font-cairo font-medium transition-colors ${loanMode === 'custom' ? 'text-white' : 'text-muted-foreground hover:bg-muted'}`}
//               style={loanMode === 'custom' ? { background: 'hsl(var(--navy))' } : {}}
//               onClick={() => setLoanMode('custom')}>
//               أقساط مخصصة
//             </button>
//           </div>

//           {loanSuccess && <SuccessAlert message={loanSuccess} />}
//           {loanError && <ErrorAlert message={loanError} />}

//           {empLoading ? <LoadingSpinner /> : (
//             <form onSubmit={handleLoan} className="space-y-4">
//               <div>
//                 <label className={labelClass}>اسم الموظف <span className="text-destructive">*</span></label>
//                 <select className={inputClass} value={loanForm.employeeName}
//                   onChange={e => setLoanForm(p => ({ ...p, employeeName: e.target.value }))} required>
//                   <option value="">-- اختر الموظف --</option>
//                   {employees.map((emp, i) => <option key={i} value={emp.name}>{emp.name}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <label className={labelClass}>إجمالي مبلغ القرض <span className="text-destructive">*</span></label>
//                 <input type="number" className={inputClass} value={loanForm.totalAmount} placeholder="0.00" min={0}
//                   onChange={e => setLoanForm(p => ({ ...p, totalAmount: e.target.value }))} required />
//               </div>

//               {loanMode === 'custom' && (
//                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
//                   <div className="flex items-center justify-between">
//                     <p className="text-sm font-semibold font-cairo" style={{ color: 'hsl(var(--navy))' }}>الأقساط المخصصة</p>
//                     <button type="button" onClick={addInstallment} className="flex items-center gap-1 text-xs gold-btn px-3 py-1.5">
//                       <Plus className="w-3 h-3" /> إضافة قسط
//                     </button>
//                   </div>
//                   {installments.map((inst, i) => (
//                     <div key={i} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
//                       <div className="flex items-center justify-between">
//                         <span className="text-xs font-cairo text-muted-foreground">قسط #{i + 1}</span>
//                         {installments.length > 1 && (
//                           <button type="button" onClick={() => removeInstallment(i)}
//                             className="text-destructive hover:bg-destructive/10 rounded p-1">
//                             <Trash2 className="w-3 h-3" />
//                           </button>
//                         )}
//                       </div>
//                       <div className="grid grid-cols-3 gap-2">
//                         <input className={inputClass} placeholder="اسم الشهر" value={inst.monthName}
//                           onChange={e => updateInstallment(i, 'monthName', e.target.value)} />
//                         <input type="date" className={inputClass} value={inst.dueDate}
//                           onChange={e => updateInstallment(i, 'dueDate', e.target.value)} required />
//                         <input type="number" className={inputClass} placeholder="المبلغ" value={inst.amount}
//                           onChange={e => updateInstallment(i, 'amount', e.target.value)} required min={0} />
//                       </div>
//                     </div>
//                   ))}
//                 </motion.div>
//               )}

//               <button type="submit" className="gold-btn w-full" disabled={loanLoading}>
//                 {loanLoading ? 'جاري الإنشاء...' : 'إنشاء القرض'}
//               </button>
//             </form>
//           )}
//         </FormSection>
//       </div>
//     </div>
//   );
// }



import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, Trash2, ShieldAlert, List, FileText, Download, ChevronDown, ChevronUp, Calculator, Lock, AlertTriangle, Building2, Banknote, RefreshCw, X } from 'lucide-react';
import { PageHeader, FormSection, ErrorAlert, SuccessAlert, LoadingSpinner } from '@/components/UI';
import {
  calculatePayroll, createLoan, getEmployees,
  postDisciplinary, getDisciplinary,
  getPaySlip, exportPaySlip, getTaxBreakdown,
  lockPayrollPeriod, downloadBankTransfer, getCalculationLog,
  getEmployeeLoans, recordCashPayment, getSettlementBalance
} from '@/lib/api';
import { exportPayStub, type PayStubData } from '@/lib/xlsx-export';
import { EmployeeOptionGroups, type EmployeeForSelect } from '@/components/EmployeeOptionGroups';

interface PayrollResult { finalSalary?: number; employee?: { name: string; baseSalary: number }; [key: string]: unknown; }
interface LoanInstallmentForm { monthName: string; dueDate: string; amount: string; }
interface DisciplinaryRecord { id?: number; employeeName: string; amount: number; reason: string; date: string; }

interface LoanRecord {
  id: number;
  loanType: 'SALARY_ADVANCE' | 'COMPANY_LOAN';
  totalAmount: number;
  monthlyInstallment: number;
  remainingBalance: number;
  repaymentStartDate: string;
  closed: boolean;
  createdAt: string;
  installments: { id: number; month: string; monthName: string; amount: number; paid: boolean }[];
}

interface TaxSlabDetail {
  slabLabel: string;
  rangeFrom: number;
  rangeTo: number | null;
  rate: number;
  amountInRange: number;
  taxOnSlab: number;
}
interface TaxBreakdownData {
  grossSalary: number;
  hasSocialInsurance: boolean;
  siBase: number;
  siEmployeeDeduction: number;
  siCompanyCost: number;
  latePenalties: number;
  monthlyTaxableIncome: number;
  projectedAnnualIncome: number;
  annualAfterExemption: number;
  slabs: TaxSlabDetail[];
  totalAnnualTax: number;
  monthlyTax: number;
  martyrsFundDeduction: number;
  totalStatutoryDeductions: number;
}

const payrollFieldLabels: Record<string, string> = {
  id: 'رقم السجل', month: 'الشهر', workedDays: 'أيام العمل',
  salaryPerMinute: 'الراتب في الدقيقة', bonus: 'مكافأة',
  overtimePay: 'بدل إضافي', lateDeduction: 'خصم التأخير',
  leaveEarlyDeduction: 'خصم المغادرة المبكرة',
  loanDeduction: 'خصم القرض', penalties: 'غرامات',
  socialInsurance: 'التأمين الاجتماعي', absenceDeduction: 'خصم الغياب',
  incomeTax: 'ضريبة الدخل', martyrsFundDeduction: 'صندوق الشهداء',
  arrears: 'مستحقات متأخرة', allowances: 'بدلات',
};
const translatePayrollKey = (key: string) => payrollFieldLabels[key] || key;

const fmt = (n: number) => Number(n ?? 0).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (r: number) => `${(r * 100).toFixed(1)}%`;

export default function Payroll() {
  const [employees, setEmployees] = useState<EmployeeForSelect[]>([]);
  const [empLoading, setEmpLoading] = useState(true);
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  // ── Payroll ──────────────────────────────────────────────────────────────
  const [payForm, setPayForm] = useState({
    employeeName: '', year: new Date().getFullYear(), month: new Date().getMonth() + 1
  });
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');
  const [payResult, setPayResult] = useState<PayrollResult | null>(null);

  // ── Preview Modal ────────────────────────────────────────────────────────
  const [showPayModal, setShowPayModal] = useState(false);

  // ── Pay Slip ─────────────────────────────────────────────────────────────
  const [paySlip, setPaySlip] = useState<any>(null);
  const [paySlipLoading, setPaySlipLoading] = useState(false);
  const [paySlipError, setPaySlipError] = useState('');
  const [exportingSlip, setExportingSlip] = useState(false);
  const [showTaxLog, setShowTaxLog] = useState(false);
  const [taxBreakdown, setTaxBreakdown] = useState<TaxBreakdownData | null>(null);
  const [taxLogLoading, setTaxLogLoading] = useState(false);
  const [showCalcTrace, setShowCalcTrace] = useState(false);
  const [calcTrace, setCalcTrace] = useState('');
  const [calcTraceLoading, setCalcTraceLoading] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [lockSuccess, setLockSuccess] = useState('');
  const [lockError, setLockError] = useState('');
  const [bankTransferLoading, setBankTransferLoading] = useState(false);

  // ── Loans ────────────────────────────────────────────────────────────────
  const [loanMode, setLoanMode] = useState<'default' | 'custom'>('default');
  const [loanForm, setLoanForm] = useState({
    employeeName: '', totalAmount: '', loanType: 'COMPANY_LOAN',
    monthlyInstallment: '', repaymentStartDate: '',
  });
  const [installments, setInstallments] = useState<LoanInstallmentForm[]>([
    { monthName: '', dueDate: '', amount: '' }
  ]);
  const [loanLoading, setLoanLoading] = useState(false);
  const [loanError, setLoanError] = useState('');
  const [loanSuccess, setLoanSuccess] = useState('');
  const [employeeLoans, setEmployeeLoans] = useState<LoanRecord[]>([]);
  const [loansLoading, setLoansLoading] = useState(false);
  const [cashPaymentLoanId, setCashPaymentLoanId] = useState<number | null>(null);
  const [cashPaymentAmount, setCashPaymentAmount] = useState('');
  const [cashPaymentLoading, setCashPaymentLoading] = useState(false);
  const [settlementBalance, setSettlementBalance] = useState<number | null>(null);

  // ── Disciplinary ─────────────────────────────────────────────────────────
  const [discForm, setDiscForm] = useState({ employeeName: '', amount: '', reason: '', date: '' });
  const [discLoading, setDiscLoading] = useState(false);
  const [discError, setDiscError] = useState('');
  const [discSuccess, setDiscSuccess] = useState('');
  const [discFilterName, setDiscFilterName] = useState('');
  const [discRecords, setDiscRecords] = useState<DisciplinaryRecord[]>([]);
  const [discListLoading, setDiscListLoading] = useState(false);
  const [discListError, setDiscListError] = useState('');

  useEffect(() => {
    getEmployees().then(res => {
      const empData = res.data;
      setEmployees(Array.isArray(empData) ? empData : empData?.content || empData?.data || []);
      setEmpLoading(false);
    }).catch(() => setEmpLoading(false));
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handlePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(''); setPayResult(null); setPaySlip(null);
    setPayLoading(true);
    try {
      const res = await calculatePayroll(payForm.employeeName, payForm.year, payForm.month);
      setPayResult(res.data);
      // Auto-fetch the structured pay slip so the preview modal is populated
      const slipRes = await getPaySlip(payForm.employeeName, payForm.year, payForm.month);
      setPaySlip(slipRes.data);
      setShowPayModal(true);
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setPayLoading(false);
    }
  };

  const handleGetPaySlip = async () => {
    if (!payForm.employeeName) return;
    setPaySlipError(''); setPaySlipLoading(true);
    try {
      const res = await getPaySlip(payForm.employeeName, payForm.year, payForm.month);
      setPaySlip(res.data);
    } catch (err: unknown) {
      setPaySlipError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setPaySlipLoading(false);
    }
  };

  const handleShowTaxLog = async () => {
    if (!payForm.employeeName) return;
    setShowTaxLog(v => !v);
    if (!taxBreakdown) {
      setTaxLogLoading(true);
      try {
        const res = await getTaxBreakdown(payForm.employeeName, payForm.year, payForm.month);
        setTaxBreakdown(res.data);
      } catch {
        // fall back to embedded breakdown from paySlip
        if (paySlip?.taxBreakdown) setTaxBreakdown(paySlip.taxBreakdown);
      } finally {
        setTaxLogLoading(false);
      }
    }
  };

  const handleExportPaySlip = async () => {
    if (!payForm.employeeName) return;
    setExportingSlip(true);
    try {
      const res = await exportPaySlip(payForm.employeeName, payForm.year, payForm.month);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${payForm.employeeName}_${payForm.year}_${payForm.month}.html`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'فشل التصدير');
    } finally {
      setExportingSlip(false);
    }
  };

  const handleShowCalcTrace = async () => {
    setShowCalcTrace(v => !v);
    if (!calcTrace && payForm.employeeName) {
      setCalcTraceLoading(true);
      try {
        const res = await getCalculationLog(payForm.employeeName, payForm.year, payForm.month);
        setCalcTrace(res.data?.trace ?? paySlip?.calculationTrace ?? '');
      } catch {
        setCalcTrace(paySlip?.calculationTrace ?? '');
      } finally {
        setCalcTraceLoading(false);
      }
    }
  };

  const handleLockPeriod = async () => {
    if (!window.confirm(`هل أنت متأكد من قفل الرواتب لشهر ${payForm.month}/${payForm.year}؟\nلن تتمكن من إعادة الحساب بعد القفل.\n\nLock payroll for ${payForm.month}/${payForm.year}? This cannot be undone.`)) return;
    setLockLoading(true); setLockError(''); setLockSuccess('');
    try {
      const res = await lockPayrollPeriod(payForm.year, payForm.month);
      setLockSuccess(`تم قفل ${res.data.records} سجلات الراتب للفترة ${res.data.period} ✓`);
    } catch (err: unknown) {
      setLockError(err instanceof Error ? err.message : 'فشل القفل');
    } finally {
      setLockLoading(false);
    }
  };

  const handleBankTransfer = async () => {
    setBankTransferLoading(true);
    try {
      const res = await downloadBankTransfer(payForm.year, payForm.month);
      const url = window.URL.createObjectURL(new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `bank_transfer_${payForm.year}_${String(payForm.month).padStart(2, '0')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'فشل تصدير ملف البنك');
    } finally {
      setBankTransferLoading(false);
    }
  };

  const handleLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoanError(''); setLoanSuccess(''); setLoanLoading(true);
    try {
      const body = loanMode === 'default'
        ? {
            loanType: loanForm.loanType,
            totalAmount: Number(loanForm.totalAmount),
            monthlyInstallment: loanForm.monthlyInstallment ? Number(loanForm.monthlyInstallment) : undefined,
            repaymentStartDate: loanForm.repaymentStartDate || undefined,
          }
        : {
            loanType: loanForm.loanType,
            totalAmount: Number(loanForm.totalAmount),
            repaymentStartDate: loanForm.repaymentStartDate || undefined,
            customInstallments: installments.map(i => ({
              monthName: i.monthName, dueDate: i.dueDate, amount: Number(i.amount)
            }))
          };
      await createLoan(loanForm.employeeName, body);
      setLoanSuccess('تم إنشاء القرض بنجاح!');
      setLoanForm({ employeeName: '', totalAmount: '', loanType: 'COMPANY_LOAN', monthlyInstallment: '', repaymentStartDate: '' });
      setInstallments([{ monthName: '', dueDate: '', amount: '' }]);
      // Refresh loan list
      if (loanForm.employeeName) handleLoadLoans(loanForm.employeeName);
    } catch (err: unknown) {
      setLoanError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setLoanLoading(false);
    }
  };

  const handleLoadLoans = async (name: string) => {
    if (!name) return;
    setLoansLoading(true);
    try {
      const res = await getEmployeeLoans(name);
      setEmployeeLoans(res.data ?? []);
      const settlement = await getSettlementBalance(name);
      setSettlementBalance(settlement.data?.settlementBalance ?? 0);
    } catch { setEmployeeLoans([]); }
    finally { setLoansLoading(false); }
  };

  const handleCashPayment = async () => {
    if (!cashPaymentLoanId || !cashPaymentAmount) return;
    setCashPaymentLoading(true);
    try {
      await recordCashPayment(cashPaymentLoanId, Number(cashPaymentAmount));
      setLoanSuccess(`تم تسجيل دفعة نقدية ${cashPaymentAmount} جنيه بنجاح ✓`);
      setCashPaymentAmount('');
      setCashPaymentLoanId(null);
      if (loanForm.employeeName) handleLoadLoans(loanForm.employeeName);
    } catch (err: unknown) {
      setLoanError(err instanceof Error ? err.message : 'فشل تسجيل الدفعة');
    } finally {
      setCashPaymentLoading(false);
    }
  };

  const handleDiscSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscError(''); setDiscSuccess(''); setDiscLoading(true);
    try {
      await postDisciplinary({
        employeeName: discForm.employeeName,
        amount: Number(discForm.amount),
        reason: discForm.reason,
        date: discForm.date,
      });
      setDiscSuccess('تم تسجيل الإجراء التأديبي بنجاح!');
      setDiscForm({ employeeName: '', amount: '', reason: '', date: '' });
    } catch (err: unknown) {
      setDiscError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setDiscLoading(false);
    }
  };

  const handleFetchDisc = async () => {
    if (!discFilterName) return;
    setDiscListError(''); setDiscListLoading(true);
    try {
      const res = await getDisciplinary(discFilterName);
      setDiscRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err: unknown) {
      setDiscListError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setDiscListLoading(false);
    }
  };

  const addInstallment = () => setInstallments(p => [...p, { monthName: '', dueDate: '', amount: '' }]);
  const removeInstallment = (i: number) => setInstallments(p => p.filter((_, idx) => idx !== i));
  const updateInstallment = (i: number, field: keyof LoanInstallmentForm, val: string) =>
    setInstallments(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-cairo";
  const labelClass = "block text-sm font-medium text-foreground font-cairo mb-1";

  return (
    <div className="space-y-6">
      <PageHeader title="الرواتب والقروض" subtitle="احتساب الرواتب وإدارة القروض والأقساط" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── Payroll Calculator ─── */}
        <div className="space-y-4">
          <FormSection>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
              <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
                احتساب الراتب
              </h3>
            </div>

            {empLoading ? <LoadingSpinner /> : (
              <form onSubmit={handlePayroll} className="space-y-4">
                <div>
                  <label className={labelClass}>اسم الموظف <span className="text-destructive">*</span></label>
                  <select className={inputClass} value={payForm.employeeName}
                    onChange={e => setPayForm(p => ({ ...p, employeeName: e.target.value }))} required>
                    <option value="">-- اختر الموظف --</option>
                    <EmployeeOptionGroups employees={employees} />
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>السنة <span className="text-destructive">*</span></label>
                    <input type="number" className={inputClass} value={payForm.year} min={2000} max={2100}
                      onChange={e => setPayForm(p => ({ ...p, year: Number(e.target.value) }))} required />
                  </div>
                  <div>
                    <label className={labelClass}>الشهر <span className="text-destructive">*</span></label>
                    <select className={inputClass} value={payForm.month}
                      onChange={e => setPayForm(p => ({ ...p, month: Number(e.target.value) }))} required>
                      {months.map((m, i) => <option key={i} value={i + 1}>{m} ({i + 1})</option>)}
                    </select>
                  </div>
                </div>
                {payError && <ErrorAlert message={payError} />}
                <button type="submit" className="navy-btn w-full" disabled={payLoading}>
                  {payLoading ? 'جاري الاحتساب...' : 'احتساب الراتب'}
                </button>
              </form>
            )}
          </FormSection>

          {/* Payroll Result */}
          {payResult && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <FormSection>
                <p className="font-cairo font-bold text-sm mb-4" style={{ color: 'hsl(var(--navy))' }}>
                  📊 تفاصيل الراتب
                </p>

                {/* Net Salary Banner */}
                {payResult.finalSalary !== undefined && (
                  <div className="p-4 rounded-xl mb-4 text-center" style={{ background: 'var(--gradient-hero)' }}>
                    <p className="text-sm text-white/70 font-cairo">صافي الراتب</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {Number(payResult.finalSalary).toLocaleString('ar-EG')}
                      <span className="text-lg"> جنيه</span>
                    </p>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {Object.entries(payResult)
                    .filter(([k]) => k !== 'finalSalary' && k !== 'employee')
                    .map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                        <span className="text-sm text-muted-foreground font-cairo">
                          {translatePayrollKey(key)}
                        </span>
                        <span className="text-sm font-semibold font-cairo" style={{ color: 'hsl(var(--navy))' }}>
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Pay Slip Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button onClick={handleGetPaySlip} className="gold-btn flex-1"
                    disabled={paySlipLoading}>
                    {paySlipLoading ? 'جاري التحميل...' : '📄 عرض كشف الراتب'}
                  </button>
                  <button onClick={handleExportPaySlip} className="navy-btn flex-1"
                    disabled={exportingSlip}>
                    {exportingSlip ? 'جاري التصدير...' : <span className="flex items-center justify-center gap-1"><Download className="w-4 h-4" /> تحميل PDF</span>}
                  </button>
                  <button onClick={handleBankTransfer} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-cairo font-medium border transition-colors hover:bg-muted/40"
                    style={{ borderColor: 'hsl(var(--gold) / 0.4)', color: 'hsl(var(--gold-dark))' }}
                    disabled={bankTransferLoading}>
                    {bankTransferLoading ? '...' : <><Building2 className="w-4 h-4" /> ملف البنك Excel</>}
                  </button>
                  <button onClick={handleLockPeriod} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-cairo font-medium border transition-colors hover:bg-destructive/10"
                    style={{ borderColor: 'hsl(0 84% 60% / 0.4)', color: 'hsl(0 84% 60%)' }}
                    disabled={lockLoading}>
                    {lockLoading ? '...' : <><Lock className="w-4 h-4" /> قفل الفترة</>}
                  </button>
                </div>

                {lockSuccess && <SuccessAlert message={lockSuccess} />}
                {lockError && <ErrorAlert message={lockError} />}
                {paySlipError && <ErrorAlert message={paySlipError} />}
              </FormSection>
            </motion.div>
          )}

          {/* ─── Pay Slip Display (SAP Two-Column) ─── */}
          {paySlip && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <FormSection>
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: 'hsl(var(--gold-dark))' }} />
                    <p className="font-cairo font-bold text-sm" style={{ color: 'hsl(var(--navy))' }}>
                      كشف الراتب — {paySlip.month}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {paySlip.locked && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: 'hsl(var(--navy))', color: '#fff' }}>
                        <Lock className="w-3 h-3" /> مقفل
                      </span>
                    )}
                    {paySlip.netAlert && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">
                        <AlertTriangle className="w-3 h-3" /> تنبيه صافي سالب
                      </span>
                    )}
                  </div>
                </div>

                {/* Employee Info Grid (Header) */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-lg mb-4" style={{ background: 'hsl(var(--navy) / 0.04)' }}>
                  <div><p className="text-xs text-muted-foreground font-cairo">الموظف</p><p className="font-bold font-cairo text-sm">{paySlip.employeeName}</p></div>
                  <div><p className="text-xs text-muted-foreground font-cairo">الكود</p><p className="font-bold font-cairo text-sm">{paySlip.employeeCode ?? '—'}</p></div>
                  <div><p className="text-xs text-muted-foreground font-cairo">الوظيفة</p><p className="font-bold font-cairo text-sm">{paySlip.jobTitle}</p></div>
                  <div><p className="text-xs text-muted-foreground font-cairo">القسم</p><p className="font-bold font-cairo text-sm">{paySlip.departmentName}</p></div>
                  <div><p className="text-xs text-muted-foreground font-cairo">الموقع</p><p className="font-bold font-cairo text-sm">{paySlip.branchName ?? 'المكتب الرئيسي'}</p></div>
                  <div><p className="text-xs text-muted-foreground font-cairo">الراتب الأساسي</p><p className="font-bold font-cairo text-sm">{fmt(paySlip.baseSalary)} جنيه</p></div>
                </div>

                {/* SAP Schema Steps */}
                <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg mb-4 font-mono"
                  style={{ background: 'hsl(var(--navy) / 0.06)', color: 'hsl(var(--navy))' }}>
                  <span>إجمالي الكسب <span className="font-bold">{fmt(paySlip.grossPay)}</span></span>
                  <span className="text-muted-foreground">−</span>
                  <span>خصم الوقت <span className="font-bold text-red-600">{fmt(paySlip.timeDeductions)}</span></span>
                  <span className="text-muted-foreground">=</span>
                  <span>الصافي الخاضع <span className="font-bold text-blue-700">{fmt(paySlip.adjustedGross)}</span></span>
                </div>

                {/* Two-Column: Earnings | Deductions */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* EARNINGS */}
                  <div>
                    <p className="text-xs font-bold font-cairo mb-2 pb-1 border-b-2" style={{ color: 'hsl(142 76% 36%)', borderColor: 'hsl(142 76% 36%)' }}>
                      ✚ الإضافات / Earnings
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm py-0.5">
                        <span className="text-muted-foreground font-cairo text-xs">الراتب الأساسي</span>
                        <span className="font-cairo font-medium text-xs" style={{ color: 'hsl(142 76% 36%)' }}>+{fmt(paySlip.baseSalary)}</span>
                      </div>
                      {Number(paySlip.additions?.overtimePay) > 0 && (
                        <div className="flex justify-between text-sm py-0.5">
                          <span className="text-muted-foreground font-cairo text-xs">عمل إضافي</span>
                          <span className="font-cairo font-medium text-xs" style={{ color: 'hsl(142 76% 36%)' }}>+{fmt(paySlip.additions.overtimePay)}</span>
                        </div>
                      )}
                      {Number(paySlip.additions?.bonus) > 0 && (
                        <div className="flex justify-between text-sm py-0.5">
                          <span className="text-muted-foreground font-cairo text-xs">مكافأة</span>
                          <span className="font-cairo font-medium text-xs" style={{ color: 'hsl(142 76% 36%)' }}>+{fmt(paySlip.additions.bonus)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 mt-1 border-t-2" style={{ borderColor: 'hsl(142 76% 36%)' }}>
                        <span className="font-cairo font-bold text-xs">إجمالي الإضافات</span>
                        <span className="font-bold text-xs" style={{ color: 'hsl(142 76% 36%)' }}>{fmt(paySlip.grossPay)}</span>
                      </div>
                    </div>
                  </div>

                  {/* DEDUCTIONS */}
                  <div>
                    <p className="text-xs font-bold font-cairo mb-2 pb-1 border-b-2" style={{ color: 'hsl(0 84% 60%)', borderColor: 'hsl(0 84% 60%)' }}>
                      ✖ الخصومات / Deductions
                    </p>
                    <div className="space-y-1">
                      {[
                        { label: 'تأخير', val: paySlip.deductions?.lateDeduction },
                        { label: 'انصراف مبكر', val: paySlip.deductions?.leaveEarlyDeduction },
                        { label: 'غياب', val: paySlip.deductions?.absenceDeduction },
                        { label: 'تأمين 11%', val: paySlip.deductions?.socialInsurance },
                        { label: 'ضريبة الدخل', val: paySlip.deductions?.incomeTax },
                        { label: 'صندوق الشهداء', val: paySlip.deductions?.martyrsFundDeduction },
                        { label: 'قرض', val: paySlip.deductions?.loanDeduction },
                        { label: 'جزاءات', val: paySlip.deductions?.penalties },
                      ].filter(r => Number(r.val) > 0).map(r => (
                        <div key={r.label} className="flex justify-between py-0.5">
                          <span className="text-muted-foreground font-cairo text-xs">{r.label}</span>
                          <span className="font-cairo font-medium text-xs" style={{ color: 'hsl(0 84% 60%)' }}>({fmt(r.val)})</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-1 mt-1 border-t-2" style={{ borderColor: 'hsl(0 84% 60%)' }}>
                        <span className="font-cairo font-bold text-xs">إجمالي الخصومات</span>
                        <span className="font-bold text-xs" style={{ color: 'hsl(0 84% 60%)' }}>({fmt(paySlip.totalDeductions)})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Leave Quota Summary (SAP Infotype 2006) ── */}
                {paySlip.leaveQuota && (
                  <div className="rounded-xl border p-4 mb-3"
                    style={{ borderColor: 'hsl(210 60% 80%)', background: 'hsl(210 60% 98%)' }}>
                    <p className="font-cairo font-bold text-xs mb-3 tracking-wide uppercase"
                      style={{ color: 'hsl(210 60% 35%)' }}>
                      📅 ملخص الإجازات / Leave Quota Summary
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          label: 'الرصيد الكلي', sublabel: 'Entitlement',
                          value: paySlip.leaveQuota.entitlement,
                          color: 'hsl(210 60% 35%)', bg: 'hsl(210 60% 92%)',
                        },
                        {
                          label: 'أيام مستهلكة', sublabel: 'Days Taken',
                          value: paySlip.leaveQuota.daysTaken,
                          color: 'hsl(43 96% 35%)', bg: 'hsl(43 96% 92%)',
                        },
                        {
                          label: 'الرصيد المتبقي', sublabel: 'Current Balance',
                          value: paySlip.leaveQuota.currentBalance,
                          color: paySlip.leaveQuota.currentBalance <= 5 ? 'hsl(0 84% 50%)' : 'hsl(142 76% 30%)',
                          bg:    paySlip.leaveQuota.currentBalance <= 5 ? 'hsl(0 84% 97%)'  : 'hsl(142 76% 92%)',
                        },
                      ].map((item, idx) => (
                        <div key={idx} className="rounded-lg p-3 text-center"
                          style={{ background: item.bg }}>
                          <div className="text-2xl font-bold font-cairo"
                            style={{ color: item.color }}>
                            {item.value}
                          </div>
                          <div className="text-xs font-cairo font-semibold mt-1"
                            style={{ color: item.color }}>
                            {item.label}
                          </div>
                          <div className="text-xs text-muted-foreground">{item.sublabel}</div>
                        </div>
                      ))}
                    </div>
                    {paySlip.leaveQuota.currentBalance <= 5 && (
                      <p className="text-xs font-cairo mt-2"
                        style={{ color: 'hsl(0 84% 50%)' }}>
                        ⚠ تنبيه: رصيد الإجازة السنوية منخفض — {paySlip.leaveQuota.currentBalance} يوم متبقٍ فقط
                      </p>
                    )}
                  </div>
                )}

                {/* Net Alert Banner */}
                {paySlip.netAlert && (
                  <div className="flex items-start gap-2 p-3 rounded-lg mb-3 text-sm"
                    style={{ background: 'hsl(38 92% 95%)', border: '1px solid hsl(38 92% 50% / 0.4)' }}>
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                    <p className="font-cairo text-amber-800">
                      تنبيه: الراتب الصافي المحسوب كان سالباً وتم تصفيره. يرجى مراجعة الخصومات مع الموظف.
                    </p>
                  </div>
                )}

                {/* Net Salary */}
                <div className="p-4 rounded-xl text-center" style={{ background: 'var(--gradient-hero)' }}>
                  <p className="text-sm text-white/70 font-cairo">صافي الراتب / NET PAY</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {fmt(paySlip.netSalary)}<span className="text-lg"> جنيه</span>
                  </p>
                  <p className="text-xs text-white/50 mt-1 font-cairo">
                    تاريخ الإصدار: {paySlip.generatedAt}
                  </p>
                </div>

                {/* Action Toggles */}
                <div className="flex flex-col gap-2 mt-4">
                  <button onClick={handleShowTaxLog}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-border text-sm font-cairo font-medium transition-colors hover:bg-muted/40"
                    style={{ color: 'hsl(var(--navy))' }}>
                    <span className="flex items-center gap-2"><Calculator className="w-4 h-4" /> سجل حساب الضريبة والتأمين</span>
                    {showTaxLog ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={handleShowCalcTrace}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-border text-sm font-cairo font-medium transition-colors hover:bg-muted/40"
                    style={{ color: 'hsl(var(--navy))' }}>
                    <span className="flex items-center gap-2"><List className="w-4 h-4" /> سجل خطوات الحساب (SAP Trace)</span>
                    {showCalcTrace ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Calc Trace Panel */}
                <AnimatePresence>
                  {showCalcTrace && (
                    <motion.div key="calc-trace" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      className="mt-2 rounded-lg border border-border overflow-hidden">
                      <div className="px-4 py-2 text-xs font-bold font-cairo" style={{ background: 'hsl(var(--navy))', color: '#fff' }}>
                        خطوات الحساب التفصيلية — SAP Calculation Trace
                      </div>
                      {calcTraceLoading ? (
                        <div className="p-4 text-center"><LoadingSpinner /></div>
                      ) : (
                        <pre className="p-4 text-xs font-mono text-muted-foreground whitespace-pre-wrap overflow-auto max-h-64 bg-muted/20 leading-relaxed">
                          {calcTrace || paySlip.calculationTrace || 'لا توجد بيانات متاحة'}
                        </pre>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </FormSection>
            </motion.div>
          )}

          {/* ── Payroll Log / Tax Audit Panel ── */}
          <AnimatePresence>
            {showTaxLog && (
              <motion.div
                key="tax-log"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <FormSection>
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-5 h-5" style={{ color: 'hsl(var(--gold-dark))' }} />
                    <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
                      سجل الحساب التفصيلي — Payroll Audit Log
                    </h3>
                  </div>

                  {taxLogLoading && <LoadingSpinner />}

                  {(taxBreakdown || paySlip?.taxBreakdown) && (() => {
                    const bd: TaxBreakdownData = taxBreakdown || paySlip.taxBreakdown;
                    return (
                      <div className="space-y-5">

                        {/* ① SI Section */}
                        <div>
                          <p className="text-xs font-bold font-cairo mb-2 uppercase tracking-wide" style={{ color: 'hsl(var(--navy))' }}>
                            ① التأمين الاجتماعي — Social Insurance
                          </p>
                          <div className="rounded-lg border border-border overflow-hidden">
                            <table className="data-table w-full text-sm">
                              <tbody>
                                <tr><td className="font-cairo">الراتب الإجمالي</td><td className="text-right font-medium">{fmt(bd.grossSalary)} ج</td></tr>
                                <tr><td className="font-cairo">وعاء التأمين ({bd.hasSocialInsurance ? 'مطبق' : 'غير مطبق'})</td><td className="text-right font-medium">{fmt(bd.siBase)} ج</td></tr>
                                <tr><td className="font-cairo">خصم الموظف (11%)</td><td className="text-right font-medium text-red-600">- {fmt(bd.siEmployeeDeduction)} ج</td></tr>
                                <tr><td className="font-cairo">تكلفة الشركة (18.75%) — للمرجعية</td><td className="text-right font-medium text-orange-600">{fmt(bd.siCompanyCost)} ج</td></tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* ② Taxable Income */}
                        <div>
                          <p className="text-xs font-bold font-cairo mb-2 uppercase tracking-wide" style={{ color: 'hsl(var(--navy))' }}>
                            ② الدخل الخاضع للضريبة — Taxable Income
                          </p>
                          <div className="rounded-lg border border-border overflow-hidden">
                            <table className="data-table w-full text-sm">
                              <tbody>
                                <tr><td className="font-cairo">الراتب الإجمالي</td><td className="text-right">{fmt(bd.grossSalary)} ج</td></tr>
                                <tr><td className="font-cairo">( - ) التأمين الاجتماعي</td><td className="text-right text-red-600">- {fmt(bd.siEmployeeDeduction)} ج</td></tr>
                                <tr><td className="font-cairo">( - ) الغرامات والخصومات</td><td className="text-right text-red-600">- {fmt(bd.latePenalties)} ج</td></tr>
                                <tr className="font-bold bg-muted/30"><td className="font-cairo">الدخل الشهري الخاضع</td><td className="text-right">{fmt(bd.monthlyTaxableIncome)} ج</td></tr>
                                <tr><td className="font-cairo">× 12 شهر (سنوي)</td><td className="text-right">{fmt(bd.projectedAnnualIncome)} ج</td></tr>
                                <tr><td className="font-cairo">( - ) الإعفاء الشخصي 20,000</td><td className="text-right text-green-600">- 20,000 ج</td></tr>
                                <tr className="font-bold bg-muted/30"><td className="font-cairo">الوعاء الضريبي السنوي</td><td className="text-right">{fmt(bd.annualAfterExemption)} ج</td></tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* ③ Slab Breakdown */}
                        <div>
                          <p className="text-xs font-bold font-cairo mb-2 uppercase tracking-wide" style={{ color: 'hsl(var(--navy))' }}>
                            ③ جدول الشرائح الضريبية — Tax Slabs (Law 30/2023)
                          </p>
                          <div className="rounded-lg border border-border overflow-hidden">
                            <table className="data-table w-full text-sm">
                              <thead>
                                <tr>
                                  <th className="font-cairo text-right">الشريحة</th>
                                  <th className="font-cairo text-right">النسبة</th>
                                  <th className="font-cairo text-right">المبلغ في الشريحة</th>
                                  <th className="font-cairo text-right">الضريبة</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bd.slabs?.filter(s => s.amountInRange > 0).map((s, i) => (
                                  <tr key={i}>
                                    <td className="font-cairo text-xs">{s.slabLabel}</td>
                                    <td className="text-right">
                                      <span className="px-1.5 py-0.5 rounded text-xs font-bold"
                                        style={{ background: 'hsl(var(--gold) / 0.15)', color: 'hsl(var(--gold-dark))' }}>
                                        {pct(s.rate)}
                                      </span>
                                    </td>
                                    <td className="text-right font-cairo">{fmt(s.amountInRange)} ج</td>
                                    <td className="text-right font-cairo font-medium text-red-600">{fmt(s.taxOnSlab)} ج</td>
                                  </tr>
                                ))}
                                <tr className="font-bold bg-muted/30">
                                  <td colSpan={2} className="font-cairo">إجمالي الضريبة السنوية</td>
                                  <td></td>
                                  <td className="text-right text-red-600">{fmt(bd.totalAnnualTax)} ج</td>
                                </tr>
                                <tr className="font-bold">
                                  <td colSpan={2} className="font-cairo">الضريبة الشهرية (÷ 12)</td>
                                  <td></td>
                                  <td className="text-right text-red-700">{fmt(bd.monthlyTax)} ج</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* ④ Martyrs Fund + Summary */}
                        <div>
                          <p className="text-xs font-bold font-cairo mb-2 uppercase tracking-wide" style={{ color: 'hsl(var(--navy))' }}>
                            ④ الملخص القانوني — Statutory Summary
                          </p>
                          <div className="rounded-lg border border-border overflow-hidden">
                            <table className="data-table w-full text-sm">
                              <tbody>
                                <tr><td className="font-cairo">التأمين الاجتماعي (موظف)</td><td className="text-right text-red-600">- {fmt(bd.siEmployeeDeduction)} ج</td></tr>
                                <tr><td className="font-cairo">ضريبة الدخل الشهرية</td><td className="text-right text-red-600">- {fmt(bd.monthlyTax)} ج</td></tr>
                                <tr><td className="font-cairo">صندوق الشهداء (0.05%)</td><td className="text-right text-red-600">- {fmt(bd.martyrsFundDeduction)} ج</td></tr>
                                <tr className="font-bold bg-muted/30">
                                  <td className="font-cairo">إجمالي الخصومات القانونية</td>
                                  <td className="text-right text-red-700">{fmt(bd.totalStatutoryDeductions)} ج</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </FormSection>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Loans (SAP Infotype 0045) ─── */}
        <FormSection>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5" style={{ color: 'hsl(var(--gold-dark))' }} />
            <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
              إدارة القروض والسلف — SAP Infotype 0045
            </h3>
          </div>

          {loanSuccess && <SuccessAlert message={loanSuccess} />}
          {loanError && <ErrorAlert message={loanError} />}

          {empLoading ? <LoadingSpinner /> : (
            <form onSubmit={handleLoan} className="space-y-4">

              {/* Loan Type */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(['SALARY_ADVANCE', 'COMPANY_LOAN'] as const).map(t => (
                  <button key={t} type="button"
                    className={`flex-1 py-2 text-sm font-cairo font-medium transition-colors ${loanForm.loanType === t ? 'text-white' : 'text-muted-foreground hover:bg-muted'}`}
                    style={loanForm.loanType === t ? { background: 'hsl(var(--navy))' } : {}}
                    onClick={() => setLoanForm(p => ({ ...p, loanType: t }))}>
                    {t === 'SALARY_ADVANCE' ? '💵 سلفة مؤقتة' : '🏦 قرض شركة'}
                  </button>
                ))}
              </div>

              {/* Installment mode (only for COMPANY_LOAN) */}
              {loanForm.loanType === 'COMPANY_LOAN' && (
                <div className="flex rounded-lg border border-border overflow-hidden">
                  {(['default', 'custom'] as const).map(m => (
                    <button key={m} type="button"
                      className={`flex-1 py-1.5 text-xs font-cairo font-medium transition-colors ${loanMode === m ? 'text-white' : 'text-muted-foreground hover:bg-muted'}`}
                      style={loanMode === m ? { background: 'hsl(var(--gold-dark))' } : {}}
                      onClick={() => setLoanMode(m)}>
                      {m === 'default' ? 'أقساط تلقائية' : 'أقساط مخصصة'}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>الموظف <span className="text-destructive">*</span></label>
                  <select className={inputClass} value={loanForm.employeeName}
                    onChange={e => { setLoanForm(p => ({ ...p, employeeName: e.target.value })); handleLoadLoans(e.target.value); }} required>
                    <option value="">-- اختر الموظف --</option>
                    <EmployeeOptionGroups employees={employees} />
                  </select>
                </div>
                <div>
                  <label className={labelClass}>إجمالي المبلغ <span className="text-destructive">*</span></label>
                  <input type="number" className={inputClass} value={loanForm.totalAmount}
                    placeholder="0.00" min={0}
                    onChange={e => setLoanForm(p => ({ ...p, totalAmount: e.target.value }))} required />
                </div>
                {loanForm.loanType === 'COMPANY_LOAN' && loanMode === 'default' && (
                  <div>
                    <label className={labelClass}>القسط الشهري (اختياري)</label>
                    <input type="number" className={inputClass} value={loanForm.monthlyInstallment}
                      placeholder="تلقائي: المبلغ ÷ 12" min={0}
                      onChange={e => setLoanForm(p => ({ ...p, monthlyInstallment: e.target.value }))} />
                  </div>
                )}
                <div>
                  <label className={labelClass}>تاريخ بدء الاستقطاع (SAP Repayment Start)</label>
                  <input type="date" className={inputClass} value={loanForm.repaymentStartDate}
                    onChange={e => setLoanForm(p => ({ ...p, repaymentStartDate: e.target.value }))} />
                  <p className="text-xs text-muted-foreground mt-1 font-cairo">النظام يبدأ الخصم من هذا التاريخ — يمكن تأجيل البدء</p>
                </div>
              </div>

              {loanForm.loanType === 'COMPANY_LOAN' && loanMode === 'custom' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold font-cairo" style={{ color: 'hsl(var(--navy))' }}>الأقساط المخصصة</p>
                    <button type="button" onClick={addInstallment} className="flex items-center gap-1 text-xs gold-btn px-3 py-1.5">
                      <Plus className="w-3 h-3" /> إضافة قسط
                    </button>
                  </div>
                  {installments.map((inst, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-cairo text-muted-foreground">قسط #{i + 1}</span>
                        {installments.length > 1 && (
                          <button type="button" onClick={() => removeInstallment(i)} className="text-destructive hover:bg-destructive/10 rounded p-1">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input className={inputClass} placeholder="اسم الشهر" value={inst.monthName}
                          onChange={e => updateInstallment(i, 'monthName', e.target.value)} />
                        <input type="date" className={inputClass} value={inst.dueDate}
                          onChange={e => updateInstallment(i, 'dueDate', e.target.value)} required />
                        <input type="number" className={inputClass} placeholder="المبلغ" value={inst.amount}
                          onChange={e => updateInstallment(i, 'amount', e.target.value)} required min={0} />
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              <button type="submit" className="gold-btn w-full" disabled={loanLoading}>
                {loanLoading ? 'جاري الإنشاء...' : `إنشاء ${loanForm.loanType === 'SALARY_ADVANCE' ? 'السلفة' : 'القرض'}`}
              </button>
            </form>
          )}

          {/* ── Loan Balance Display ── */}
          {loanForm.employeeName && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold font-cairo" style={{ color: 'hsl(var(--navy))' }}>
                  القروض النشطة — {loanForm.employeeName}
                </p>
                <div className="flex items-center gap-2">
                  {settlementBalance !== null && settlementBalance > 0 && (
                    <span className="text-xs font-cairo px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-bold">
                      رصيد التسوية: {fmt(settlementBalance)} ج
                    </span>
                  )}
                  <button onClick={() => handleLoadLoans(loanForm.employeeName)}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted/40">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {loansLoading ? <LoadingSpinner /> : employeeLoans.length === 0 ? (
                <p className="text-xs text-muted-foreground font-cairo">لا توجد قروض مسجلة</p>
              ) : (
                <div className="space-y-3">
                  {employeeLoans.map(loan => (
                    <div key={loan.id} className="p-3 rounded-lg border border-border"
                      style={{ opacity: loan.closed ? 0.6 : 1 }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                            style={{ background: loan.loanType === 'SALARY_ADVANCE' ? 'hsl(38 92% 90%)' : 'hsl(220 70% 90%)', color: loan.loanType === 'SALARY_ADVANCE' ? 'hsl(38 92% 40%)' : 'hsl(220 70% 40%)' }}>
                            {loan.loanType === 'SALARY_ADVANCE' ? 'سلفة' : 'قرض'}
                          </span>
                          {loan.closed && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">✓ مسدد</span>}
                        </div>
                        <span className="text-xs text-muted-foreground font-cairo">{loan.createdAt}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                        <div><p className="text-muted-foreground font-cairo">الإجمالي</p><p className="font-bold">{fmt(loan.totalAmount)} ج</p></div>
                        <div><p className="text-muted-foreground font-cairo">القسط الشهري</p><p className="font-bold">{fmt(loan.monthlyInstallment)} ج</p></div>
                        <div><p className="text-muted-foreground font-cairo">المتبقي</p>
                          <p className="font-bold" style={{ color: Number(loan.remainingBalance) > 0 ? 'hsl(0 84% 60%)' : 'hsl(142 76% 36%)' }}>
                            {fmt(loan.remainingBalance)} ج
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{
                            background: 'hsl(142 76% 36%)',
                            width: `${Math.round((1 - Number(loan.remainingBalance) / Number(loan.totalAmount)) * 100)}%`
                          }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-cairo text-left">
                        {Math.round((1 - Number(loan.remainingBalance) / Number(loan.totalAmount)) * 100)}% مسدد
                      </p>

                      {/* Cash Payment */}
                      {!loan.closed && (
                        <div className="mt-2 flex gap-2">
                          {cashPaymentLoanId === loan.id ? (
                            <>
                              <input type="number" className={inputClass + ' text-xs py-1 flex-1'} placeholder="المبلغ النقدي"
                                value={cashPaymentAmount}
                                onChange={e => setCashPaymentAmount(e.target.value)} />
                              <button onClick={handleCashPayment} disabled={cashPaymentLoading}
                                className="gold-btn text-xs px-3 py-1">
                                {cashPaymentLoading ? '...' : <><Banknote className="w-3 h-3 inline ml-1" />تأكيد</>}
                              </button>
                              <button onClick={() => { setCashPaymentLoanId(null); setCashPaymentAmount(''); }}
                                className="text-xs px-2 py-1 border border-border rounded-lg hover:bg-muted/40">
                                إلغاء
                              </button>
                            </>
                          ) : (
                            <button onClick={() => setCashPaymentLoanId(loan.id)}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted/40 font-cairo">
                              <Banknote className="w-3.5 h-3.5" /> دفع نقدي
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </FormSection>
      </div>

      {/* ─── Disciplinary Actions ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Add Disciplinary */}
        <FormSection>
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5" style={{ color: 'hsl(0 84% 60%)' }} />
            <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
              إضافة إجراء تأديبي
            </h3>
          </div>

          {discSuccess && <SuccessAlert message={discSuccess} />}
          {discError && <ErrorAlert message={discError} />}

          {empLoading ? <LoadingSpinner /> : (
            <form onSubmit={handleDiscSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>اسم الموظف <span className="text-destructive">*</span></label>
                  <select className={inputClass} value={discForm.employeeName}
                    onChange={e => setDiscForm(p => ({ ...p, employeeName: e.target.value }))} required>
                    <option value="">-- اختر الموظف --</option>
                    <EmployeeOptionGroups employees={employees} />
                  </select>
                </div>
                <div>
                  <label className={labelClass}>مبلغ الغرامة (جنيه) <span className="text-destructive">*</span></label>
                  <input type="number" className={inputClass} value={discForm.amount}
                    placeholder="0.00" min={0}
                    onChange={e => setDiscForm(p => ({ ...p, amount: e.target.value }))} required />
                </div>
                <div>
                  <label className={labelClass}>التاريخ <span className="text-destructive">*</span></label>
                  <input type="date" className={inputClass} value={discForm.date}
                    onChange={e => setDiscForm(p => ({ ...p, date: e.target.value }))} required />
                </div>
                <div>
                  <label className={labelClass}>
                    السبب <span className="text-destructive">*</span>
                    <span className="text-xs text-muted-foreground mr-1">(سيظهر للموظف)</span>
                  </label>
                  <input className={inputClass} value={discForm.reason}
                    placeholder="مثال: تأخر متكرر في تسليم التقارير"
                    onChange={e => setDiscForm(p => ({ ...p, reason: e.target.value }))} required />
                </div>
              </div>

              <div className="p-3 rounded-lg text-sm font-cairo"
                style={{
                  background: 'hsl(0 84% 60% / 0.06)',
                  color: 'hsl(0 84% 60%)',
                  border: '1px solid hsl(0 84% 60% / 0.2)'
                }}>
                ⚠️ سيتم خصم هذا المبلغ تلقائياً من راتب الموظف عند احتساب الراتب الشهري
              </div>

              <button type="submit" className="navy-btn w-full" disabled={discLoading}>
                {discLoading ? 'جاري الحفظ...' : 'حفظ الإجراء التأديبي'}
              </button>
            </form>
          )}
        </FormSection>

        {/* Disciplinary Records */}
        <FormSection>
          <div className="flex items-center gap-2 mb-4">
            <List className="w-5 h-5" style={{ color: 'hsl(var(--gold-dark))' }} />
            <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
              سجل الإجراءات التأديبية
            </h3>
          </div>

          <div className="flex gap-3 mb-4">
            <select className={inputClass} value={discFilterName}
              onChange={e => setDiscFilterName(e.target.value)}>
              <option value="">-- اختر الموظف --</option>
              <EmployeeOptionGroups employees={employees} />
            </select>
            <button onClick={handleFetchDisc} className="gold-btn whitespace-nowrap"
              disabled={!discFilterName || discListLoading}>
              {discListLoading ? 'جاري البحث...' : 'عرض السجل'}
            </button>
          </div>

          {discListError && <ErrorAlert message={discListError} />}

          {discRecords.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="overflow-x-auto rounded-lg border border-border">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>التاريخ</th><th>المبلغ</th><th>السبب</th>
                  </tr>
                </thead>
                <tbody>
                  {discRecords.map((rec, i) => (
                    <tr key={i}>
                      <td className="text-muted-foreground">{i + 1}</td>
                      <td>{rec.date}</td>
                      <td className="font-bold" style={{ color: 'hsl(0 84% 60%)' }}>
                        {Number(rec.amount).toLocaleString('ar-EG')} جنيه
                      </td>
                      <td className="font-cairo text-sm text-muted-foreground">{rec.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {discRecords.length === 0 && discFilterName && !discListLoading && (
            <p className="text-sm text-muted-foreground font-cairo text-center py-4">
              لا توجد إجراءات تأديبية لهذا الموظف
            </p>
          )}
        </FormSection>
      </div>

      {/* ─── Pay Slip Preview Modal ─── */}
      <AnimatePresence>
        {showPayModal && paySlip && (
          <PaySlipModal
            paySlip={paySlip}
            onClose={() => setShowPayModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PaySlipModal — Preview before Download
// ─────────────────────────────────────────────────────────────────────────────
function PaySlipModal({ paySlip, onClose }: { paySlip: any; onClose: () => void }) {
  const fmt = (v: unknown) => Number(v ?? 0).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const n   = (v: unknown) => Number(v ?? 0);

  const [exporting, setExporting] = useState(false);

  const handleDownload = () => {
    setExporting(true);
    try {
      const stub: PayStubData = {
        employeeName:         paySlip.employeeName         ?? '',
        employeeCode:         paySlip.employeeCode         ?? '',
        jobTitle:             paySlip.jobTitle             ?? '',
        departmentName:       paySlip.departmentName       ?? '',
        branchName:           paySlip.branchName           ?? '',
        month:                paySlip.month                ?? '',
        baseSalary:           n(paySlip.baseSalary),
        overtimePay:          n(paySlip.additions?.overtimePay),
        bonus:                n(paySlip.additions?.bonus),
        grossPay:             n(paySlip.grossPay),
        lateDeduction:        n(paySlip.deductions?.lateDeduction),
        leaveEarlyDeduction:  n(paySlip.deductions?.leaveEarlyDeduction),
        absenceDeduction:     n(paySlip.deductions?.absenceDeduction),
        socialInsurance:      n(paySlip.deductions?.socialInsurance),
        incomeTax:            n(paySlip.deductions?.incomeTax),
        loanDeduction:        n(paySlip.deductions?.loanDeduction),
        penalties:            n(paySlip.deductions?.penalties),
        martyrsFundDeduction: n(paySlip.deductions?.martyrsFundDeduction),
        totalAdditions:       n(paySlip.grossPay),
        totalDeductions:      n(paySlip.totalDeductions),
        netSalary:            n(paySlip.netSalary),
        vacationBalance:      n(paySlip.leaveQuota?.currentBalance),
        generatedAt:          String(paySlip.generatedAt ?? ''),
      };
      exportPayStub(stub);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'فشل تصدير القسيمة');
    } finally {
      setExporting(false);
    }
  };

  // Earnings rows (only non-zero)
  const earnings = [
    { label: 'الراتب الأساسي',  val: n(paySlip.baseSalary) },
    { label: 'بدل إضافي',        val: n(paySlip.additions?.overtimePay) },
    { label: 'مكافأة',           val: n(paySlip.additions?.bonus) },
  ].filter(r => r.val > 0);

  // Deductions rows (only non-zero)
  const deductions = [
    { label: 'خصومات التأخير',              val: n(paySlip.deductions?.lateDeduction) },
    { label: 'خصم الانصراف المبكر',         val: n(paySlip.deductions?.leaveEarlyDeduction) },
    { label: 'خصومات الغياب',               val: n(paySlip.deductions?.absenceDeduction) },
    { label: 'التأمينات الاجتماعية (11%)',  val: n(paySlip.deductions?.socialInsurance) },
    { label: 'كسب العمل / الضرائب',         val: n(paySlip.deductions?.incomeTax) },
    { label: 'قسط القرض',                   val: n(paySlip.deductions?.loanDeduction) },
    { label: 'الجزاءات التأديبية',          val: n(paySlip.deductions?.penalties) },
    { label: 'صندوق الشهداء (0.05%)',       val: n(paySlip.deductions?.martyrsFundDeduction) },
  ].filter(r => r.val > 0);

  const maxRows = Math.max(earnings.length, deductions.length);

  return (
    <motion.div
      key="pay-slip-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        dir="rtl"
      >
        {/* ── Modal Header ── */}
        <div className="relative rounded-t-2xl px-6 pt-6 pb-5 text-white"
          style={{ background: 'var(--gradient-hero)' }}>
          <button onClick={onClose}
            className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-white/20 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="text-center">
            <p className="text-xs tracking-widest uppercase text-white/60 mb-1">نافذة المعاينة</p>
            <p className="text-2xl font-bold font-cairo">شركة الماسة</p>
            <p className="text-sm text-white/75 mt-1 font-cairo">
              قسيمة راتب — {paySlip.month}
            </p>
          </div>
          {paySlip.locked && (
            <div className="flex justify-center mt-3">
              <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-white/20 font-bold font-cairo">
                <Lock className="w-3 h-3" /> مقفل
              </span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-5">

          {/* ── Employee Info ── */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl"
            style={{ background: 'hsl(var(--navy) / 0.04)', border: '1px solid hsl(var(--navy) / 0.1)' }}>
            {[
              { label: 'الموظف',        val: paySlip.employeeName },
              { label: 'كود الموظف',    val: paySlip.employeeCode   ?? '—' },
              { label: 'الوظيفة',       val: paySlip.jobTitle       ?? '—' },
              { label: 'القسم',         val: paySlip.departmentName ?? '—' },
              { label: 'الموقع',        val: paySlip.branchName     ?? 'المكتب الرئيسي' },
              { label: 'الراتب الأساسي', val: `${fmt(paySlip.baseSalary)} جنيه` },
            ].map((item, i) => (
              <div key={i}>
                <p className="text-xs text-muted-foreground font-cairo">{item.label}</p>
                <p className="font-bold font-cairo text-sm" style={{ color: 'hsl(var(--navy))' }}>{item.val}</p>
              </div>
            ))}
          </div>

          {/* ── SAP Schema Strip ── */}
          <div className="flex items-center justify-between text-xs px-4 py-2.5 rounded-lg font-mono"
            style={{ background: 'hsl(var(--navy) / 0.06)', color: 'hsl(var(--navy))' }}>
            <span>إجمالي الكسب <strong>{fmt(paySlip.grossPay)}</strong></span>
            <span className="text-muted-foreground mx-2">−</span>
            <span>خصم الوقت <strong className="text-red-600">{fmt(paySlip.timeDeductions)}</strong></span>
            <span className="text-muted-foreground mx-2">=</span>
            <span>الصافي الخاضع <strong className="text-blue-700">{fmt(paySlip.adjustedGross)}</strong></span>
          </div>

          {/* ── Two-Column Breakdown ── */}
          <div className="rounded-xl border border-border overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-2">
              <div className="px-4 py-2.5 text-xs font-bold font-cairo border-b border-border"
                style={{ background: 'hsl(142 76% 36% / 0.08)', color: 'hsl(142 76% 36%)' }}>
                ✚ الإضافات / Earnings
              </div>
              <div className="px-4 py-2.5 text-xs font-bold font-cairo border-b border-l border-border"
                style={{ background: 'hsl(0 84% 60% / 0.08)', color: 'hsl(0 84% 60%)' }}>
                ✖ الخصومات / Deductions
              </div>
            </div>

            {/* Rows */}
            {Array.from({ length: maxRows }).map((_, idx) => (
              <div key={idx} className="grid grid-cols-2 border-b border-border last:border-0">
                {/* Earnings cell */}
                <div className="px-4 py-2 flex justify-between items-center"
                  style={{ background: idx % 2 === 0 ? 'transparent' : 'hsl(142 76% 36% / 0.03)' }}>
                  {earnings[idx] ? (
                    <>
                      <span className="text-xs text-muted-foreground font-cairo">{earnings[idx].label}</span>
                      <span className="text-xs font-semibold font-cairo" style={{ color: 'hsl(142 76% 36%)' }}>
                        +{fmt(earnings[idx].val)}
                      </span>
                    </>
                  ) : <span />}
                </div>
                {/* Deductions cell */}
                <div className="px-4 py-2 flex justify-between items-center border-l border-border"
                  style={{ background: idx % 2 === 0 ? 'transparent' : 'hsl(0 84% 60% / 0.03)' }}>
                  {deductions[idx] ? (
                    <>
                      <span className="text-xs text-muted-foreground font-cairo">{deductions[idx].label}</span>
                      <span className="text-xs font-semibold font-cairo" style={{ color: 'hsl(0 84% 60%)' }}>
                        ({fmt(deductions[idx].val)})
                      </span>
                    </>
                  ) : <span />}
                </div>
              </div>
            ))}

            {/* Totals row */}
            <div className="grid grid-cols-2 border-t-2 border-border">
              <div className="px-4 py-2.5 flex justify-between items-center"
                style={{ background: 'hsl(142 76% 36% / 0.06)' }}>
                <span className="text-xs font-bold font-cairo">إجمالي الإضافات</span>
                <span className="text-sm font-bold font-cairo" style={{ color: 'hsl(142 76% 36%)' }}>
                  {fmt(paySlip.grossPay)}
                </span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center border-l border-border"
                style={{ background: 'hsl(0 84% 60% / 0.06)' }}>
                <span className="text-xs font-bold font-cairo">إجمالي الخصومات</span>
                <span className="text-sm font-bold font-cairo" style={{ color: 'hsl(0 84% 60%)' }}>
                  ({fmt(paySlip.totalDeductions)})
                </span>
              </div>
            </div>
          </div>

          {/* ── Net Salary Banner ── */}
          {paySlip.netAlert && (
            <div className="flex items-start gap-2 p-3 rounded-lg text-sm"
              style={{ background: 'hsl(38 92% 95%)', border: '1px solid hsl(38 92% 50% / 0.4)' }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
              <p className="font-cairo text-amber-800 text-xs">
                تنبيه: الراتب الصافي المحسوب كان سالباً وتم تصفيره — يرجى مراجعة الخصومات.
              </p>
            </div>
          )}

          <div className="rounded-xl p-5 text-center" style={{ background: 'var(--gradient-hero)' }}>
            <p className="text-xs text-white/60 font-cairo mb-1">صافي الراتب النهائي / NET PAY</p>
            <p className="text-4xl font-bold text-white font-cairo">
              {fmt(paySlip.netSalary)}
            </p>
            <p className="text-sm text-white/70 mt-1 font-cairo">جنيه مصري</p>
          </div>

          {/* ── Vacation Balance ── */}
          {paySlip.leaveQuota && (
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl"
              style={{ background: 'hsl(210 60% 98%)', border: '1px solid hsl(210 60% 80%)' }}>
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-cairo mb-1">الرصيد الكلي</p>
                <p className="text-xl font-bold font-cairo" style={{ color: 'hsl(210 60% 35%)' }}>
                  {paySlip.leaveQuota.entitlement}
                </p>
                <p className="text-xs text-muted-foreground">يوم</p>
              </div>
              <div className="text-center border-x border-border">
                <p className="text-xs text-muted-foreground font-cairo mb-1">أيام مستهلكة</p>
                <p className="text-xl font-bold font-cairo" style={{ color: 'hsl(43 96% 35%)' }}>
                  {paySlip.leaveQuota.daysTaken}
                </p>
                <p className="text-xs text-muted-foreground">يوم</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-cairo mb-1">الرصيد المتبقي</p>
                <p className="text-xl font-bold font-cairo"
                  style={{ color: paySlip.leaveQuota.currentBalance <= 5 ? 'hsl(0 84% 50%)' : 'hsl(142 76% 30%)' }}>
                  {paySlip.leaveQuota.currentBalance}
                </p>
                <p className="text-xs text-muted-foreground">يوم</p>
              </div>
            </div>
          )}

          {/* ── Action Buttons ── */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleDownload}
              disabled={exporting}
              className="navy-btn flex-1 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'جاري التصدير...' : 'تحميل القسيمة (XLSX)'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg border border-border text-sm font-cairo font-medium transition-colors hover:bg-muted/40"
              style={{ color: 'hsl(var(--navy))' }}
            >
              إلغاء
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground font-cairo pb-2">
            تاريخ الإصدار: {paySlip.generatedAt} — شركة الماسة
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}