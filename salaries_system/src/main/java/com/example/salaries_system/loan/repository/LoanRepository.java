package com.example.salaries_system.loan.repository;
import com.example.salaries_system.loan.model.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface LoanRepository
        extends JpaRepository<Loan, Long> {

    @Query("SELECT l FROM Loan l WHERE l.employee.id = :employeeId")
    List<Loan> findAllByEmployeeId(@Param("employeeId") Long employeeId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM Loan l WHERE l.employee.id = :employeeId")
    void deleteAllLoansForEmployee(@Param("employeeId") Long employeeId);

    List<Loan> findByEmployee_Name(String name);

    List<Loan> findByEmployee_NameAndClosedFalse(String employeeName);

    List<Loan> findByCreatedAtBetween(LocalDate start, LocalDate end);
}
