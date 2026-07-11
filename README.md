<div align="center">

# 🏢 Al-Masa Payroll System
### نظام الرواتب — شركة الماسه

**A production-ready, full-stack HR & Payroll platform with a locale-aware Arabic UI, a domain-specific statutory compliance engine, and a clean REST API — built to scale across distributed teams and multi-branch operations.**

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

[**🌐 Live Portfolio Preview →**](https://wonderful-zuccutto-9bfde1.netlify.app)

</div>

---

## 📋 Overview

Al-Masa Payroll System is an enterprise-grade HR and payroll management platform built specifically for Egyptian labor and tax law compliance. It handles the full employee lifecycle — from onboarding and daily attendance to monthly payroll calculation, loans, and end-of-service settlement.

The UI is **Arabic-first with full RTL support**, built with a navy/gold enterprise theme using the Cairo font.

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 👥 **Employee Management** | Full profiles with job title, shift, salary, bank account, SI flags, vacation balance, and lifecycle status |
| 🕐 **Time & Attendance** | Daily punch records, Excel bulk import, lateness/overtime auto-detection, no-punch sweep |
| 💰 **Payroll Engine** | Egyptian Law 30/2023 progressive income tax, social insurance (11%), Martyrs' Fund, attendance deductions, full calculation trace |
| 🏖️ **Leave & Vacation** | Annual/unpaid/excused leave tracking, balance management, global history log + XLSX export |
| 🏦 **Loans & Advances** | Salary advance and company loan types, installment scheduling, cash repayment, running balance |
| 📊 **Reporting Suite** | Weekly, custom, per-employee, per-department XLSX reports, bank transfer file generation |
| 📋 **End-of-Service Settlement** | Full termination settlement: loans, accrued vacation, final payroll — preview → confirm → print |
| 🔒 **Security & Audit** | JWT authentication, ADMIN/USER roles, immutable audit log (who/when/before/after) |

---

## 🇪🇬 Egyptian Payroll Engine

The payroll calculation engine is built specifically for Egyptian statutory requirements:

- **Income Tax** — Progressive slabs per Law No. 30/2023 (0% → 27.5%), 20,000 EGP annual personal exemption
- **Social Insurance** — 11% employee contribution on salary clamped to 2,700–16,700 EGP
- **Martyrs' Fund** — 0.05% of gross salary
- **Vacation Quota** — 21 days/year (30 days for employees aged 50+)
- **Period Lock** — Payroll periods can be locked to prevent retroactive changes
- **Bank Transfer File** — Auto-generated file for bulk bank salary transfers

---

## 🛠 Tech Stack

### Backend
- **Java 21** + **Spring Boot 4** (preview features)
- **Spring Security** + **JWT** (jjwt 0.12) — BCrypt password hashing
- **Spring Data JPA** / **Hibernate** — PostgreSQL dialect
- **Apache POI 5.3** — Excel import/export
- **Maven** build system

### Frontend
- **React 18** + **TypeScript 5** + **Vite 5**
- **shadcn/ui** (Radix primitives) + **Tailwind CSS 3**
- **TanStack React Query 5** + **Axios** — data fetching
- **react-hook-form** + **Zod** — form validation
- **Recharts** — charts, **Framer Motion** — animations
- **Vitest** + **Playwright** — unit & e2e testing

### Deployment
Single-artifact deployment: Maven `include-frontend` profile copies `npm run build` output into `classpath:/static/` — one JAR serves both the API and the React SPA.

---

## 🚀 Getting Started

### Prerequisites
- Java 21+
- Node.js 18+
- PostgreSQL 15+

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/salaries_system.git
cd salaries_system
```

### 2. Configure environment
```bash
# Copy the example config
cp salaries_system/src/main/resources/application.properties.example \
   salaries_system/src/main/resources/application.properties

# Edit with your values
```

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://localhost:5432/Demo` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | *(required)* |
| `JWT_SECRET` | JWT signing secret (32+ chars) | *(required)* |

### 3. Run the backend
```bash
cd salaries_system
./mvnw spring-boot:run
# API available at http://localhost:8081
```

### 4. Run the frontend
```bash
cd almasa-frontend
npm install
npm run dev
# UI available at http://localhost:5173
```

### 5. Default seed credentials
On first startup, the database is seeded automatically:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | ADMIN |
| `user1` | `user1pass` | USER |

> ⚠️ Change these credentials immediately in any non-local environment.

---

## 📁 Project Structure

```
salaries_system/
├── salaries_system/               # Spring Boot API
│   └── src/main/java/.../
│       ├── auth/                  # JWT auth, AppUser, AppRole
│       ├── employee/              # Employee CRUD & lifecycle
│       ├── attendance/            # Punch records, Excel import, vacation
│       ├── payroll/               # Payroll engine, payslip, tax breakdown
│       ├── loan/                  # Loans & installments
│       ├── deduction/             # SI, tax, lateness deductions
│       ├── reporting/             # XLSX report generation
│       ├── settlement/            # End-of-service calculator
│       └── audit/                 # Immutable audit log
├── almasa-frontend/               # React SPA
│   └── src/
│       ├── pages/                 # Dashboard, Employees, Payroll, Attendance…
│       ├── components/            # shadcn/ui + custom components
│       └── lib/api.ts             # Axios client + React Query hooks
└── db/                            # Seed scripts & SQL reset
```

---

## 🔌 Key API Endpoints

```
POST   /api/auth/login
GET    /api/employees
POST   /api/attendance/import          # Excel bulk import
POST   /api/payroll/{name}             # Run monthly payroll
GET    /api/payroll/{name}/payslip
GET    /api/payroll/{name}/tax-breakdown
POST   /api/payroll/lock               # Lock period
GET    /api/payroll/bank-transfer      # Bank transfer file
POST   /api/settlement/preview
POST   /api/settlement/confirm
GET    /api/audit-logs                 # Admin only
```

---

## 📸 Screenshots

> 🌐 **[View full interactive preview →](https://wonderful-zuccutto-9bfde1.netlify.app)**

The portfolio preview showcases all major screens: Dashboard, Employee Directory, Payslip with live tax calculation trace, and Attendance records.

---

## 📄 License

This project is for portfolio and demonstration purposes.

---

<div align="center">
Built with ☕ Java + ⚛️ React &nbsp;·&nbsp; Arabic-first enterprise HR for Egypt
</div>
