package com.example.salaries_system.loan.repository;
import com.example.salaries_system.loan.model.LoanInstallment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface LoanInstallmentRepository
        extends JpaRepository<LoanInstallment, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM LoanInstallment i WHERE i.loan.id = :loanId")
    void deleteAllForLoan(@Param("loanId") Long loanId);

    /** All installments for loans owned by this employee (FK-safe: run before deleting loans). */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM LoanInstallment i WHERE i.loan.id IN (SELECT l.id FROM Loan l WHERE l.employee.id = :employeeId)")
    void deleteAllForEmployeeLoans(@Param("employeeId") Long employeeId);

    List<LoanInstallment> findByMonthAndPaidFalse(LocalDate month);
    
    List<LoanInstallment> findByMonthBetween(LocalDate start, LocalDate end);
}

