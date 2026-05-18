package com.example.salaries_system.reporting.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class EmployeeReportRequest {
    private String employeeName;
    private LocalDate fromDate;
    private LocalDate toDate;
}
