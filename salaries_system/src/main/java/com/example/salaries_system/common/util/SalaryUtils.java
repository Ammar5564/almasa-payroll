package com.example.salaries_system.common.util;


import com.example.salaries_system.employee.model.Employee;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class SalaryUtils {

    private static final int DAYS_IN_MONTH = 30;
    private static final int HOURS_IN_DAY = 8;
    private static final int MINUTES_IN_HOUR = 60;
    private static final int SECONDS_IN_HOUR = 3600;

    public static BigDecimal salaryPerMinute(Employee employee) {

        return employee.getBaseSalary()
                .divide(BigDecimal.valueOf(DAYS_IN_MONTH), 6, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(HOURS_IN_DAY), 6, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(MINUTES_IN_HOUR), 6, RoundingMode.HALF_UP);
    }

    public static BigDecimal salaryPerDay(Employee employee) {
        return employee.getBaseSalary()
                .divide(BigDecimal.valueOf(DAYS_IN_MONTH), 6, RoundingMode.HALF_UP);
    }

    /**
     * Second_Rate = Monthly_Salary / 30 / 8 / 3600
     * Used for pro-rata "leave early" deductions.
     */
    public static BigDecimal salaryPerSecond(Employee employee) {
        return employee.getBaseSalary()
                .divide(BigDecimal.valueOf(DAYS_IN_MONTH), 10, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(HOURS_IN_DAY), 10, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(SECONDS_IN_HOUR), 10, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateOvertimePay(Employee employee, long overtimeMinutes) {
        if (overtimeMinutes < 60) {
            return BigDecimal.ZERO;
        }
        return salaryPerMinute(employee)
                .multiply(BigDecimal.valueOf(overtimeMinutes))
                .setScale(2, RoundingMode.HALF_UP);
    }
}
