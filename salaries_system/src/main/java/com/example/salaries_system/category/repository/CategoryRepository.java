package com.example.salaries_system.category.repository;

import com.example.salaries_system.category.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, String> {}
