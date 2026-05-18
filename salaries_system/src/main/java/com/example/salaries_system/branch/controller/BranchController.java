package com.example.salaries_system.branch.controller;

import com.example.salaries_system.branch.model.Branch;
import com.example.salaries_system.branch.repository.BranchRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
@CrossOrigin
public class BranchController {

    private final BranchRepository repository;

    public BranchController(BranchRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Branch> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public Branch create(@RequestBody Branch branch) {
        if (branch.getName() == null || branch.getName().trim().isEmpty()) {
            throw new RuntimeException("Branch name is required");
        }
        return repository.save(branch);
    }

    @DeleteMapping("/{name}")
    public void delete(@PathVariable String name) {
        repository.deleteById(name);
    }
}
