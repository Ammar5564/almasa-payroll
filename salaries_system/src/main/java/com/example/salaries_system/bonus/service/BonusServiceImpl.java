package com.example.salaries_system.bonus.service;

import com.example.salaries_system.attendance.model.Attendance;
import com.example.salaries_system.employee.model.Employee;
import org.springframework.stereotype.Service;
import com.example.salaries_system.common.util.SalaryUtils;
import java.math.BigDecimal;
import java.util.List;

@Service
public class BonusServiceImpl implements BonusService {

    private static final int MINUTES_IN_HOUR = 60;

    @Override
    public BigDecimal calculateOvertime(Employee employee, List<Attendance> attendances) {

        BigDecimal salaryPerMinute = SalaryUtils.salaryPerMinute(employee);

        long totalOvertimeMinutes = attendances.stream()
                .mapToLong(Attendance::getOvertimeMinutes)
                .sum();

        return salaryPerMinute.multiply(BigDecimal.valueOf(totalOvertimeMinutes));
    }

    @Override
    public BigDecimal applyBonus(BigDecimal bonus) {
        return bonus == null ? BigDecimal.ZERO : bonus;
    }
}
