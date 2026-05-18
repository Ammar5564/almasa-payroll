# Salaries System API Documentation

## Base URL
```
http://localhost:8080
```

## Testing Order (Important!)
1. **Departments** - Create departments first (employees need them)
2. **Employees** - Create employees (everything depends on them)
3. **Attendance** - Record daily attendance
4. **Absences** - Track employee absences
5. **Disciplinary Actions** - Add penalties if needed
6. **Loans** - Create employee loans
7. **Payroll** - Calculate monthly salary
8. **Pay Slips** - Generate and export pay slips
9. **Reports** - Generate reports

---

## DEPARTMENTS API

### Create Department
```
POST /api/departments
```

**Body:**
```json
{
  "departmentName": "IT Department",
  "officialStart": "09:00",
  "officialEnd": "17:00"
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/departments \
  -H "Content-Type: application/json" \
  -d '{"departmentName":"IT Department","officialStart":"09:00","officialEnd":"17:00"}'
```

### Get All Departments
```
GET /api/departments
```

**Example:**
```bash
curl -X GET http://localhost:8080/api/departments
```

---

## EMPLOYEES API

### Create Employee
```
POST /api/employees
```

**Body:**
```json
{
  "name": "John Doe",
  "jobTitle": "Software Developer",
  "baseSalary": 5000.00,
  "departmentWorkTime": {
    "departmentName": "IT Department",
    "officialStart": "09:00",
    "officialEnd": "17:00"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/employees \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","jobTitle":"Developer","baseSalary":5000,"departmentWorkTime":{"departmentName":"IT","officialStart":"09:00","officialEnd":"17:00"}}'
```

### Get All Employees
```
GET /api/employees
```

### Get Employee by Name
```
GET /api/employees/{employeeName}
```

**Example:**
```bash
curl -X GET http://localhost:8080/api/employees/John%20Doe
```

---

## ATTENDANCE API

### Record Daily Attendance
```
POST /api/attendance
```

**Body:**
```json
{
  "employeeName": "John Doe",
  "date": "2026-03-25",
  "actualStart": "09:15",
  "actualEnd": "17:30"
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/attendance \
  -H "Content-Type: application/json" \
  -d '{"employeeName":"John Doe","date":"2026-03-25","actualStart":"09:15","actualEnd":"17:30"}'
```

### Record Absence
```
POST /api/attendance/absence
```

**Body:**
```json
{
  "employeeName": "John Doe",
  "date": "2026-03-26",
  "absenceType": "WITHOUT_PERMISSION"
}
```

**Types:** `WITH_PERMISSION` or `WITHOUT_PERMISSION`

**Example:**
```bash
curl -X POST http://localhost:8080/api/attendance/absence \
  -H "Content-Type: application/json" \
  -d '{"employeeName":"John Doe","date":"2026-03-26","absenceType":"WITHOUT_PERMISSION"}'
```

### Get Employee Absences
```
GET /api/attendance/absences?employeeName={employeeName}
```

**Example:**
```bash
curl -X GET "http://localhost:8080/api/attendance/absences?employeeName=John%20Doe"
```

---

## LOANS API

### Create Loan
```
POST /api/loans
```

**Body:**
```json
{
  "employeeName": "John Doe",
  "totalAmount": 5000.00,
  "installmentCount": 12
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/loans \
  -H "Content-Type: application/json" \
  -d '{"employeeName":"John Doe","totalAmount":5000,"installmentCount":12}'
```

### Get All Loans
```
GET /api/loans
```

### Get Employee Loans
```
GET /api/loans/employee/{employeeName}
```

**Example:**
```bash
curl -X GET http://localhost:8080/api/loans/employee/John%20Doe
```

---

## DISCIPLINARY ACTIONS API

### Add Disciplinary Action
```
POST /api/disciplinary
```

