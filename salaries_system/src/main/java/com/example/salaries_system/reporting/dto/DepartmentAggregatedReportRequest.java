package com.example.salaries_system.reporting.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class DepartmentAggregatedReportRequest {
    private LocalDate fromDate;
    private LocalDate toDate;
}

