package com.example.salaries_system.employee.model;

import jakarta.persistence.*;
import lombok.Data;
import com.example.salaries_system.worktime.model.DepartmentWorkTime;
import com.example.salaries_system.attendance.model.Attendance;
import com.example.salaries_system.payroll.model.PayrollRecord;
import com.example.salaries_system.loan.model.Loan;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "employees")
@Data
@JsonIgnoreProperties({"attendances", "payrolls", "loans"})
public class Employee {

    public enum ShiftType { MORNING, EVENING }
    public enum Gender    { MALE, FEMALE }

    /** Surrogate PK — used by all transactional FKs (attendance, payroll, loans, …). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Business key shown to users e.g. EMP-001 */
    @Column(unique = true)
    private String employeeCode;

    /** Natural business identifier (unique); APIs continue to address employees by name in URLs/paths. */
    @Column(unique = true, nullable = false)
    private String name;

    private String jobTitle;

    private BigDecimal baseSalary;

    /** Free-text category (loaded from employee_categories table) */
    private String category;

    @Enumerated(EnumType.STRING)
    private ShiftType shiftType;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private String address;

    private Boolean hasSocialInsurance;

    /**
     * When not {@code false}, Martyrs' Fund (0.05%) is deducted in payroll/settlement.
     * {@code null} is treated as enabled for existing rows created before this flag existed.
     */
    private Boolean applyMartyrsFund;

    private LocalDate hiringDate;

    private LocalDate contractExpiry;

    private String insuranceNumber;

    /**
     * When true, this employee is on a flexible schedule and is fully
     * exempt from all time-evaluation penalties (Task 2 logic is skipped).
     */
    private Boolean flexibleSchedule;

    /** Bank account number — used to generate the monthly bank-transfer file. */
    private String bankAccount;

    /**
     * Employee's age in years.
     * Egyptian Labour Law: age >= 50 → initial vacation quota = 30 days.
     * Otherwise initial quota = 21 days (set automatically on employee creation).
     */
    private Integer age;

    /**
     * SAP Infotype 2006 — Absence Quota (Annual Leave balance).
     * Defaults to 21 (or 30 for employees aged 50+).
     * Decremented by 1 for each ANNUAL_LEAVE working day (Fridays excluded).
     */
    private Integer vacationBalance;

    /**
     * Employee lifecycle status.
     * Values: "ACTIVE" (default) | "TERMINATED"
     * Set to "TERMINATED" by the End-of-Service Settlement module.
     */
    private String status;

    /**
     * Date on which the employee's contract was formally terminated.
     * Populated only when status == "TERMINATED".
     */
    private LocalDate terminationDate;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private DepartmentWorkTime departmentWorkTime;

    @OneToMany(mappedBy = "employee")
    private List<Attendance> attendances;

    @OneToMany(mappedBy = "employee")
    private List<PayrollRecord> payrolls;

    @OneToMany(mappedBy = "employee")
    private List<Loan> loans;
}
