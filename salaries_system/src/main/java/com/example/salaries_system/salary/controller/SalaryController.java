package com.example.salaries_system.salary.controller;

import com.example.salaries_system.attendance.dto.AttendanceDefaultsResponse;
import com.example.salaries_system.employee.model.Employee;
import com.example.salaries_system.employee.repository.EmployeeRepository;
import com.example.salaries_system.payroll.service.PayrollService;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class SalaryController {

    private final EmployeeRepository employeeRepository;
    private final PayrollService payrollService;

    public SalaryController(EmployeeRepository employeeRepository,
                            PayrollService payrollService) {
        this.employeeRepository = employeeRepository;
        this.payrollService = payrollService;
    }

    // =========================
    // 1️⃣ القيم الافتراضية عند فتح شاشة الحضور
    // =========================

    @GetMapping("/attendance/defaults")
    public AttendanceDefaultsResponse getDefaults() {

        return new AttendanceDefaultsResponse(
                LocalDate.now(),
                null,   // الفرونت هيجيبها حسب الإدارة
                null
        );
    }

    // =========================
    // 2️⃣ ليستة الموظفين
    // =========================

//    @GetMapping("/employees")
//    public List<Employee> getEmployees() {
//        return employeeRepository.findAll();
//    }

    // =========================
    // 3️⃣ حساب مرتب شهر
    // =========================

//    @PostMapping("/payroll/{employeeName}")
//    public Object calculateSalary(
//            @PathVariable String employeeName,
//            @RequestParam int year,
//            @RequestParam int month
//    ) {
//        return payrollService.calculateMonthlySalary(
//                employeeName, year, month
//        );
//    }
}

