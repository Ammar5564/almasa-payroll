package com.example.salaries_system.payroll.repository;
import com.example.salaries_system.payroll.model.PayrollRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PayrollRecordRepository
        extends JpaRepository<PayrollRecord, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM PayrollRecord p WHERE p.employee.id = :employeeId")
    void deleteAllForEmployee(@Param("employeeId") Long employeeId);

    Optional<PayrollRecord> findByEmployee_NameAndMonth(
            String name,
            LocalDate month
    );
    
    List<PayrollRecord> findByMonth(LocalDate month);

    List<PayrollRecord> findByMonthBetween(LocalDate start, LocalDate end);

    List<PayrollRecord> findByEmployee_NameAndMonthBetween(String employeeName, LocalDate startDate, LocalDate endDate);
}
