import React from 'react';

type DeptWorkTime = { departmentName?: string | null } | null | undefined;

export type EmployeeForSelect = {
  /** Surrogate PK from backend (optional on older payloads) */
  employeeId?: number | null;
  name: string;
  employeeCode?: string | null;
  status?: string | null;
  departmentName?: string | null;
  departmentWorkTime?: DeptWorkTime;
};

function normalizeDepartment(e: EmployeeForSelect): string {
  const dept =
    e.departmentName ??
    e.departmentWorkTime?.departmentName ??
    '—';
  return (dept ?? '—').toString().trim() || '—';
}

function normalizeStatus(e: EmployeeForSelect): 'Active' | 'Inactive' {
  const s = (e.status ?? 'ACTIVE').toString().toUpperCase();
  return s === 'ACTIVE' ? 'Active' : 'Inactive';
}

function optionLabel(e: EmployeeForSelect): string {
  const code = (e.employeeCode ?? '').toString().trim();
  const status = normalizeStatus(e);
  return `${code ? `${code} - ` : ''}${e.name} (${status})`;
}

export function EmployeeOptionGroups({
  employees,
  includeInactive = true,
}: {
  employees: EmployeeForSelect[];
  includeInactive?: boolean;
}) {
  const list = Array.isArray(employees) ? employees : [];

  const filtered = includeInactive
    ? list
    : list.filter(e => normalizeStatus(e) === 'Active');

  const byDept = new Map<string, EmployeeForSelect[]>();
  for (const e of filtered) {
    const dept = normalizeDepartment(e);
    const arr = byDept.get(dept) ?? [];
    arr.push(e);
    byDept.set(dept, arr);
  }

  const deptNames = Array.from(byDept.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );

  return (
    <>
      {deptNames.map(dept => {
        const emps = (byDept.get(dept) ?? []).slice().sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        );
        return (
          <optgroup key={dept} label={dept}>
            {emps.map(emp => (
              <option key={emp.name} value={emp.name}>
                {optionLabel(emp)}
              </option>
            ))}
          </optgroup>
        );
      })}
    </>
  );
}

