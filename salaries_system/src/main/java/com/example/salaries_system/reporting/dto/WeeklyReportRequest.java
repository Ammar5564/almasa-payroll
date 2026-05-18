package com.example.salaries_system.reporting.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class WeeklyReportRequest {
    
    private LocalDate startDate;
    private LocalDate endDate;
}
