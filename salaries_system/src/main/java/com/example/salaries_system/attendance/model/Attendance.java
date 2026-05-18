package com.example.salaries_system.attendance.model;
import jakarta.persistence.*;
import lombok.Data;
import com.example.salaries_system.employee.model.Employee;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(
        name = "attendance",
        uniqueConstraints = @UniqueConstraint(columnNames = {"employee_id", "date"})
)
@Data
@JsonIgnoreProperties({"employee"})
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    private LocalDate date;

    private LocalTime actualStart;
    private LocalTime actualEnd;

    private long lateMinutes = 0;
    private long overtimeMinutes = 0;
    private long leaveEarlyMinutes = 0;

    @Enumerated(EnumType.STRING)
    private AbsenceType absenceType;

    private String absenceStatus;
    private BigDecimal manualDeduction;
    private String ceoRemark;
    private Long earlyLeaveSeconds;

    /**
     * Penalty multiplier for unexcused absences (Type B).
     * Defaults to 1.0. HR can set to 2.0 to apply the Egyptian-law
     * "2 days deducted per 1 day absent" rule.
     * Formula: Absence_Deduction = Daily_Rate * Penalty_Multiplier
     */
    private BigDecimal penaltyMultiplier;
}
