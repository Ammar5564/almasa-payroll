// import { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { Users, Building2, Plus, X } from 'lucide-react';
// import { PageHeader, FormSection, ErrorAlert, SuccessAlert, LoadingSpinner } from '@/components/UI';
// import { getEmployees, createEmployee, getDepartments, createDepartment } from '@/lib/api';

// interface Employee { id?: number; name: string; jobTitle: string; department: string; salary: number; }
// interface Department { id?: number; name: string; officialStartTime?: string; officialEndTime?: string; }

// export default function Employees() {
//   const [employees, setEmployees] = useState<Employee[]>([]);
//   const [departments, setDepartments] = useState<Department[]>([]);
//   const [loadingEmp, setLoadingEmp] = useState(true);
//   const [showAddEmp, setShowAddEmp] = useState(false);
//   const [showAddDept, setShowAddDept] = useState(false);

//   const [empForm, setEmpForm] = useState({ name: '', jobTitle: '', department: '', salary: '' });
//   const [empLoading, setEmpLoading] = useState(false);
//   const [empError, setEmpError] = useState('');
//   const [empSuccess, setEmpSuccess] = useState('');

//   const [deptForm, setDeptForm] = useState({ name: '', officialStartTime: '', officialEndTime: '' });
//   const [deptLoading, setDeptLoading] = useState(false);
//   const [deptError, setDeptError] = useState('');
//   const [deptSuccess, setDeptSuccess] = useState('');

//   const fetchData = async () => {
//     setLoadingEmp(true);
//     try {
//       const [empRes, deptRes] = await Promise.allSettled([getEmployees(), getDepartments()]);
//       if (empRes.status === 'fulfilled') {
//   const empData = empRes.value.data;
//   setEmployees(Array.isArray(empData) ? empData : empData?.content || empData?.data || []);
// }
// if (deptRes.status === 'fulfilled') {
//   const deptData = deptRes.value.data;
//   setDepartments(Array.isArray(deptData) ? deptData : deptData?.content || deptData?.data || []);
// }
//     } finally {
//       setLoadingEmp(false);
//     }
//   };

//   useEffect(() => { fetchData(); }, []);

//   const handleAddEmployee = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setEmpError(''); setEmpSuccess('');
//     setEmpLoading(true);
//     try {
//       await createEmployee({ 
//   name: empForm.name,
//   jobTitle: empForm.jobTitle,
//   departmentName: empForm.department,
//   baseSalary: Number(empForm.salary)
// });
//       setEmpSuccess('تم إضافة الموظف بنجاح! / Employee added successfully!');
//       setEmpForm({ name: '', jobTitle: '', department: '', salary: '' });
//       setShowAddEmp(false);
//       fetchData();
//     } catch (err: unknown) {
//       setEmpError(err instanceof Error ? err.message : 'حدث خطأ');
//     } finally {
//       setEmpLoading(false);
//     }
//   };

//   const handleAddDept = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setDeptError(''); setDeptSuccess('');
//     setDeptLoading(true);
//     try {
//       await createDepartment(deptForm);
//       setDeptSuccess('تم إضافة القسم بنجاح! / Department added successfully!');
//       setDeptForm({ name: '', officialStartTime: '', officialEndTime: '' });
//       setShowAddDept(false);
//       fetchData();
//     } catch (err: unknown) {
//       setDeptError(err instanceof Error ? err.message : 'حدث خطأ');
//     } finally {
//       setDeptLoading(false);
//     }
//   };

//   const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-cairo";
//   const labelClass = "block text-sm font-medium text-foreground font-cairo mb-1";

//   return (
//     <div className="space-y-6">
//       <PageHeader title="إدارة الموظفين" titleEn="Employee Management" subtitle="عرض وإضافة الموظفين والأقسام" />

//       {/* Departments Section */}
//       <FormSection>
//         <div className="flex items-center justify-between mb-4">
//           <div className="flex items-center gap-2">
//             <Building2 className="w-5 h-5" style={{ color: 'hsl(var(--gold-dark))' }} />
//             <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>الأقسام / Departments</h3>
//           </div>
//           <button onClick={() => setShowAddDept(!showAddDept)} className="flex items-center gap-2 navy-btn text-xs px-4 py-2">
//             {showAddDept ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
//             {showAddDept ? 'إلغاء' : 'إضافة قسم جديد'}
//           </button>
//         </div>

//         {deptSuccess && <SuccessAlert message={deptSuccess} />}
//         {deptError && <ErrorAlert message={deptError} />}

//         {showAddDept && (
//           <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
//             onSubmit={handleAddDept} className="mb-4 p-4 rounded-lg border border-border bg-muted/30 space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div>
//                 <label className={labelClass}>اسم القسم <span className="text-destructive">*</span></label>
//                 <input className={inputClass} value={deptForm.name} placeholder="مثال: الموارد البشرية"
//                   onChange={e => setDeptForm(p => ({ ...p, name: e.target.value }))} required />
//               </div>
//               <div>
//                 <label className={labelClass}>وقت البداية الرسمي</label>
//                 <input type="time" className={inputClass} value={deptForm.officialStartTime}
//                   onChange={e => setDeptForm(p => ({ ...p, officialStartTime: e.target.value }))} />
//               </div>
//               <div>
//                 <label className={labelClass}>وقت الانتهاء الرسمي</label>
//                 <input type="time" className={inputClass} value={deptForm.officialEndTime}
//                   onChange={e => setDeptForm(p => ({ ...p, officialEndTime: e.target.value }))} />
//               </div>
//             </div>
//             <button type="submit" className="gold-btn" disabled={deptLoading}>
//               {deptLoading ? 'جاري الإضافة...' : 'حفظ القسم'}
//             </button>
//           </motion.form>
//         )}

//         <div className="flex flex-wrap gap-2">
//           {departments.length === 0 ? (
//             <p className="text-sm text-muted-foreground font-cairo">لا توجد أقسام مسجلة</p>
//           ) : departments.map((d, i) => (
//             <span key={i} className="px-3 py-1.5 rounded-full text-sm font-cairo font-medium border"
//               style={{ background: 'hsl(var(--navy) / 0.08)', color: 'hsl(var(--navy))', borderColor: 'hsl(var(--navy) / 0.2)' }}>
//               {d.name}
//             </span>
//           ))}
//         </div>
//       </FormSection>

