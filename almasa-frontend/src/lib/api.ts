// import axios from 'axios';

// const api = axios.create({
//   baseURL: '', // embedded SPA: same origin; dev: Vite proxies /api → Spring (see vite.config.ts)
//   headers: { 'Content-Type': 'application/json' },
// });

// api.interceptors.response.use(
//   (res) => res,
//   (error) => {
//     const msg = error.response?.data?.message || error.response?.data?.error || error.message || 'حدث خطأ غير متوقع';
//     return Promise.reject(new Error(msg));
//   }
// );

// // --- Employees ---
// export const getEmployees = () => api.get('/api/employees');
// export const createEmployee = (data: unknown) => api.post('/api/employees', data);

// // --- Departments ---
// export const getDepartments = () => api.get('/api/departments');
// export const createDepartment = (data: unknown) => api.post('/api/departments', data);

// // --- Attendance ---
// export const postAttendance = (data: unknown) => api.post('/api/attendance', data);
// export const getAttendanceDefaults = () => api.get('/api/attendance/defaults');

// // --- Payroll ---
// export const calculatePayroll = (employeeName: string, year: number, month: number) =>
//   api.post(`/api/payroll/${encodeURIComponent(employeeName)}?year=${year}&month=${month}`);

// // --- Loans ---
// export const createLoan = (employeeName: string, data: unknown) =>
//   api.post(`/api/loans/${encodeURIComponent(employeeName)}`, data);

// // --- Reports ---
// export const getWeeklyReport = (data: { startDate: string; endDate: string }) =>
//   api.post('/api/reports/weekly', data);
// export const getCustomReport = (data: { fromDate: string; toDate: string; reportType: string }) =>
//   api.post('/api/reports/custom', data);
// export const exportReport = (data: unknown) =>
//   api.post('/api/reports/export', data, { responseType: 'blob' });

// export default api;


import axios from 'axios';
import { getAuth, clearAuth } from './auth';

/**
 * Same-origin production: empty baseURL → requests go to /api/... on the host that served the SPA.
 * Dev: Vite proxy forwards /api to the Spring Boot port from vite.config.ts.
 * Override only if the API is on another host: VITE_API_BASE_URL=https://api.example.com
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const auth = getAuth();
  if (auth?.token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers?.['Content-Type'];
  }
  return config;
});

export const BACKEND_UNREACHABLE_MESSAGE =
  'لا يوجد اتصال بالخادم — شغّل Spring Boot على المنفذ 8081 (من مجلد salaries_system: mvnw spring-boot:run)';

function axiosErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && !error.response) {
    const code = error.code;
    if (code === 'ECONNREFUSED' || code === 'ERR_NETWORK') {
      return BACKEND_UNREACHABLE_MESSAGE;
    }
  }
  const err = error as { response?: { data?: unknown; status?: number }; message?: string };
  const data = err.response?.data;
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const fromBody =
      (typeof d.message === 'string' && d.message) ||
      (typeof d.error === 'string' && d.error) ||
      (typeof d.detail === 'string' && d.detail);
    if (fromBody) return fromBody;
  }
  if (err.response?.status === 403) {
    return 'غير مصرّح لهذه العملية — تحقق من صلاحياتك أو حساب المسؤول (ADMIN) / Forbidden';
  }
  if (err.response?.status === 404) return 'المورد غير موجود — أعد تشغيل الخادم بعد التحديث / Not found';
  if (err.response?.status === 405) {
    return '405 — الخادم لا يقبل DELETE على هذا العنوان. أعد تشغيل Spring Boot بعد البناء / Method Not Allowed';
  }
  if (err.response?.status === 401) {
    return 'انتهت الجلسة — سجّل الدخول مجدداً / Session expired';
  }
  return err.message || 'حدث خطأ غير متوقع';
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuth();
      // Let UI handle redirect; we only clear local state.
    }
    return Promise.reject(new Error(axiosErrorMessage(error)));
  }
);

// --- Employees ---
export const getEmployees    = () => api.get('/api/employees');
export const createEmployee  = (data: unknown) => api.post('/api/employees', data);
export const updateEmployee  = (name: string, data: unknown) =>
  api.put(`/api/employees/${encodeURIComponent(name)}`, data);
/** Deletes by surrogate PK, or by {@link employeeCode} (e.g. EMP-051) if id is missing from list payload. */
export function deleteEmployee(emp: { employeeId?: number | string | null; employeeCode?: string | null }) {
  const rawId = emp.employeeId;
  const idNum =
    rawId !== undefined && rawId !== null && rawId !== ''
      ? Number(rawId)
      : NaN;
  const code = emp.employeeCode?.trim();
  if (Number.isFinite(idNum)) {
    return api.delete(`/api/employees/id/${Math.trunc(idNum)}`);
  }
  if (code) {
    return api.delete(`/api/employees/by-code/${encodeURIComponent(code)}`);
  }
  return Promise.reject(new Error('معرف الموظف أو كود الموظف غير متوفر — أعد تحميل الصفحة'));
}

