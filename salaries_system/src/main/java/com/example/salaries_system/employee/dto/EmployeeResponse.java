package com.example.salaries_system.employee.dto;

import com.example.salaries_system.employee.model.Employee.ShiftType;
import com.example.salaries_system.employee.model.Employee.Gender;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class EmployeeResponse {

    /** Surrogate PK for integrations / locking correlation */
    private Long employeeId;

    private String employeeCode;
    private String name;
    private String jobTitle;
    private BigDecimal baseSalary;
    private String departmentName;
    private String branchName;
    /** Department official start time — auto-populated from the linked DepartmentWorkTime. */
    private LocalTime officialStart;
    /** Department official end time — auto-populated from the linked DepartmentWorkTime. */
    private LocalTime officialEnd;
    /** True if the department this employee belongs to is a flexible group. */
    private Boolean deptFlexibleGroup;
    private String category;
    private ShiftType shiftType;
    private Gender gender;
    private String address;
    private Boolean hasSocialInsurance;
    /** When not {@code false}, Martyrs' Fund applies in payroll (null = enabled for legacy data). */
    private Boolean applyMartyrsFund;
    private LocalDate hiringDate;
    private LocalDate contractExpiry;
    private String insuranceNumber;
    /** Individual flexible-schedule flag (overrides dept-level flexibleGroup). */
    private Boolean flexibleSchedule;
    private String bankAccount;
    private Integer age;
    private Integer vacationBalance;
    private String    status;
    private LocalDate terminationDate;

    public EmployeeResponse() {}
}