//       {/* Add Employee Form */}
//       <FormSection>
//         <div className="flex items-center justify-between mb-4">
//           <div className="flex items-center gap-2">
//             <Users className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
//             <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>إضافة موظف جديد / Add Employee</h3>
//           </div>
//           <button onClick={() => setShowAddEmp(!showAddEmp)} className="flex items-center gap-2 gold-btn text-xs px-4 py-2">
//             {showAddEmp ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
//             {showAddEmp ? 'إلغاء' : 'إضافة موظف'}
//           </button>
//         </div>

//         {empSuccess && <SuccessAlert message={empSuccess} />}
//         {empError && <ErrorAlert message={empError} />}

//         {showAddEmp && (
//           <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
//             onSubmit={handleAddEmployee} className="mb-4 p-4 rounded-lg border border-border bg-muted/30">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
//               <div>
//                 <label className={labelClass}>الاسم الكامل <span className="text-destructive">*</span></label>
//                 <input className={inputClass} value={empForm.name} placeholder="الاسم بالكامل"
//                   onChange={e => setEmpForm(p => ({ ...p, name: e.target.value }))} required />
//               </div>
//               <div>
//                 <label className={labelClass}>المسمى الوظيفي <span className="text-destructive">*</span></label>
//                 <input className={inputClass} value={empForm.jobTitle} placeholder="مثال: مهندس برمجيات"
//                   onChange={e => setEmpForm(p => ({ ...p, jobTitle: e.target.value }))} required />
//               </div>
//               <div>
//                 <label className={labelClass}>القسم <span className="text-destructive">*</span></label>
//                 <select className={inputClass} value={empForm.department}
//                   onChange={e => setEmpForm(p => ({ ...p, department: e.target.value }))} required>
//                   <option value="">-- اختر القسم --</option>
//                   {departments.map((d, i) => (
//                     <option key={i} value={d.name}>{d.name}</option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className={labelClass}>الراتب (ريال) <span className="text-destructive">*</span></label>
//                 <input type="number" className={inputClass} value={empForm.salary} placeholder="0.00"
//                   onChange={e => setEmpForm(p => ({ ...p, salary: e.target.value }))} required min={0} />
//               </div>
//             </div>
//             <button type="submit" className="navy-btn" disabled={empLoading}>
//               {empLoading ? 'جاري الإضافة...' : 'حفظ الموظف'}
//             </button>
//           </motion.form>
//         )}
//       </FormSection>

//       {/* Employees Table */}
//       <div className="form-section overflow-hidden">
//         <div className="flex items-center gap-2 mb-4">
//           <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
//             قائمة الموظفين / Employees List
//           </h3>
//           <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
//             style={{ background: 'hsl(var(--navy) / 0.1)', color: 'hsl(var(--navy))' }}>
//             {employees.length}
//           </span>
//         </div>
//         {loadingEmp ? (
//           <div className="flex justify-center py-8"><LoadingSpinner /></div>
//         ) : (
//           <div className="overflow-x-auto rounded-lg border border-border">
//             <table className="data-table">
//               <thead>
//                 <tr>
//                   <th>#</th>
//                   <th>الاسم / Name</th>
//                   <th>المسمى الوظيفي / Job Title</th>
//                   <th>القسم / Department</th>
//                   <th>الراتب / Salary</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {employees.length === 0 ? (
//                   <tr><td colSpan={5} className="text-center py-8 text-muted-foreground font-cairo">لا يوجد موظفون مسجلون</td></tr>
//                 ) : employees.map((emp, i) => (
//                   <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
//                     <td className="text-muted-foreground">{i + 1}</td>
//                     <td className="font-cairo font-medium">{emp.name}</td>
//                     <td className="font-cairo text-muted-foreground">{emp.jobTitle}</td>
//                     <td>
//                       <span className="px-2 py-1 rounded-md text-xs font-cairo font-medium"
//                         style={{ background: 'hsl(var(--gold) / 0.15)', color: 'hsl(var(--gold-dark))' }}>
//                         {emp.department}
//                       </span>
//                     </td>
//                     <td className="font-semibold" style={{ color: 'hsl(var(--navy))' }}>
//                       {Number(emp.salary).toLocaleString('ar-SA')} ريال
//                     </td>
//                   </motion.tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Building2, Plus, X, Trash2, Calculator, Clock, Shield, Heart, Pencil } from 'lucide-react';
import { PageHeader, FormSection, ErrorAlert, SuccessAlert, LoadingSpinner } from '@/components/UI';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getDepartments, createDepartment, deleteDepartment, getCategories, createCategory } from '@/lib/api';
import { getAuth, isAdmin } from '@/lib/auth';

interface Employee {
  /** Surrogate PK from API (number; may appear as string if parsed loosely) */
  employeeId?: number | string;
  employeeCode?: string;
  name: string;
  jobTitle: string;
  baseSalary: number;
  departmentName?: string;
  branchName?: string;
  officialStart?: string;
  officialEnd?: string;
  deptFlexibleGroup?: boolean;
  category?: string;
  gender?: string;
  address?: string;
  hasSocialInsurance?: boolean;
  /** When not false, Martyrs' Fund deduction applies (undefined/null from API = on). */
  applyMartyrsFund?: boolean;
  hiringDate?: string;
  contractExpiry?: string;
  flexibleSchedule?: boolean;
  bankAccount?: string;
  age?: number;
  vacationBalance?: number;
}
interface Department {
  id?: number;
  departmentName: string;
  branchName?: string;
  officialStart?: string;
  officialEnd?: string;
  flexibleGroup?: boolean;
}

type ShiftType = 'MORNING' | 'EVENING';

type EmpFormState = {
  name: string; jobTitle: string; department: string; branchName: string; salary: string;
  category: string; shiftType: ShiftType | ''; hiringDate: string; contractExpiry: string;
  insuranceNumber: string; flexibleSchedule: boolean; hasSocialInsurance: boolean;
  applyMartyrsFund: boolean;
  bankAccount: string; age: string;
};

