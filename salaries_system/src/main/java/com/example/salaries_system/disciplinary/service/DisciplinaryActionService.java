package com.example.salaries_system.disciplinary.service;

import com.example.salaries_system.disciplinary.model.DisciplinaryAction;
import com.example.salaries_system.employee.model.Employee;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface DisciplinaryActionService {

    DisciplinaryAction addDisciplinaryAction(String employeeName, BigDecimal amount, String reason, LocalDate date);

    List<DisciplinaryAction> getDisciplinaryActionsByEmployee(String employeeName);

    BigDecimal calculateDisciplinaryPenalties(Employee employee, int year, int month);
}
