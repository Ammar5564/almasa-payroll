package com.example.salaries_system.employee.dto;

import com.example.salaries_system.employee.model.Employee.ShiftType;
import com.example.salaries_system.employee.model.Employee.Gender;
import java.math.BigDecimal;
import java.time.LocalDate;

public class EmployeeRequest {

    // Required
    private String name;
    private String jobTitle;
    private BigDecimal baseSalary;
    private String departmentName;
    private String branchName;

    // Optional extended
    private String category;
    private ShiftType shiftType;
    private Gender gender;
    private String address;
    private Boolean hasSocialInsurance;
    /** When {@code false}, Martyrs' Fund deduction is skipped; {@code null} keeps existing value on update. */
    private Boolean applyMartyrsFund;
    private LocalDate hiringDate;
    private LocalDate contractExpiry;
    private String insuranceNumber;
    /** Individual flexible-schedule flag (overrides dept-level flexibleGroup). */
    private Boolean flexibleSchedule;
    /** Bank account number for the monthly bank-transfer file. */
    private String bankAccount;
    /** Employee's age — used to set initial vacation balance (≥50 → 30 days, else 21). */
    private Integer age;

    public String getName()                  { return name; }
    public String getJobTitle()              { return jobTitle; }
    public BigDecimal getBaseSalary()        { return baseSalary; }
    public String getDepartmentName()        { return departmentName; }
    public String getBranchName()            { return branchName; }
    public String getCategory()              { return category; }
    public ShiftType getShiftType()          { return shiftType; }
    public Gender getGender()                { return gender; }
    public String getAddress()               { return address; }
    public Boolean getHasSocialInsurance()   { return hasSocialInsurance; }
    public Boolean getApplyMartyrsFund()     { return applyMartyrsFund; }
    public LocalDate getHiringDate()         { return hiringDate; }
    public LocalDate getContractExpiry()     { return contractExpiry; }
    public String getInsuranceNumber()       { return insuranceNumber; }
    public Boolean getFlexibleSchedule()     { return flexibleSchedule; }
    public String getBankAccount()           { return bankAccount; }
    public Integer getAge()                  { return age; }
}