const EMPTY_EMP_FORM: EmpFormState = {
  name: '', jobTitle: '', department: '', branchName: '', salary: '',
  category: '', shiftType: '', hiringDate: '', contractExpiry: '',
  insuranceNumber: '', flexibleSchedule: false, hasSocialInsurance: false,
  applyMartyrsFund: true,
  bankAccount: '', age: '',
};

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<{ name: string }[]>([]);
  const [loadingEmp, setLoadingEmp] = useState(true);
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [showAddDept, setShowAddDept] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<EmpFormState>(EMPTY_EMP_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const [empForm, setEmpForm] = useState<EmpFormState>(EMPTY_EMP_FORM);
  const [empLoading, setEmpLoading] = useState(false);
  const [empError, setEmpError] = useState('');
  const [empSuccess, setEmpSuccess] = useState('');
  /** Branches available for the selected department in the employee form */
  const [deptBranches, setDeptBranches] = useState<Department[]>([]);
  /** Meta (times, flexGroup) for the currently selected dept in the employee form */
  const [selectedDeptMeta, setSelectedDeptMeta] = useState<Department | null>(null);

  const [deptForm, setDeptForm] = useState({
    name: '', branchName: '', officialStartTime: '09:00', officialEndTime: '17:30', flexibleGroup: false
  });
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptError, setDeptError] = useState('');
  const [deptSuccess, setDeptSuccess] = useState('');
  const [deleteDeptError, setDeleteDeptError] = useState('');
  const [deleteEmpError, setDeleteEmpError] = useState('');
  const [empListSuccess, setEmpListSuccess] = useState('');

  const [catForm, setCatForm] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState('');
  const [catSuccess, setCatSuccess] = useState('');

  const canDeleteEmployees = isAdmin(getAuth());

  const fetchData = async () => {
    setLoadingEmp(true);
    try {
      const [empRes, deptRes, catRes] = await Promise.allSettled([getEmployees(), getDepartments(), getCategories()]);
      if (empRes.status === 'fulfilled') {
        const empData = empRes.value.data;
        setEmployees(Array.isArray(empData) ? empData : empData?.content || empData?.data || []);
      }
      if (deptRes.status === 'fulfilled') {
        const deptData = deptRes.value.data;
        setDepartments(Array.isArray(deptData) ? deptData : deptData?.content || deptData?.data || []);
      }
      if (catRes.status === 'fulfilled') {
        const catData = catRes.value.data;
        setCategories(Array.isArray(catData) ? catData : []);
      }
    } finally {
      setLoadingEmp(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpError(''); setEmpSuccess('');
    setEmpLoading(true);
    try {
      await createEmployee({
        name: empForm.name,
        jobTitle: empForm.jobTitle,
        departmentName: empForm.department,
        branchName: empForm.branchName || undefined,
        baseSalary: Number(empForm.salary),
        category: empForm.category || undefined,
        shiftType: empForm.shiftType || undefined,
        hiringDate: empForm.hiringDate || undefined,
        contractExpiry: empForm.contractExpiry || undefined,
        insuranceNumber: empForm.insuranceNumber || undefined,
        flexibleSchedule: empForm.flexibleSchedule || undefined,
        hasSocialInsurance: empForm.hasSocialInsurance || undefined,
        applyMartyrsFund: empForm.applyMartyrsFund,
        bankAccount: empForm.bankAccount || undefined,
        age: empForm.age ? Number(empForm.age) : undefined,
      });
      setEmpSuccess('تم إضافة الموظف بنجاح!');
      setEmpForm(EMPTY_EMP_FORM);
      setDeptBranches([]);
      setSelectedDeptMeta(null);
      setShowAddEmp(false);
      fetchData();
    } catch (err: unknown) {
      setEmpError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setEmpLoading(false);
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptError(''); setDeptSuccess('');
    setDeptLoading(true);
    try {
      await createDepartment({
        departmentName: deptForm.name,
        branchName: deptForm.branchName || undefined,
        officialStart: deptForm.officialStartTime || '09:00',
        officialEnd: deptForm.officialEndTime || '17:30',
        flexibleGroup: deptForm.flexibleGroup,
      });
      setDeptSuccess('تم إضافة القسم / الموقع بنجاح!');
      setDeptForm({ name: '', branchName: '', officialStartTime: '09:00', officialEndTime: '17:30', flexibleGroup: false });
      setShowAddDept(false);
      fetchData();
    } catch (err: unknown) {
      setDeptError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setDeptLoading(false);
    }
  };

  const handleDeleteDept = async (id: number) => {
    setDeleteDeptError('');
    try {
      await deleteDepartment(id);
      fetchData();
    } catch (err: unknown) {
      setDeleteDeptError(err instanceof Error ? err.message : 'لا يمكن الحذف');
    }
  };

  const handleDeleteEmployee = async (emp: Employee) => {
    if (emp.employeeId == null && !emp.employeeCode) {
      setDeleteEmpError('لا يمكن التعرف على الموظف — أعد تحميل الصفحة.');
      return;
    }
    setDeleteEmpError('');
    const ok = window.confirm(
      `حذف "${emp.name}" نهائياً؟\n\nسيتم حذف سجلات الحضور والرواتب والجزاءات والقروض المرتبطة به إن وجدت.`
    );
    if (!ok) return;
    try {
      await deleteEmployee({ employeeId: emp.employeeId, employeeCode: emp.employeeCode });
      if (editingEmp?.name === emp.name) setEditingEmp(null);
      await fetchData();
      setEmpListSuccess('تم حذف الموظف بنجاح');
    } catch (err: unknown) {
      setDeleteEmpError(err instanceof Error ? err.message : 'تعذر حذف الموظف');
    }
  };

  /** Handles department name change in the employee form: auto-fills shift times and loads branches. */
  const handleDeptNameChange = (deptName: string) => {
    setEmpForm(p => ({ ...p, department: deptName, branchName: '' }));
    if (!deptName) { setDeptBranches([]); setSelectedDeptMeta(null); return; }
    const meta = departments.find(d => d.departmentName === deptName);
    setSelectedDeptMeta(meta ?? null);
    const branches = departments.filter(d => d.departmentName === deptName && d.branchName);
    setDeptBranches(branches);
    if (meta?.flexibleGroup) setEmpForm(p => ({ ...p, flexibleSchedule: true }));
  };

  const openEdit = (emp: Employee) => {
    setEditError(''); setEditSuccess('');
    setEditForm({
      name:             emp.name ?? '',
      jobTitle:         emp.jobTitle ?? '',
      department:       emp.departmentName ?? '',
      branchName:       emp.branchName ?? '',
      salary:           emp.baseSalary != null ? String(emp.baseSalary) : '',
      category:         emp.category ?? '',
      shiftType:        (emp.shiftType as ShiftType | '') ?? '',
      hiringDate:       emp.hiringDate ?? '',
      contractExpiry:   emp.contractExpiry ?? '',
      insuranceNumber:  emp.insuranceNumber ?? '',
      flexibleSchedule: emp.flexibleSchedule ?? false,
      hasSocialInsurance: emp.hasSocialInsurance ?? false,
      applyMartyrsFund: emp.applyMartyrsFund !== false,
      bankAccount:      emp.bankAccount ?? '',
      age:              emp.age != null ? String(emp.age) : '',
    });
    setEditingEmp(emp);
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    setEditError(''); setEditSuccess(''); setEditLoading(true);
    try {
      await updateEmployee(editingEmp.name, {
        jobTitle:          editForm.jobTitle         || undefined,
        departmentName:    editForm.department        || undefined,
        branchName:        editForm.branchName        || undefined,
        baseSalary:        editForm.salary ? Number(editForm.salary) : undefined,
        category:          editForm.category          || undefined,
        shiftType:         editForm.shiftType         || undefined,
        hiringDate:        editForm.hiringDate        || undefined,
        contractExpiry:    editForm.contractExpiry    || undefined,
        insuranceNumber:   editForm.insuranceNumber   || undefined,
        flexibleSchedule:  editForm.flexibleSchedule,
        hasSocialInsurance: editForm.hasSocialInsurance,
        applyMartyrsFund: editForm.applyMartyrsFund,
        bankAccount:       editForm.bankAccount       || undefined,
        age:               editForm.age ? Number(editForm.age) : undefined,
      });
      setEditSuccess('تم تحديث بيانات الموظف بنجاح!');
      fetchData();
      setTimeout(() => setEditingEmp(null), 900);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError(''); setCatSuccess('');
    setCatLoading(true);
    try {
      await createCategory({ name: catForm });
      setCatSuccess('تم إضافة الفئة بنجاح!');
      setCatForm('');
      setShowAddCat(false);
      fetchData();
    } catch (err: unknown) {
      setCatError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setCatLoading(false);
    }
  };

  /** Unique department names for the first dropdown in the employee form */
  const uniqueDeptNames = useMemo(() =>
    [...new Set(departments.map(d => d.departmentName))], [departments]);

  /** Rate calculator — derived from salary input, no separate state needed */
  const rateCalc = useMemo(() => {
    const s = Number(empForm.salary);
    if (!s || s <= 0) return null;
    const daily  = s / 30;
    const hourly = daily / 8;
    const second = hourly / 3600;
    return { daily: daily.toFixed(2), hourly: hourly.toFixed(4), second: second.toFixed(8) };
  }, [empForm.salary]);

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-cairo";
  const labelClass = "block text-sm font-medium text-foreground font-cairo mb-1";

  return (
    <div className="space-y-6">
      <PageHeader title="إدارة الموظفين"  subtitle="عرض وإضافة الموظفين والأقسام" />

      {/* Departments Section */}
      <FormSection>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" style={{ color: 'hsl(var(--gold-dark))' }} />
            <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>الأقسام</h3>
          </div>
          <button onClick={() => setShowAddDept(!showAddDept)} className="flex items-center gap-2 navy-btn text-xs px-4 py-2">
            {showAddDept ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showAddDept ? 'إلغاء' : 'إضافة قسم جديد'}
          </button>
        </div>

        {deptSuccess && <SuccessAlert message={deptSuccess} />}
        {deptError && <ErrorAlert message={deptError} />}

        {showAddDept && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleAddDept} className="mb-4 p-4 rounded-lg border border-border bg-muted/30 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>اسم القسم <span className="text-destructive">*</span></label>
                <input className={inputClass} value={deptForm.name} placeholder="مثال: إدارة المبيعات"
                  onChange={e => setDeptForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className={labelClass}>الموقع / الفرع (اختياري)</label>
                <input className={inputClass} value={deptForm.branchName} placeholder="مثال: التجمع الخامس"
                  onChange={e => setDeptForm(p => ({ ...p, branchName: e.target.value }))} />
                <p className="text-xs text-muted-foreground font-cairo mt-0.5">اتركه فارغاً إذا لم يكن للقسم مواقع متعددة</p>
              </div>
              <div>
                <label className={labelClass}>وقت الحضور الرسمي</label>
                <input type="time" className={inputClass} value={deptForm.officialStartTime}
                  onChange={e => setDeptForm(p => ({ ...p, officialStartTime: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>وقت الانصراف الرسمي</label>
                <input type="time" className={inputClass} value={deptForm.officialEndTime}
                  onChange={e => setDeptForm(p => ({ ...p, officialEndTime: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border"
              style={{ background: deptForm.flexibleGroup ? 'hsl(142 76% 36% / 0.05)' : undefined }}>
              <input type="checkbox" id="deptFlexibleGroup" checked={deptForm.flexibleGroup}
                onChange={e => setDeptForm(p => ({ ...p, flexibleGroup: e.target.checked }))}
                className="w-4 h-4 rounded" style={{ accentColor: 'hsl(var(--navy))' }} />
              <div>
                <label htmlFor="deptFlexibleGroup" className="text-sm font-medium font-cairo cursor-pointer"
                  style={{ color: 'hsl(var(--navy))' }}>
                  مجموعة مرنة / Flexible Group (الإدارة العليا)
                </label>
                <p className="text-xs text-muted-foreground font-cairo">
                  موظفو هذا القسم مستثنون تلقائياً من خصومات التأخير والغياب
                </p>
              </div>
            </div>
            <button type="submit" className="gold-btn" disabled={deptLoading}>
              {deptLoading ? 'جاري الإضافة...' : 'حفظ القسم / الموقع'}
            </button>
          </motion.form>
        )}

        {deleteDeptError && <ErrorAlert message={deleteDeptError} />}

        {departments.length === 0 ? (
          <p className="text-sm text-muted-foreground font-cairo">لا توجد أقسام مسجلة</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border mt-2">
            <table className="data-table">
              <thead>
                <tr>
                  <th>القسم</th>
                  <th>الموقع</th>
                  <th>وقت الحضور</th>
                  <th>وقت الانصراف</th>
                  <th>نوع المجموعة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d, i) => (
                  <tr key={i}>
                    <td className="font-cairo font-medium">{d.departmentName}</td>
                    <td className="font-cairo text-muted-foreground">{d.branchName || '—'}</td>
                    <td className="font-mono text-sm">{d.officialStart || '—'}</td>
                    <td className="font-mono text-sm">{d.officialEnd || '—'}</td>
                    <td>
                      {d.flexibleGroup ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-cairo font-medium"
                          style={{ background: 'hsl(142 76% 36% / 0.1)', color: 'hsl(142 76% 36%)' }}>
                          مرن ✓
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-cairo font-medium"
                          style={{ background: 'hsl(var(--navy) / 0.08)', color: 'hsl(var(--navy))' }}>
                          عادي
                        </span>
                      )}
                    </td>
                    <td>
                      <button onClick={() => d.id && handleDeleteDept(d.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                        title="حذف">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FormSection>

      {/* Categories Section */}
      <FormSection>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" style={{ color: 'hsl(var(--gold-dark))' }} />
            <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>فئات الموظفين</h3>
          </div>
          <button onClick={() => setShowAddCat(!showAddCat)} className="flex items-center gap-2 navy-btn text-xs px-4 py-2">
            {showAddCat ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showAddCat ? 'إلغاء' : 'إضافة فئة جديدة'}
          </button>
        </div>

        {catSuccess && <SuccessAlert message={catSuccess} />}
        {catError && <ErrorAlert message={catError} />}

        {showAddCat && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleAddCategory} className="mb-4 p-4 rounded-lg border border-border bg-muted/30 space-y-4">
            <div>
              <label className={labelClass}>اسم الفئة <span className="text-destructive">*</span></label>
              <input className={inputClass} value={catForm} placeholder="مثال: ادارة السواقين"
                onChange={e => setCatForm(e.target.value)} required />
            </div>
            <button type="submit" className="gold-btn" disabled={catLoading}>
              {catLoading ? 'جاري الإضافة...' : 'حفظ الفئة'}
            </button>
          </motion.form>
        )}

        <div className="flex flex-wrap gap-2">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground font-cairo">لا توجد فئات مسجلة</p>
          ) : categories.map((c, i) => (
            <span key={i} className="px-3 py-1.5 rounded-full text-sm font-cairo font-medium border"
              style={{ background: 'hsl(var(--gold) / 0.12)', color: 'hsl(var(--gold-dark))', borderColor: 'hsl(var(--gold) / 0.3)' }}>
              {c.name}
            </span>
          ))}
        </div>
      </FormSection>

      {/* Add Employee Form */}
      <FormSection>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
            <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>إضافة موظف جديد</h3>
          </div>
          <button onClick={() => setShowAddEmp(!showAddEmp)} className="flex items-center gap-2 gold-btn text-xs px-4 py-2">
            {showAddEmp ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showAddEmp ? 'إلغاء' : 'إضافة موظف'}
          </button>
        </div>

        {empSuccess && <SuccessAlert message={empSuccess} />}
        {empError && <ErrorAlert message={empError} />}

        {showAddEmp && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleAddEmployee} className="mb-4 p-4 rounded-lg border border-border bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelClass}>الاسم الكامل <span className="text-destructive">*</span></label>
                <input className={inputClass} value={empForm.name} placeholder="الاسم بالكامل"
                  onChange={e => setEmpForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className={labelClass}>المسمى الوظيفي <span className="text-destructive">*</span></label>
                <input className={inputClass} value={empForm.jobTitle} placeholder="مثال: محاسب قانوني"
                  onChange={e => setEmpForm(p => ({ ...p, jobTitle: e.target.value }))} required />
              </div>

              {/* Cascaded: Department → Location */}
              <div>
                <label className={labelClass}>القسم <span className="text-destructive">*</span></label>
                <select className={inputClass} value={empForm.department}
                  onChange={e => handleDeptNameChange(e.target.value)} required>
                  <option value="">-- اختر القسم --</option>
                  {uniqueDeptNames.map((name, i) => (
                    <option key={i} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              {deptBranches.length > 0 && (
                <div>
                  <label className={labelClass}>الموقع / الفرع <span className="text-destructive">*</span></label>
                  <select className={inputClass} value={empForm.branchName}
                    onChange={e => setEmpForm(p => ({ ...p, branchName: e.target.value }))} required>
                    <option value="">-- اختر الموقع --</option>
                    {deptBranches.map((b, i) => (
                      <option key={i} value={b.branchName}>{b.branchName}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Shift time auto-fill display */}
              {selectedDeptMeta && (
                <div className="p-3 rounded-lg border border-border flex items-center gap-2"
                  style={{ background: 'hsl(var(--navy) / 0.04)' }}>
                  <Clock className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--navy))' }} />
                  <div>
                    <p className="text-xs text-muted-foreground font-cairo">وقت الدوام المحدد تلقائياً</p>
                    <p className="text-sm font-semibold font-mono" style={{ color: 'hsl(var(--navy))' }}>
                      {selectedDeptMeta.officialStart} — {selectedDeptMeta.officialEnd}
                    </p>
                    {selectedDeptMeta.flexibleGroup && (
                      <p className="text-xs font-cairo mt-0.5" style={{ color: 'hsl(142 76% 36%)' }}>
                        ✓ مجموعة مرنة — مستثنى من الخصومات
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>الراتب الأساسي (EGP) <span className="text-destructive">*</span></label>
                <input type="number" className={inputClass} value={empForm.salary} placeholder="0.00"
                  onChange={e => setEmpForm(p => ({ ...p, salary: e.target.value }))} required min={0} />
              </div>
              <div>
                <label className={labelClass}>الفئة</label>
                <select className={inputClass} value={empForm.category}
                  onChange={e => setEmpForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="">-- اختر الفئة --</option>
                  {categories.map((c, i) => (
                    <option key={i} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>نوع الوردية</label>
                <select className={inputClass} value={empForm.shiftType}
                  onChange={e => setEmpForm(p => ({ ...p, shiftType: e.target.value as ShiftType | '' }))}>
                  <option value="">-- اختر الوردية --</option>
                  <option value="MORNING">صباحية</option>
                  <option value="EVENING">مسائية</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>تاريخ التعيين</label>
                <input type="date" className={inputClass} value={empForm.hiringDate}
                  onChange={e => setEmpForm(p => ({ ...p, hiringDate: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>انتهاء العقد</label>
                <input type="date" className={inputClass} value={empForm.contractExpiry}
                  onChange={e => setEmpForm(p => ({ ...p, contractExpiry: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>رقم التأمين</label>
                <input className={inputClass} value={empForm.insuranceNumber} placeholder="رقم التأمين الاجتماعي"
                  onChange={e => setEmpForm(p => ({ ...p, insuranceNumber: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>رقم الحساب البنكي / Bank Account</label>
                <input className={inputClass} value={empForm.bankAccount} placeholder="للتحويل البنكي الشهري"
                  onChange={e => setEmpForm(p => ({ ...p, bankAccount: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>العمر / Age</label>
                <input type="number" min="18" max="70" className={inputClass} value={empForm.age}
                  placeholder="مثال: 35"
                  onChange={e => setEmpForm(p => ({ ...p, age: e.target.value }))} />
                <p className="text-xs text-muted-foreground font-cairo mt-1">
                  ≥ 50 سنة → رصيد إجازة 30 يوم (القانون المصري). الافتراضي: 21 يوم.
                </p>
              </div>
            </div>

            {/* Rate Calculator */}
            {rateCalc && (
              <div className="mb-4 p-3 rounded-lg border border-border"
                style={{ background: 'hsl(var(--gold) / 0.06)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4" style={{ color: 'hsl(var(--gold-dark))' }} />
                  <span className="text-xs font-cairo font-semibold" style={{ color: 'hsl(var(--gold-dark))' }}>
                    حاسبة المعدلات / Rate Calculator
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'المعدل اليومي', en: 'Daily Rate', val: rateCalc.daily },
                    { label: 'المعدل بالساعة', en: 'Hourly Rate', val: rateCalc.hourly },
                    { label: 'المعدل بالثانية', en: 'Second Rate', val: rateCalc.second },
                  ].map(({ label, en, val }) => (
                    <div key={en} className="text-center p-2 rounded-md bg-white border border-border">
                      <p className="text-xs text-muted-foreground font-cairo">{label}</p>
                      <p className="text-xs text-muted-foreground">{en}</p>
                      <p className="text-sm font-semibold font-mono mt-1" style={{ color: 'hsl(var(--navy))' }}>
                        {val}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SI Checkbox */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border mb-2"
              style={{ background: empForm.hasSocialInsurance ? 'hsl(220 70% 50% / 0.05)' : undefined }}>
              <input type="checkbox" id="hasSocialInsurance" checked={empForm.hasSocialInsurance}
                onChange={e => setEmpForm(p => ({ ...p, hasSocialInsurance: e.target.checked }))}
                className="w-4 h-4 rounded" style={{ accentColor: 'hsl(var(--navy))' }} />
              <div>
                <label htmlFor="hasSocialInsurance" className="text-sm font-medium font-cairo cursor-pointer"
                  style={{ color: 'hsl(var(--navy))' }}>
                  <Shield className="w-3.5 h-3.5 inline mr-1" />
                  تأمين اجتماعي / Social Insurance (11%)
                </label>
                <p className="text-xs text-muted-foreground font-cairo">
                  يُفعّل خصم التأمين الاجتماعي في كشف الراتب
                </p>
              </div>
            </div>

            {/* Martyrs' Fund checkbox */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border mb-2"
              style={{ background: empForm.applyMartyrsFund ? 'hsl(220 70% 50% / 0.05)' : undefined }}>
              <input type="checkbox" id="applyMartyrsFund" checked={empForm.applyMartyrsFund}
                onChange={e => setEmpForm(p => ({ ...p, applyMartyrsFund: e.target.checked }))}
                className="w-4 h-4 rounded" style={{ accentColor: 'hsl(var(--navy))' }} />
              <div>
                <label htmlFor="applyMartyrsFund" className="text-sm font-medium font-cairo cursor-pointer"
                  style={{ color: 'hsl(var(--navy))' }}>
                  <Heart className="w-3.5 h-3.5 inline mr-1" />
                  صندوق الشهداء / Martyrs Fund
                </label>
                <p className="text-xs text-muted-foreground font-cairo">
                  يُفعّل خصم صندوق الشهداء في كشف الراتب
                </p>
              </div>
            </div>

            {/* Flexible Schedule toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border mt-2"
              style={{ background: empForm.flexibleSchedule ? 'hsl(142 76% 36% / 0.05)' : undefined }}>
              <input
                type="checkbox"
                id="flexibleSchedule"
                checked={empForm.flexibleSchedule}
                onChange={e => setEmpForm(p => ({ ...p, flexibleSchedule: e.target.checked }))}
                className="w-4 h-4 rounded accent-current"
                style={{ accentColor: 'hsl(var(--navy))' }}
              />
              <div>
                <label htmlFor="flexibleSchedule" className="text-sm font-medium font-cairo cursor-pointer"
                  style={{ color: 'hsl(var(--navy))' }}>
                  جدول مرن / Flexible Schedule
                </label>
                <p className="text-xs text-muted-foreground font-cairo">
                  استثناء من خصومات التأخير والانصراف المبكر والغياب (Task 2 exemption)
                </p>
              </div>
            </div>

            <button type="submit" className="navy-btn" disabled={empLoading}>
              {empLoading ? 'جاري الإضافة...' : 'حفظ الموظف'}
            </button>
          </motion.form>
        )}
      </FormSection>

      {/* Employees Table */}
      <div className="form-section overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
            قائمة الموظفين
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: 'hsl(var(--navy) / 0.1)', color: 'hsl(var(--navy))' }}>
            {employees.length}
          </span>
        </div>
        {!canDeleteEmployees && (
          <p className="text-xs font-cairo text-amber-800 dark:text-amber-200 mb-2 px-1 rounded-md border border-amber-300/50 bg-amber-500/10">
            الحذف والإضافة يتطلبان حساب <strong>مسؤول (Admin)</strong>. إذا ظهر تأكيد الحذف ثم لم يُحذف الصف، غالباً أنت مسجّل كمستخدم عادي — سجّل الخروج ثم ادخل بحساب Admin (مثل Yasser Basher).
          </p>
        )}
        {empListSuccess && <SuccessAlert message={empListSuccess} />}
        {deleteEmpError && <ErrorAlert message={deleteEmpError} />}
        {loadingEmp ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الكود</th>
                  <th>الاسم</th>
                  <th>المسمى الوظيفي</th>
                  <th>القسم / الموقع</th>
                  <th>الدوام</th>
                  <th>الفئة</th>
                  <th>SI</th>
                  <th>MF</th>
                  <th>مرن</th>
                  <th>الراتب</th>
                  <th>رصيد الإجازة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr><td colSpan={13} className="text-center py-8 text-muted-foreground font-cairo">لا يوجد موظفون مسجلون</td></tr>
                ) : employees.map((emp, i) => (
                  <motion.tr key={emp.employeeId ?? `emp-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td className="text-muted-foreground">{i + 1}</td>
                    <td className="font-mono text-xs text-muted-foreground">{emp.employeeCode || '—'}</td>
                    <td className="font-cairo font-medium">{emp.name}</td>
                    <td className="font-cairo text-muted-foreground text-xs">{emp.jobTitle}</td>
                    <td>
                      <span className="px-2 py-1 rounded-md text-xs font-cairo font-medium"
                        style={{ background: 'hsl(var(--gold) / 0.15)', color: 'hsl(var(--gold-dark))' }}>
                        {emp.departmentName || '-'}
                      </span>
                      {emp.branchName && (
                        <span className="ml-1 px-2 py-0.5 rounded text-xs font-cairo"
                          style={{ background: 'hsl(var(--gold) / 0.08)', color: 'hsl(var(--gold-dark))' }}>
                          {emp.branchName}
                        </span>
                      )}
                    </td>
                    <td className="font-mono text-xs">
                      {emp.officialStart ? `${emp.officialStart}–${emp.officialEnd}` : '—'}
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded-md text-xs font-cairo font-medium"
                        style={{ background: 'hsl(var(--navy) / 0.08)', color: 'hsl(var(--navy))' }}>
                        {emp.category || '—'}
                      </span>
                    </td>
                    <td>
                      {emp.hasSocialInsurance
                        ? <span className="text-xs font-bold" style={{ color: 'hsl(142 76% 36%)' }}>✓</span>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td>
                      {emp.applyMartyrsFund !== false
                        ? <span className="text-xs font-bold" style={{ color: 'hsl(142 76% 36%)' }}>✓</span>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td>
                      {(emp.flexibleSchedule || emp.deptFlexibleGroup)
                        ? <span className="text-xs font-bold" style={{ color: 'hsl(142 76% 36%)' }}>✓</span>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="font-semibold" style={{ color: 'hsl(var(--navy))' }}>
                      {emp.baseSalary ? Number(emp.baseSalary).toLocaleString('ar-EG') : '0'} جنيه
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold font-cairo"
                        style={{
                          background: (emp.vacationBalance ?? 21) <= 5
                            ? 'hsl(0 84% 60% / 0.12)' : 'hsl(142 76% 36% / 0.1)',
                          color: (emp.vacationBalance ?? 21) <= 5
                            ? 'hsl(0 84% 50%)' : 'hsl(142 76% 30%)',
                        }}>
                        {emp.vacationBalance ?? 21} يوم
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        <button
                          type="button"
                          onClick={() => openEdit(emp)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-cairo font-medium border transition-colors hover:bg-muted/40"
                          style={{ borderColor: 'hsl(var(--navy) / 0.25)', color: 'hsl(var(--navy))' }}
                          title="تعديل بيانات الموظف">
                          <Pencil className="w-3 h-3" /> تعديل
                        </button>
                        {canDeleteEmployees ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteEmployee(emp)}
                            className="p-1.5 rounded-lg border border-destructive/30 hover:bg-destructive/10 transition-colors disabled:opacity-40"
                            title="حذف الموظف"
                            disabled={
                              (emp.employeeId === undefined || emp.employeeId === null || emp.employeeId === '')
                              && !emp.employeeCode
                            }>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Edit Employee Modal ─── */}
      <AnimatePresence>
        {editingEmp && (
          <motion.div
            key="edit-modal-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setEditingEmp(null); }}
          >
            <motion.div
              key="edit-modal"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{    opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border"
                style={{ background: 'hsl(var(--navy) / 0.04)' }}>
                <div className="flex items-center gap-2">
                  <Pencil className="w-5 h-5" style={{ color: 'hsl(var(--navy))' }} />
                  <div>
                    <p className="font-cairo font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>
                      تعديل بيانات الموظف
                    </p>
                    <p className="text-xs text-muted-foreground font-cairo">{editingEmp.name} — {editingEmp.employeeCode}</p>
                  </div>
                </div>
                <button onClick={() => setEditingEmp(null)}
                  className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleEditEmployee} className="p-6 space-y-5">
                {editSuccess && <SuccessAlert message={editSuccess} />}
                {editError   && <ErrorAlert   message={editError}   />}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Name — read-only (PK) */}
                  <div>
                    <label className={labelClass}>الاسم الكامل (لا يمكن تغييره)</label>
                    <input className={inputClass + ' bg-muted/40 cursor-not-allowed'}
                      value={editForm.name} readOnly />
                  </div>

                  <div>
                    <label className={labelClass}>المسمى الوظيفي</label>
                    <input className={inputClass} value={editForm.jobTitle} placeholder="مثال: محاسب قانوني"
                      onChange={e => setEditForm(p => ({ ...p, jobTitle: e.target.value }))} />
                  </div>

                  <div>
                    <label className={labelClass}>القسم</label>
                    <select className={inputClass} value={editForm.department}
                      onChange={e => setEditForm(p => ({ ...p, department: e.target.value, branchName: '' }))}>
                      <option value="">-- اختر القسم --</option>
                      {uniqueDeptNames.map((n, i) => <option key={i} value={n}>{n}</option>)}
                    </select>
                  </div>

                  {departments.filter(d => d.departmentName === editForm.department && d.branchName).length > 0 && (
                    <div>
                      <label className={labelClass}>الموقع / الفرع</label>
                      <select className={inputClass} value={editForm.branchName}
                        onChange={e => setEditForm(p => ({ ...p, branchName: e.target.value }))}>
                        <option value="">-- اختر الموقع --</option>
                        {departments
                          .filter(d => d.departmentName === editForm.department && d.branchName)
                          .map((b, i) => <option key={i} value={b.branchName!}>{b.branchName}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>الراتب الأساسي (جنيه)</label>
                    <input type="number" className={inputClass} value={editForm.salary} placeholder="0.00" min={0}
                      onChange={e => setEditForm(p => ({ ...p, salary: e.target.value }))} />
                  </div>

                  <div>
                    <label className={labelClass}>الفئة</label>
                    <select className={inputClass} value={editForm.category}
                      onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}>
                      <option value="">-- اختر الفئة --</option>
                      {categories.map((c, i) => <option key={i} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>نوع الوردية</label>
                    <select className={inputClass} value={editForm.shiftType}
                      onChange={e => setEditForm(p => ({ ...p, shiftType: e.target.value as ShiftType | '' }))}>
                      <option value="">-- اختر --</option>
                      <option value="MORNING">صباحية</option>
                      <option value="EVENING">مسائية</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>تاريخ التعيين</label>
                    <input type="date" className={inputClass} value={editForm.hiringDate}
                      onChange={e => setEditForm(p => ({ ...p, hiringDate: e.target.value }))} />
                  </div>

                  <div>
                    <label className={labelClass}>انتهاء العقد</label>
                    <input type="date" className={inputClass} value={editForm.contractExpiry}
                      onChange={e => setEditForm(p => ({ ...p, contractExpiry: e.target.value }))} />
                  </div>

                  <div>
                    <label className={labelClass}>رقم التأمين</label>
                    <input className={inputClass} value={editForm.insuranceNumber} placeholder="رقم التأمين الاجتماعي"
                      onChange={e => setEditForm(p => ({ ...p, insuranceNumber: e.target.value }))} />
                  </div>

                  <div>
                    <label className={labelClass}>رقم الحساب البنكي</label>
                    <input className={inputClass} value={editForm.bankAccount} placeholder="للتحويل البنكي"
                      onChange={e => setEditForm(p => ({ ...p, bankAccount: e.target.value }))} />
                  </div>

                  <div>
                    <label className={labelClass}>العمر</label>
                    <input type="number" min="18" max="70" className={inputClass} value={editForm.age} placeholder="35"
                      onChange={e => setEditForm(p => ({ ...p, age: e.target.value }))} />
                    <p className="text-xs text-muted-foreground font-cairo mt-1">≥ 50 → رصيد إجازة 30 يوم</p>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border"
                    style={{ background: editForm.hasSocialInsurance ? 'hsl(220 70% 50% / 0.05)' : undefined }}>
                    <input type="checkbox" id="edit-si" checked={editForm.hasSocialInsurance}
                      onChange={e => setEditForm(p => ({ ...p, hasSocialInsurance: e.target.checked }))}
                      className="w-4 h-4 rounded" style={{ accentColor: 'hsl(var(--navy))' }} />
                    <label htmlFor="edit-si" className="text-sm font-medium font-cairo cursor-pointer"
                      style={{ color: 'hsl(var(--navy))' }}>
                      <Shield className="w-3.5 h-3.5 inline mr-1" /> تأمين اجتماعي (11%)
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border"
                    style={{ background: editForm.applyMartyrsFund ? 'hsl(220 70% 50% / 0.05)' : undefined }}>
                    <input type="checkbox" id="edit-mf" checked={editForm.applyMartyrsFund}
                      onChange={e => setEditForm(p => ({ ...p, applyMartyrsFund: e.target.checked }))}
                      className="w-4 h-4 rounded" style={{ accentColor: 'hsl(var(--navy))' }} />
                    <label htmlFor="edit-mf" className="text-sm font-medium font-cairo cursor-pointer"
                      style={{ color: 'hsl(var(--navy))' }}>
                      <Heart className="w-3.5 h-3.5 inline mr-1" /> صندوق الشهداء
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border"
                    style={{ background: editForm.flexibleSchedule ? 'hsl(142 76% 36% / 0.05)' : undefined }}>
                    <input type="checkbox" id="edit-flex" checked={editForm.flexibleSchedule}
                      onChange={e => setEditForm(p => ({ ...p, flexibleSchedule: e.target.checked }))}
                      className="w-4 h-4 rounded" style={{ accentColor: 'hsl(var(--navy))' }} />
                    <label htmlFor="edit-flex" className="text-sm font-medium font-cairo cursor-pointer"
                      style={{ color: 'hsl(var(--navy))' }}>
                      جدول مرن (مستثنى من خصومات الوقت)
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="navy-btn flex-1" disabled={editLoading}>
                    {editLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                  <button type="button" onClick={() => setEditingEmp(null)}
                    className="flex-1 py-2.5 px-4 rounded-lg border border-border text-sm font-cairo font-medium hover:bg-muted/40">
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}