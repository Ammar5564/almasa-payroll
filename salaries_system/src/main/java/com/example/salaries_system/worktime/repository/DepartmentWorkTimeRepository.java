package com.example.salaries_system.worktime.repository;

import com.example.salaries_system.worktime.model.DepartmentWorkTime;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentWorkTimeRepository extends JpaRepository<DepartmentWorkTime, Long> {

    Optional<DepartmentWorkTime> findByDepartmentName(String departmentName);

    List<DepartmentWorkTime> findAllByDepartmentName(String departmentName);

    Optional<DepartmentWorkTime> findByDepartmentNameAndBranchName(String departmentName, String branchName);

    boolean existsByDepartmentNameAndBranchName(String departmentName, String branchName);
}