// --- Departments ---
export const getDepartments = () => api.get('/api/departments');
export const getDepartmentUniqueNames = () => api.get('/api/departments/unique-names');
export const getDepartmentBranches = (departmentName: string) =>
  api.get('/api/departments/branches', { params: { departmentName } });
export const createDepartment = (data: {
  departmentName: string;
  branchName?: string;
  officialStart?: string;
  officialEnd?: string;
  flexibleGroup?: boolean;
}) => api.post('/api/departments', data);
export const deleteDepartment = (id: number) => api.delete(`/api/departments/${id}`);

// --- Categories ---
export const getCategories = () => api.get('/api/categories');
export const createCategory = (data: { name: string }) => api.post('/api/categories', data);
export const deleteCategory = (name: string) => api.delete(`/api/categories/${encodeURIComponent(name)}`);

// --- Branches ---
export const getBranches = () => api.get('/api/branches');
export const createBranch = (data: { name: string }) => api.post('/api/branches', data);
export const deleteBranch = (name: string) => api.delete(`/api/branches/${encodeURIComponent(name)}`);

// --- Attendance ---
export const postAttendance = (data: unknown) => api.post('/api/attendance', data);
export const getAttendanceDefaults = () => api.get('/api/attendance/defaults');

export interface AttendanceImportSummary {
  imported: unknown[];
  rowsRead: number;
  rowsImported: number;
  skippedDuplicate: number;
  skippedInvalidEmployee: number;
  skippedOther: number;
}

export const importAttendanceExcel = (formData: FormData) =>
  api.post<AttendanceImportSummary>('/api/attendance/import', formData);

/** Official import template (headers + sample row + instructions sheet). Sends JWT like other API calls. */
export const downloadAttendanceTemplate = () =>
  api.get('/api/attendance/template', { responseType: 'blob' });

// --- Absence ---
export const postAbsence = (data: {
  employeeName: string;
  date: string;
  absenceType: 'WITH_PERMISSION' | 'WITHOUT_PERMISSION';
  penaltyMultiplier?: number;
}) => api.post('/api/attendance/absence', data);

// ── SAP Infotype 2001/2006 — Vacation & Leave ──────────────────────────────
export type LeaveType = 'ANNUAL_LEAVE' | 'UNEXCUSED_ABSENCE' | 'MANUAL_DEDUCTION';

export const recordLeave = (data: {
  employeeName: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  manualDeductionAmount?: number;
  penaltyMultiplier?: number;
}) => api.post('/api/vacation/leave', data);

export const getVacationBalance = (employeeName: string) =>
  api.get(`/api/vacation/${encodeURIComponent(employeeName)}/balance`);

export const getLeaveHistory = (employeeName: string) =>
  api.get(`/api/vacation/${encodeURIComponent(employeeName)}/history`);

/**
 * Manager's global absence history screen.
 * All params are optional; omit to fetch all records.
 */
export const getAbsenceHistory = (
  name?: string,
  from?: string,
  to?: string,
) => {
  const params: Record<string, string> = {};
  if (name) params.name = name;
  if (from) params.from = from;
  if (to)   params.to   = to;
  return api.get('/api/vacation/history', { params });
};

export const exportAbsenceHistoryXlsx = (
  name?: string,
  from?: string,
  to?: string,
) => {
  const params: Record<string, string> = {};
  if (name) params.name = name;
  if (from) params.from = from;
  if (to)   params.to   = to;
  return api.get('/api/vacation/history/export', { params, responseType: 'blob' });
};

export const getAbsences = (employeeName: string) =>
  api.get('/api/attendance/absences', { params: { employeeName } });

export const detectNoPunch = (fromDate: string, toDate: string) =>
  api.get('/api/attendance/detect-no-punch', { params: { fromDate, toDate } });

// --- Auth ---
export const login = (data: { username: string; password: string }) =>
  api.post('/api/auth/login', data);

// --- Disciplinary Actions ---
export const postDisciplinary = (data: {
  employeeName: string;
  amount: number;
  reason: string;
  date: string;
}) => api.post('/api/disciplinary', data);

export const getDisciplinary = (employeeName: string) =>
  api.get(`/api/disciplinary/${encodeURIComponent(employeeName)}`);

// --- Payroll ---
export const calculatePayroll = (employeeName: string, year: number, month: number) =>
  api.post(`/api/payroll/${encodeURIComponent(employeeName)}?year=${year}&month=${month}`);

