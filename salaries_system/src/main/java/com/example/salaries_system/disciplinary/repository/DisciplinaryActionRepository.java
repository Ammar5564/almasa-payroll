package com.example.salaries_system.disciplinary.repository;

import com.example.salaries_system.disciplinary.model.DisciplinaryAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface DisciplinaryActionRepository
        extends JpaRepository<DisciplinaryAction, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM DisciplinaryAction d WHERE d.employee.id = :employeeId")
    void deleteAllForEmployee(@Param("employeeId") Long employeeId);

    List<DisciplinaryAction> findByEmployee_Name(String employeeName);

    @Query("SELECT d FROM DisciplinaryAction d WHERE d.employee.name = :employeeName AND YEAR(d.date) = :year AND MONTH(d.date) = :month")
    List<DisciplinaryAction> findByEmployee_NameAndYearAndMonth(
            @Param("employeeName") String employeeName,
            @Param("year") int year,
            @Param("month") int month
    );

    List<DisciplinaryAction> findByEmployee_NameAndDateBetween(String employeeName, LocalDate startDate, LocalDate endDate);
}
