package com.example.salaries_system.loan.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class InstallmentRequest {
    
    private String monthName;
    private LocalDate dueDate;
    private BigDecimal amount;
}
