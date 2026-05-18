package com.example.salaries_system.category.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "employee_categories")
@Data
public class Category {
    @Id
    private String name;
}
