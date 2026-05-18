package com.example.salaries_system.employee.repository;

import com.example.salaries_system.employee.model.Employee;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    boolean existsByName(String name);

    Optional<Employee> findByName(String name);

    Optional<Employee> findByEmployeeCode(String employeeCode);

    /**
     * Pessimistic lock on the employee PK — serializes concurrent attendance (and similar) per employee.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Employee e WHERE e.id = :id")
    Optional<Employee> findByIdForUpdate(@Param("id") Long id);

    boolean existsByDepartmentWorkTimeId(Long departmentWorkTimeId);
}