**Body:**
```json
{
  "employeeName": "John Doe",
  "amount": 200.00,
  "reason": "Late arrival multiple times",
  "date": "2026-03-25"
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/disciplinary \
  -H "Content-Type: application/json" \
  -d '{"employeeName":"John Doe","amount":200,"reason":"Late arrival","date":"2026-03-25"}'
```

### Get Employee Disciplinary Actions
```
GET /api/disciplinary/employee/{employeeName}
```

**Example:**
```bash
curl -X GET http://localhost:8080/api/disciplinary/employee/John%20Doe
```

---

## PAYROLL API

### Calculate Monthly Salary
```
POST /api/payroll/{employeeName}?year={year}&month={month}
```

**Example:**
```bash
curl -X POST "http://localhost:8080/api/payroll/John%20Doe?year=2026&month=3"
```

**Response:**
```json
{
  "id": 1,
  "employee": {...},
  "month": "2026-03-01",
  "overtimePay": 150.00,
  "bonus": 0.00,
  "lateDeduction": 50.00,
  "absenceDeduction": 0.00,
  "loanDeduction": 416.67,
  "penalties": 200.00,
  "socialInsurance": 550.00,
  "finalSalary": 3933.33,
  "workedDays": 22
}
```

### Get Pay Slip (JSON)
```
GET /api/payroll/{employeeName}/payslip?year={year}&month={month}
```

**Example:**
```bash
curl -X GET "http://localhost:8080/api/payroll/John%20Doe/payslip?year=2026&month=3"
```

**Response:**
```json
{
  "employeeName": "John Doe",
  "jobTitle": "Software Developer",
  "departmentName": "IT Department",
  "month": "March 2026",
  "baseSalary": 5000.00,
  "additions": {
    "overtimePay": 150.00,
    "bonus": 0.00,
    "arrears": 0.00,
    "allowances": 0.00
  },
  "deductions": {
    "lateDeduction": 50.00,
    "absenceDeduction": 0.00,
    "loanDeduction": 416.67,
    "penalties": 200.00,
    "socialInsurance": 550.00
  },
  "totalAdditions": 150.00,
  "totalDeductions": 1216.67,
  "netSalary": 3933.33,
  "generatedAt": "2026-03-25"
}
```

### Export Pay Slip (HTML File)
```
GET /api/payroll/{employeeName}/payslip/export?year={year}&month={month}
```

**Example:**
```bash
curl -X GET "http://localhost:8080/api/payroll/John%20Doe/payslip/export?year=2026&month=3" \
  --output john_doe_payslip.html
```

---

## REPORTS API

### Weekly Report
```
POST /api/reports/weekly
```

**Body:**
```json
{
  "startDate": "2026-03-20",
  "endDate": "2026-03-26"
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/reports/weekly \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-03-20","endDate":"2026-03-26"}'
```

### Custom Report
```
POST /api/reports/custom
```

**Body:**
```json
{
  "reportType": "payroll",
  "fromDate": "2026-03-01",
  "toDate": "2026-03-31"
}
```

**Types:** `payroll`, `attendance`, `loans`, `department`

**Example:**
```bash
curl -X POST http://localhost:8080/api/reports/custom \
  -H "Content-Type: application/json" \
  -d '{"reportType":"payroll","fromDate":"2026-03-01","toDate":"2026-03-31"}'
```

### Employee Detailed Report
```
POST /api/reports/employee
```

**Body:**
```json
{
  "employeeName": "John Doe",
  "fromDate": "2026-03-01",
  "toDate": "2026-03-31"
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/reports/employee \
  -H "Content-Type: application/json" \
  -d '{"employeeName":"John Doe","fromDate":"2026-03-01","toDate":"2026-03-31"}'
```

### Department Report
```
POST /api/reports/department
```

**Body:**
```json
{
  "departmentName": "IT Department",
  "fromDate": "2026-03-01",
  "toDate": "2026-03-31"
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/reports/department \
  -H "Content-Type: application/json" \
  -d '{"departmentName":"IT Department","fromDate":"2026-03-01","toDate":"2026-03-31"}'
```

