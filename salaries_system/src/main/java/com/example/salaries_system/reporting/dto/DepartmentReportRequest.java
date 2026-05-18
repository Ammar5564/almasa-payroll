package com.example.salaries_system.reporting.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class DepartmentReportRequest {
    private String departmentName;
    private LocalDate fromDate;
    private LocalDate toDate;
}
