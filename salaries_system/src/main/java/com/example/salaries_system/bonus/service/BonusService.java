package com.example.salaries_system.bonus.service;

import com.example.salaries_system.attendance.model.Attendance;
import com.example.salaries_system.employee.model.Employee;

import java.math.BigDecimal;
import java.util.List;

public interface BonusService {

    BigDecimal calculateOvertime(Employee employee, List<Attendance> attendances);

    BigDecimal applyBonus(BigDecimal bonus);
}