### Export Report to CSV
```
POST /api/reports/export
```

**Body:** Use any report response as input

**Example:**
```bash
# First get a report
curl -X POST http://localhost:8080/api/reports/weekly \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-03-20","endDate":"2026-03-26"}' > report.json

# Then export it
curl -X POST http://localhost:8080/api/reports/export \
  -H "Content-Type: application/json" \
  -d @report.json \
  --output weekly_report.csv
```

---

## SALARY CALCULATIONS

### How Payroll Works
1. **Base Salary**: Employee's monthly salary
2. **Additions**: Overtime pay + bonus
3. **Deductions**: Late + absence + loan + penalties + social insurance
4. **Net Salary**: Base + Additions - Deductions

### Deduction Rules
- **Late Deduction**: 
  - 15-30 min late = 25% of daily salary
  - 30-60 min late = 50% of daily salary  
  - >60 min late = 100% of daily salary
- **Absence Deduction**: 
  - WITH_PERMISSION = 0
  - WITHOUT_PERMISSION = 100% of daily salary
- **Social Insurance**: 11% of min(baseSalary, 10,900) - Egyptian Law
- **Loan Deduction**: Total amount ÷ number of installments
- **Penalties**: Fixed amount per disciplinary action

### No Tax
Tax has been completely removed from the system.

---

## COMPLETE TESTING EXAMPLE

### Step 1: Create Department
```bash
curl -X POST http://localhost:8080/api/departments \
  -H "Content-Type: application/json" \
  -d '{"departmentName":"IT Department","officialStart":"09:00","officialEnd":"17:00"}'
```

### Step 2: Create Employee
```bash
curl -X POST http://localhost:8080/api/employees \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","jobTitle":"Developer","baseSalary":5000,"departmentWorkTime":{"departmentName":"IT Department","officialStart":"09:00","officialEnd":"17:00"}}'
```

### Step 3: Record Attendance
```bash
curl -X POST http://localhost:8080/api/attendance \
  -H "Content-Type: application/json" \
  -d '{"employeeName":"John Doe","date":"2026-03-25","actualStart":"09:15","actualEnd":"17:30"}'
```

### Step 4: Create Loan
```bash
curl -X POST http://localhost:8080/api/loans \
  -H "Content-Type: application/json" \
  -d '{"employeeName":"John Doe","totalAmount":5000,"installmentCount":12}'
```

### Step 5: Calculate Payroll
```bash
curl -X POST "http://localhost:8080/api/payroll/John%20Doe?year=2026&month=3"
```

### Step 6: Get Pay Slip
```bash
curl -X GET "http://localhost:8080/api/payroll/John%20Doe/payslip?year=2026&month=3"
```

### Step 7: Export Pay Slip
```bash
curl -X GET "http://localhost:8080/api/payroll/John%20Doe/payslip/export?year=2026&month=3" \
  --output john_doe_payslip.html
```

### Step 8: Generate Report
```bash
curl -X POST http://localhost:8080/api/reports/employee \
  -H "Content-Type: application/json" \
  -d '{"employeeName":"John Doe","fromDate":"2026-03-01","toDate":"2026-03-31"}'
```

---

## IMPORTANT NOTES

- **Employee Names**: Use exact names with proper encoding (%20 for spaces)
- **Date Format**: Always use YYYY-MM-DD
- **Time Format**: Use 24-hour format (HH:MM)
- **Testing Order**: Follow the recommended order to avoid dependency issues
- **Payroll**: Can only be calculated once per month per employee
- **Files**: HTML pay slips are downloadable files

---

## ERROR MESSAGES

Common errors and their meanings:
- **Employee not found**: Create employee first
- **Payroll already exists**: Can't regenerate for same month
- **Duplicate attendance**: Employee already has attendance for that date
- **Invalid date format**: Use YYYY-MM-DD format

This documentation covers all endpoints with clear examples for testing the complete Salaries System.
