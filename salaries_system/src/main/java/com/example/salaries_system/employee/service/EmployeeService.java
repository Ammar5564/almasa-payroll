package com.example.salaries_system.employee.service;

import com.example.salaries_system.attendance.repository.AttendanceRepository;
import com.example.salaries_system.disciplinary.repository.DisciplinaryActionRepository;
import com.example.salaries_system.employee.repository.EmployeeRepository;
import com.example.salaries_system.loan.repository.LoanInstallmentRepository;
import com.example.salaries_system.loan.repository.LoanRepository;
import com.example.salaries_system.payroll.repository.PayrollRecordRepository;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Employee lifecycle operations. Deletes dependent transactional rows in FK-safe order
 * before removing the employee row.
 * <p>
 * Loan rows use {@code CascadeType.ALL} + EAGER installments; we never load {@code Loan}
 * entities here — only bulk JPQL deletes — to avoid a stale persistence context after
 * installment deletes (that mismatch caused HTTP 500 on {@code delete(loan)}).
 */
@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final LoanRepository loanRepository;
    private final LoanInstallmentRepository loanInstallmentRepository;
    private final DisciplinaryActionRepository disciplinaryActionRepository;
    private final PayrollRecordRepository payrollRecordRepository;
    private final AttendanceRepository attendanceRepository;

    private final EntityManager entityManager;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            LoanRepository loanRepository,
            LoanInstallmentRepository loanInstallmentRepository,
            DisciplinaryActionRepository disciplinaryActionRepository,
            PayrollRecordRepository payrollRecordRepository,
            AttendanceRepository attendanceRepository,
            EntityManager entityManager) {
        this.employeeRepository = employeeRepository;
        this.loanRepository = loanRepository;
        this.loanInstallmentRepository = loanInstallmentRepository;
        this.disciplinaryActionRepository = disciplinaryActionRepository;
        this.payrollRecordRepository = payrollRecordRepository;
        this.attendanceRepository = attendanceRepository;
        this.entityManager = entityManager;
    }

    @Transactional
    public void deleteById(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new RuntimeException("Employee not found");
        }
        Long employeeId = id;

        loanInstallmentRepository.deleteAllForEmployeeLoans(employeeId);
        loanRepository.deleteAllLoansForEmployee(employeeId);

        disciplinaryActionRepository.deleteAllForEmployee(employeeId);
        payrollRecordRepository.deleteAllForEmployee(employeeId);
        attendanceRepository.deleteAllForEmployee(employeeId);

        entityManager.flush();
        entityManager.clear();

        employeeRepository.deleteById(employeeId);
    }
}
