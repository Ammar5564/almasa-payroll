package com.example.salaries_system.attendance.repository;
import com.example.salaries_system.attendance.model.Attendance;
import com.example.salaries_system.attendance.model.AbsenceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository
        extends JpaRepository<Attendance, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM Attendance a WHERE a.employee.id = :employeeId")
    void deleteAllForEmployee(@Param("employeeId") Long employeeId);

    Optional<Attendance> findByEmployee_NameAndDate(String name, LocalDate date);

    boolean existsByEmployee_NameAndDate(String name, LocalDate date);

    boolean existsByEmployee_IdAndDate(Long employeeId, LocalDate date);

    List<Attendance> findByEmployee_NameAndDateBetween(
            String name,
            LocalDate start,
            LocalDate end
    );
    
    List<Attendance> findByDateBetween(LocalDate start, LocalDate end);

    List<Attendance> findByEmployee_NameAndAbsenceTypeIsNotNull(String employeeName);

    List<Attendance> findByEmployee_NameAndAbsenceType(String employeeName, AbsenceType absenceType);

    // ── Global absence history queries (Manager History Screen) ───────────────

    /** All records with a non-null absenceType (all employees). */
    List<Attendance> findByAbsenceTypeIsNotNull();

    /** All records in a date range that have an absenceType. */
    List<Attendance> findByAbsenceTypeIsNotNullAndDateBetween(LocalDate start, LocalDate end);

    /** Records for employees whose name contains the given string (case-insensitive). */
    List<Attendance> findByEmployee_NameContainingIgnoreCaseAndAbsenceTypeIsNotNull(String name);

    /** Name search + date range combined. */
    List<Attendance> findByEmployee_NameContainingIgnoreCaseAndAbsenceTypeIsNotNullAndDateBetween(
            String name, LocalDate start, LocalDate end);
}
