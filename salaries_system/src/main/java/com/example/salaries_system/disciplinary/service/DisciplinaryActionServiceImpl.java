package com.example.salaries_system.disciplinary.service;

import com.example.salaries_system.disciplinary.model.DisciplinaryAction;
import com.example.salaries_system.disciplinary.repository.DisciplinaryActionRepository;
import com.example.salaries_system.employee.model.Employee;
import com.example.salaries_system.employee.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@Service
public class DisciplinaryActionServiceImpl implements DisciplinaryActionService {

    private final DisciplinaryActionRepository disciplinaryActionRepository;
    private final EmployeeRepository employeeRepository;

    public DisciplinaryActionServiceImpl(
            DisciplinaryActionRepository disciplinaryActionRepository,
            EmployeeRepository employeeRepository
    ) {
        this.disciplinaryActionRepository = disciplinaryActionRepository;
        this.employeeRepository = employeeRepository;
    }

    @Override
    public DisciplinaryAction addDisciplinaryAction(String employeeName, BigDecimal amount, String reason, LocalDate date) {
        Employee employee = employeeRepository.findByName(employeeName)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeName));

        DisciplinaryAction disciplinaryAction = new DisciplinaryAction();
        disciplinaryAction.setEmployee(employee);
        disciplinaryAction.setAmount(amount);
        disciplinaryAction.setReason(reason);
        disciplinaryAction.setDate(date);
        disciplinaryAction.setCreatedAt(LocalDateTime.now());

        return disciplinaryActionRepository.save(disciplinaryAction);
    }

    @Override
    public List<DisciplinaryAction> getDisciplinaryActionsByEmployee(String employeeName) {
        return disciplinaryActionRepository.findByEmployee_Name(employeeName);
    }

    @Override
    public BigDecimal calculateDisciplinaryPenalties(Employee employee, int year, int month) {
        List<DisciplinaryAction> actions = disciplinaryActionRepository.findByEmployee_NameAndYearAndMonth(
                employee.getName(), year, month
        );

        return actions.stream()
                .map(DisciplinaryAction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
