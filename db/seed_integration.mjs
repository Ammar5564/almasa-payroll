import fs from 'node:fs/promises';

const BASE = 'http://localhost:8080';

async function readJson(path) {
  const raw = await fs.readFile(path, 'utf8');
  return JSON.parse(raw);
}

async function http(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json; charset=utf-8' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`${method} ${path} -> ${res.status} ${res.statusText}`);
    err.details = text;
    throw err;
  }
  return text ? JSON.parse(text) : null;
}

async function safeJson(method, path, body) {
  try {
    return { ok: true, data: await http(method, path, body) };
  } catch (e) {
    return { ok: false, error: e?.message ?? String(e), details: e?.details };
  }
}

function logErr(prefix, r) {
  console.error(prefix);
  if (r?.error) console.error('  error:', r.error);
  if (r?.details) console.error('  details:', r.details);
}

async function main() {
  const deptsPath = new URL('./departments_seed.json', import.meta.url);
  const empsPath  = new URL('./employees_seed.json', import.meta.url);

  const departments = await readJson(deptsPath);
  const employees   = await readJson(empsPath);

  // 1) Reset transactional data (employees + related)
  console.log('Resetting transactional data...');
  const reset = await safeJson('POST', '/api/dev/reset', { confirmToken: 'RESET-FOR-INTEGRATION-TEST' });
  if (!reset.ok) {
    logErr('Reset failed (is DevResetController enabled?)', reset);
    process.exitCode = 1;
    return;
  }

  // 2) Remove all departments (reference data in this project)
  console.log('Deleting departments...');
  const existing = await safeJson('GET', '/api/departments');
  if (!existing.ok) {
    logErr('GET /api/departments failed', existing);
    process.exitCode = 1;
    return;
  }
  for (const d of existing.data ?? []) {
    if (!d?.id) continue;
    const del = await safeJson('DELETE', `/api/departments/${d.id}`);
    if (!del.ok) logErr(`Failed deleting department id=${d.id}`, del);
  }

  // 3) Create departments
  console.log('Creating departments...');
  let deptOk = 0, deptFail = 0;
  for (const d of departments) {
    const r = await safeJson('POST', '/api/departments', d);
    if (r.ok) deptOk++;
    else { deptFail++; logErr(`Dept create failed: ${d.departmentName} / ${d.branchName ?? '—'}`, r); }
  }
  console.log(`Departments: ${deptOk} ok, ${deptFail} failed`);
  if (deptFail) {
    process.exitCode = 1;
    return;
  }

  // 4) Create employees
  console.log('Creating employees...');
  let empOk = 0, empFail = 0;
  const failures = [];
  for (const e of employees) {
    const r = await safeJson('POST', '/api/employees', e);
    if (r.ok) empOk++;
    else { empFail++; failures.push({ employee: e, error: r.error, details: r.details }); logErr(`Emp create failed: ${e.name}`, r); }
  }
  console.log(`Employees: ${empOk} ok, ${empFail} failed`);

  // 5) Verify counts
  const live = await safeJson('GET', '/api/employees');
  if (live.ok) console.log(`GET /api/employees -> ${live.data.length} employees`);

  if (failures.length) {
    const out = new URL('./seed_failures.json', import.meta.url);
    await fs.writeFile(out, JSON.stringify(failures, null, 2), 'utf8');
    console.log(`Wrote failures to: ${out.pathname}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

