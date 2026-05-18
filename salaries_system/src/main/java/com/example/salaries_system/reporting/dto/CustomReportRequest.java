package com.example.salaries_system.reporting.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class CustomReportRequest {
    
    private LocalDate fromDate;
    private LocalDate toDate;
    private String reportType; // "payroll", "attendance", "loans", "department"
}
