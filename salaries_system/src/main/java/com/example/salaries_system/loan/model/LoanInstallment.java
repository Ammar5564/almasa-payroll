package com.example.salaries_system.loan.model;


import jakarta.persistence.*;
import lombok.Data;
import com.example.salaries_system.loan.model.Loan;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "loan_installments")
@Data
public class LoanInstallment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "loan_id")
    @JsonIgnoreProperties({"installments"})
    private Loan loan;

    private LocalDate month;
    private String monthName;  // Custom display name like "April 2026 Bonus"

    private BigDecimal amount;

    private boolean paid;
}