export const getPaySlip = (employeeName: string, year: number, month: number) =>
  api.get(`/api/payroll/${encodeURIComponent(employeeName)}/payslip`, {
    params: { year, month },
  });

export const exportPaySlip = (employeeName: string, year: number, month: number) =>
  api.get(`/api/payroll/${encodeURIComponent(employeeName)}/payslip/export`, {
    params: { year, month },
    responseType: 'blob',
  });

export const getTaxBreakdown = (employeeName: string, year: number, month: number) =>
  api.get(`/api/payroll/${encodeURIComponent(employeeName)}/tax-breakdown`, {
    params: { year, month },
  });

export const getCalculationLog = (employeeName: string, year: number, month: number) =>
  api.get(`/api/payroll/${encodeURIComponent(employeeName)}/calculation-log`, {
    params: { year, month },
  });

export const lockPayrollPeriod = (year: number, month: number) =>
  api.post('/api/payroll/lock', null, { params: { year, month } });

export const downloadBankTransfer = (year: number, month: number) =>
  api.get('/api/payroll/bank-transfer', {
    params: { year, month },
    responseType: 'blob',
  });

// --- Loans ---
export const createLoan = (employeeName: string, data: unknown) =>
  api.post(`/api/loans/${encodeURIComponent(employeeName)}`, data);

export const getEmployeeLoans = (employeeName: string) =>
  api.get(`/api/loans/${encodeURIComponent(employeeName)}`);

export const recordCashPayment = (loanId: number, amount: number) =>
  api.post(`/api/loans/${loanId}/cash-payment`, null, { params: { amount } });

export const getSettlementBalance = (employeeName: string) =>
  api.get(`/api/loans/${encodeURIComponent(employeeName)}/settlement`);

// --- Reports ---
export const getWeeklyReport = (data: { startDate: string; endDate: string }) =>
  api.post('/api/reports/weekly', data);

export const getCustomReport = (data: { fromDate: string; toDate: string; reportType: string }) =>
  api.post('/api/reports/custom', data);

export const exportReport = (data: unknown) =>
  api.post('/api/reports/export', data, { responseType: 'blob' });

export const getEmployeeReport = (data: {
  employeeName: string;
  fromDate: string;
  toDate: string;
}) => api.post('/api/reports/employee', data);

export const exportEmployeeReportXlsx = (
  data: { employeeName: string; fromDate: string; toDate: string },
  reportUser?: string,
) =>
  api.post('/api/reports/employee/export', data, {
    responseType: 'blob',
    /** Header values must be ISO-8859-1 for XHR; UTF-8 names are percent-encoded. */
    headers: reportUser ? { 'X-Report-User': encodeURIComponent(reportUser) } : undefined,
  });

export const exportDepartmentsAggregatedXlsx = (
  data: { fromDate: string; toDate: string },
  reportUser?: string,
) =>
  api.post('/api/reports/departments/aggregated/export', data, {
    responseType: 'blob',
    headers: reportUser ? { 'X-Report-User': encodeURIComponent(reportUser) } : undefined,
  });

export const getDepartmentReport = (data: {
  departmentName: string;
  fromDate: string;
  toDate: string;
}) => api.post('/api/reports/department', data);

// ── End-of-Service Settlement ─────────────────────────────────────────────────
export interface SettlementRequest {
  employeeName: string;
  terminationDate: string; // ISO date "YYYY-MM-DD"
}

export const previewSettlement = (data: SettlementRequest) =>
  api.post('/api/settlement/preview', data);

export const confirmSettlement = (data: SettlementRequest) =>
  api.post('/api/settlement/confirm', data);

/** Sends the calculated settlement back to the server to render as printable HTML. */
export const exportSettlementHtml = (data: unknown) =>
  api.post('/api/settlement/export', data, { responseType: 'text' });

// --- Audit (admin) ---
export interface AuditLogEntry {
  id: number;
  occurredAt: string;
  username: string;
  moduleName: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: string | null;
  valuesBefore: string | null;
  valuesAfter: string | null;
}

export interface AuditLogPage {
  content: AuditLogEntry[];
  totalElements: number;
  totalPages?: number;
  size?: number;
  number?: number;
}

export type AuditLogQuery = {
  page?: number;
  size?: number;
  username?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
};

export const getAuditLogs = (params: AuditLogQuery = {}) =>
  api.get<AuditLogPage>('/api/audit-logs', {
    params: {
      page: params.page ?? 0,
      size: params.size ?? 50,
      ...(params.username?.trim() ? { username: params.username.trim() } : {}),
      ...(params.action?.trim() ? { action: params.action.trim() } : {}),
      ...(params.fromDate ? { fromDate: params.fromDate } : {}),
      ...(params.toDate ? { toDate: params.toDate } : {}),
    },
  });

export default api;