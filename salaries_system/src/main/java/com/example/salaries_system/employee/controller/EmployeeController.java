package com.example.salaries_system.employee.controller;

import com.example.salaries_system.attendance.service.VacationService;
import com.example.salaries_system.employee.dto.EmployeeRequest;
import com.example.salaries_system.employee.dto.EmployeeResponse;
import com.example.salaries_system.employee.service.EmployeeService;
import com.example.salaries_system.worktime.model.DepartmentWorkTime;
import com.example.salaries_system.employee.model.Employee;
import com.example.salaries_system.worktime.repository.DepartmentWorkTimeRepository;
import com.example.salaries_system.employee.repository.EmployeeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin
public class EmployeeController {

    private final EmployeeRepository employeeRepository;
    private final DepartmentWorkTimeRepository departmentRepository;
    private final EmployeeService employeeService;

    public EmployeeController(EmployeeRepository employeeRepository,
                              DepartmentWorkTimeRepository departmentRepository,
                              EmployeeService employeeService) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.employeeService = employeeService;
    }

    @PostMapping
    public EmployeeResponse addEmployee(@RequestBody EmployeeRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty())
            throw new RuntimeException("Employee name is required");
        if (request.getJobTitle() == null || request.getJobTitle().trim().isEmpty())
            throw new RuntimeException("Job title is required");
        if (request.getBaseSalary() == null || request.getBaseSalary().compareTo(java.math.BigDecimal.ZERO) <= 0)
            throw new RuntimeException("Base salary must be positive");
        if (request.getDepartmentName() == null || request.getDepartmentName().trim().isEmpty())
            throw new RuntimeException("Department is required");

        String deptName   = request.getDepartmentName().trim();
        String branchName = request.getBranchName() != null && !request.getBranchName().isBlank()
                            ? request.getBranchName().trim() : null;

        DepartmentWorkTime dept = branchName != null
            ? departmentRepository.findByDepartmentNameAndBranchName(deptName, branchName)
                .orElseThrow(() -> new RuntimeException("Department/branch not found: " + deptName + " / " + branchName))
            : departmentRepository.findByDepartmentNameAndBranchName(deptName, null)
                .orElseGet(() -> departmentRepository.findByDepartmentName(deptName)
                    .orElseThrow(() -> new RuntimeException("Department not found: " + deptName)));

        long count = employeeRepository.count();
        String code = String.format("EMP-%03d", count + 1);

        Employee employee = new Employee();
        employee.setEmployeeCode(code);
        employee.setName(request.getName().trim());
        employee.setJobTitle(request.getJobTitle().trim());
        employee.setBaseSalary(request.getBaseSalary());
        employee.setDepartmentWorkTime(dept);
        employee.setCategory(request.getCategory());
        employee.setShiftType(request.getShiftType());
        employee.setGender(request.getGender());
        employee.setAddress(request.getAddress());
        employee.setHasSocialInsurance(request.getHasSocialInsurance());
        employee.setApplyMartyrsFund(request.getApplyMartyrsFund());
        employee.setHiringDate(request.getHiringDate());
        employee.setContractExpiry(request.getContractExpiry());
        employee.setInsuranceNumber(request.getInsuranceNumber());

        // Individual flag takes precedence; if not set, inherit from department group
        boolean deptFlex = Boolean.TRUE.equals(dept.getFlexibleGroup());
        Boolean reqFlex  = request.getFlexibleSchedule();
        employee.setFlexibleSchedule(reqFlex != null ? reqFlex : (deptFlex ? true : null));
        employee.setBankAccount(request.getBankAccount());

        // ── SAP Infotype 2006: set initial vacation balance based on age ──────
        employee.setAge(request.getAge());
        int initialBalance = VacationService.initialQuotaFor(employee);
        employee.setVacationBalance(initialBalance);

        return toResponse(employeeRepository.save(employee));
    }

    @GetMapping
    public List<EmployeeResponse> getAll() {
        return employeeRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * DELETE /api/employees/{id} — removes the employee and all dependent rows
     * (attendance, payroll, loans, disciplinary). Admin only.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployeeByPathId(@PathVariable Long id) {
        employeeService.deleteById(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    /**
     * DELETE /api/employees/id/{id} — removes the employee and all dependent rows
     * (attendance, payroll, loans, disciplinary). Admin only.
     * <p>Path is {@code /id/...} so it never overlaps {@link #updateEmployee} ({@code PUT /{name}}),
     * and older proxies/stacks that only saw PUT on {@code /{segment}} return 405 for DELETE until updated.</p>
     */
    @DeleteMapping("/id/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteById(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    /**
     * Same cascade delete as {@code DELETE /id/{id}}, keyed by business code (e.g. EMP-051).
     */
    @DeleteMapping("/by-code/{employeeCode}")
    public ResponseEntity<Void> deleteEmployeeByCode(@PathVariable String employeeCode) {
        Employee e = employeeRepository.findByEmployeeCode(employeeCode.trim())
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeCode));
        employeeService.deleteById(e.getId());
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    /**
     * PUT /api/employees/{name}
     * Full update — the employee's name (PK) cannot be changed.
     * Every field is optional; omit / send null to keep the current value.
     */
    @PutMapping("/{name}")
    public EmployeeResponse updateEmployee(
            @PathVariable String name,
            @RequestBody EmployeeRequest request) {

        Employee employee = employeeRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + name));

        // ── Org assignment ────────────────────────────────────────────────────
        if (request.getDepartmentName() != null && !request.getDepartmentName().isBlank()) {
            String deptName   = request.getDepartmentName().trim();
            String branchName = request.getBranchName() != null && !request.getBranchName().isBlank()
                                ? request.getBranchName().trim() : null;
            DepartmentWorkTime dept = branchName != null
                ? departmentRepository.findByDepartmentNameAndBranchName(deptName, branchName)
                    .orElseThrow(() -> new RuntimeException("Department/branch not found: " + deptName + " / " + branchName))
                : departmentRepository.findByDepartmentNameAndBranchName(deptName, null)
                    .orElseGet(() -> departmentRepository.findByDepartmentName(deptName)
                        .orElseThrow(() -> new RuntimeException("Department not found: " + deptName)));
            employee.setDepartmentWorkTime(dept);
        }

        // ── Scalar fields — only update when non-null ─────────────────────────
        if (request.getJobTitle()          != null) employee.setJobTitle(request.getJobTitle().trim());
        if (request.getBaseSalary()        != null) employee.setBaseSalary(request.getBaseSalary());
        if (request.getCategory()          != null) employee.setCategory(request.getCategory());
        if (request.getShiftType()         != null) employee.setShiftType(request.getShiftType());
        if (request.getGender()            != null) employee.setGender(request.getGender());
        if (request.getAddress()           != null) employee.setAddress(request.getAddress());
        if (request.getHasSocialInsurance()!= null) employee.setHasSocialInsurance(request.getHasSocialInsurance());
        if (request.getApplyMartyrsFund()    != null) employee.setApplyMartyrsFund(request.getApplyMartyrsFund());
        if (request.getHiringDate()        != null) employee.setHiringDate(request.getHiringDate());
        if (request.getContractExpiry()    != null) employee.setContractExpiry(request.getContractExpiry());
        if (request.getInsuranceNumber()   != null) employee.setInsuranceNumber(request.getInsuranceNumber());
        if (request.getFlexibleSchedule()  != null) employee.setFlexibleSchedule(request.getFlexibleSchedule());
        if (request.getBankAccount()       != null) employee.setBankAccount(request.getBankAccount());
        if (request.getAge()               != null) {
            employee.setAge(request.getAge());
            // Recalculate vacation balance when age changes (only if not yet manually adjusted)
            if (employee.getVacationBalance() == null) {
                employee.setVacationBalance(VacationService.initialQuotaFor(employee));
            }
        }

        return toResponse(employeeRepository.save(employee));
    }

    private EmployeeResponse toResponse(Employee emp) {
        EmployeeResponse r = new EmployeeResponse();
        r.setEmployeeId(emp.getId());
        r.setEmployeeCode(emp.getEmployeeCode());
        r.setName(emp.getName());
        r.setJobTitle(emp.getJobTitle());
        r.setBaseSalary(emp.getBaseSalary());
        r.setCategory(emp.getCategory());
        r.setShiftType(emp.getShiftType());
        r.setGender(emp.getGender());
        r.setAddress(emp.getAddress());
        r.setHasSocialInsurance(emp.getHasSocialInsurance());
        r.setApplyMartyrsFund(emp.getApplyMartyrsFund());
        r.setHiringDate(emp.getHiringDate());
        r.setContractExpiry(emp.getContractExpiry());
        r.setInsuranceNumber(emp.getInsuranceNumber());
        r.setFlexibleSchedule(emp.getFlexibleSchedule());
        r.setBankAccount(emp.getBankAccount());
        r.setAge(emp.getAge());
        r.setVacationBalance(emp.getVacationBalance() != null
                ? emp.getVacationBalance()
                : VacationService.initialQuotaFor(emp));
        r.setStatus(emp.getStatus() != null ? emp.getStatus() : "ACTIVE");
        r.setTerminationDate(emp.getTerminationDate());

        DepartmentWorkTime dept = emp.getDepartmentWorkTime();
        if (dept != null) {
            r.setDepartmentName(dept.getDepartmentName());
            r.setBranchName(dept.getBranchName());
            r.setOfficialStart(dept.getOfficialStart());
            r.setOfficialEnd(dept.getOfficialEnd());
            r.setDeptFlexibleGroup(dept.getFlexibleGroup());
        }
        return r;
    }
}
