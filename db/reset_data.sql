-- =============================================================================
--  Al-Masa Salaries System — Data Reset Script
--  Database : PostgreSQL
--  Purpose  : Wipe ALL transactional / employee records while keeping every
--             table structure, reference data (departments, categories, users,
--             branches) and database sequences intact.
--
--  Tables cleared
--  ──────────────
--  1. loan_installments    (child of loans — must go first)
--  2. disciplinary_actions (child of employees)
--  3. payroll_records      (child of employees)
--  4. attendance           (child of employees — includes all absence rows)
--  5. loans                (child of employees — clears remainingBalance)
--  6. employees            (root — clears vacationBalance and all employee rows)
--
--  Tables preserved (reference / config data)
--  ───────────────────────────────────────────
--  department_work_time    ← seeded by DataSeeder on every startup
--  employee_categories     ← seeded by DataSeeder on every startup
--  branches                ← reference data
--  users                   ← login credentials
--
--  Safety
--  ──────
--  • Runs inside a single transaction → any error rolls everything back.
--  • RESTART IDENTITY resets all auto-increment (BIGSERIAL) sequences to 1.
--  • Preview the row-count report at the bottom before committing.
--
--  Usage (psql)
--  ────────────
--  psql -U <user> -d <database> -f reset_data.sql
--
--  Usage (pgAdmin / DBeaver)
--  ─────────────────────────
--  Open this file, run it in a query window.
--  The final SELECT block will show you counts before the COMMIT.
-- =============================================================================

BEGIN;

-- ── Step 1: Safety check — show current record counts before wiping ──────────

SELECT
    'BEFORE RESET' AS stage,
    (SELECT COUNT(*) FROM loan_installments)    AS loan_installments,
    (SELECT COUNT(*) FROM disciplinary_actions) AS disciplinary_actions,
    (SELECT COUNT(*) FROM payroll_records)      AS payroll_records,
    (SELECT COUNT(*) FROM attendance)           AS attendance_rows,
    (SELECT COUNT(*) FROM attendance
     WHERE  absence_type IS NOT NULL)           AS absence_rows_in_attendance,
    (SELECT COUNT(*) FROM loans)                AS loans,
    (SELECT COUNT(*) FROM employees)            AS employees;

-- ── Step 2: Truncate in child-first order ────────────────────────────────────
--   RESTART IDENTITY  → resets sequences (loan id, payroll id, etc.) to 1
--   CASCADE           → safety net for any FK we may have missed

TRUNCATE TABLE
    loan_installments,
    disciplinary_actions,
    payroll_records,
    attendance,
    loans,
    employees
RESTART IDENTITY
CASCADE;

-- ── Step 3: Verify everything is empty ───────────────────────────────────────

SELECT
    'AFTER RESET'  AS stage,
    (SELECT COUNT(*) FROM loan_installments)    AS loan_installments,
    (SELECT COUNT(*) FROM disciplinary_actions) AS disciplinary_actions,
    (SELECT COUNT(*) FROM payroll_records)      AS payroll_records,
    (SELECT COUNT(*) FROM attendance)           AS attendance_rows,
    (SELECT COUNT(*) FROM loans)                AS loans,
    (SELECT COUNT(*) FROM employees)            AS employees;

-- ── Step 4: Confirm reference data is untouched ──────────────────────────────

SELECT
    'REFERENCE DATA (should be unchanged)'     AS stage,
    (SELECT COUNT(*) FROM department_work_time) AS departments,
    (SELECT COUNT(*) FROM employee_categories)  AS categories,
    (SELECT COUNT(*) FROM branches)             AS branches,
    (SELECT COUNT(*) FROM users)                AS users;

-- ── Step 5: Commit ───────────────────────────────────────────────────────────
--  Review the SELECT results above.  If all counts look correct, commit.
--  To abort instead, replace COMMIT with ROLLBACK.

COMMIT;
