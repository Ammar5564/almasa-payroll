package com.example.salaries_system.category.controller;

import com.example.salaries_system.category.model.Category;
import com.example.salaries_system.category.repository.CategoryRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin
public class CategoryController {

    private final CategoryRepository repository;

    public CategoryController(CategoryRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Category> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public Category create(@RequestBody Category category) {
        if (category.getName() == null || category.getName().trim().isEmpty()) {
            throw new RuntimeException("Category name is required");
        }
        return repository.save(category);
    }

    @DeleteMapping("/{name}")
    public void delete(@PathVariable String name) {
        repository.deleteById(name);
    }
}
