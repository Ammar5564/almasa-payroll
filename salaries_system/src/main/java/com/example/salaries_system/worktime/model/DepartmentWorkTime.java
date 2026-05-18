package com.example.salaries_system.worktime.model;

import jakarta.persistence.*;
import lombok.Data;
import com.example.salaries_system.employee.model.Employee;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalTime;
import java.util.List;

@Entity
@Table(
    name = "department_work_time",
    uniqueConstraints = @UniqueConstraint(columnNames = {"departmentName", "branchName"})
)
@Data
@JsonIgnoreProperties({"employees"})
public class DepartmentWorkTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String departmentName;

    // null means no branch (single-location department)
    private String branchName;

    private LocalTime officialStart;
    private LocalTime officialEnd;

    private String costCenter;

    /**
     * When true, all employees in this department are exempt from
     * time-evaluation penalties (Task 2 logic is skipped).
     * Used for "Top Management / الإدارة العليا" type groups.
     */
    private Boolean flexibleGroup;

    @OneToMany(mappedBy = "departmentWorkTime")
    private List<Employee> employees;

    /** Convenience: returns display label like "ادارة المبيعات – شيراتون" */
    @Transient
    public String getLabel() {
        if (branchName != null && !branchName.isBlank()) {
            return departmentName + " – " + branchName;
        }
        return departmentName;
    }
}
