package com.example.salaries_system.branch.repository;

import com.example.salaries_system.branch.model.Branch;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BranchRepository extends JpaRepository<Branch, String> {}
