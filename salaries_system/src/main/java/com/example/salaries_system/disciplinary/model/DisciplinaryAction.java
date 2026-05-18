package com.example.salaries_system.disciplinary.model;


import jakarta.persistence.*;
import lombok.Data;
import com.example.salaries_system.employee.model.Employee;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "disciplinary_actions")
@Data
public class DisciplinaryAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    private BigDecimal amount;

    private String reason;

    private LocalDate date;

    private LocalDateTime createdAt;
}
