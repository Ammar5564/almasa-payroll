package com.example.salaries_system.disciplinary.controller;

import com.example.salaries_system.disciplinary.model.DisciplinaryAction;
import com.example.salaries_system.disciplinary.service.DisciplinaryActionService;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/disciplinary")
@CrossOrigin
public class DisciplinaryActionController {

    private final DisciplinaryActionService disciplinaryActionService;

    public DisciplinaryActionController(DisciplinaryActionService disciplinaryActionService) {
        this.disciplinaryActionService = disciplinaryActionService;
    }

    @PostMapping
    public DisciplinaryAction addDisciplinaryAction(@RequestBody DisciplinaryActionRequest request) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Disciplinary action amount must be positive");
        }

        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new RuntimeException("Reason is required for disciplinary action");
        }

        if (request.getDate() == null) {
            request.setDate(LocalDate.now());
        }

        return disciplinaryActionService.addDisciplinaryAction(
                request.getEmployeeName(),
                request.getAmount(),
                request.getReason(),
                request.getDate()
        );
    }

    @GetMapping("/{employeeName}")
    public List<DisciplinaryAction> getDisciplinaryActionsByEmployee(@PathVariable String employeeName) {
        return disciplinaryActionService.getDisciplinaryActionsByEmployee(employeeName);
    }

    public static class DisciplinaryActionRequest {
        private String employeeName;
        private BigDecimal amount;
        private String reason;
        private LocalDate date;

        public String getEmployeeName() {
            return employeeName;
        }

        public void setEmployeeName(String employeeName) {
            this.employeeName = employeeName;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }

        public LocalDate getDate() {
            return date;
        }

        public void setDate(LocalDate date) {
            this.date = date;
        }
    }
}
