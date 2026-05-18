package com.example.salaries_system.worktime.controller;

import com.example.salaries_system.worktime.model.DepartmentWorkTime;
import com.example.salaries_system.worktime.repository.DepartmentWorkTimeRepository;
import com.example.salaries_system.employee.repository.EmployeeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/departments")
@CrossOrigin
public class DepartmentWorkTimeController {

    private static final LocalTime DEFAULT_STANDARD_START = LocalTime.of(9, 0);
    private static final LocalTime DEFAULT_EARLY_START    = LocalTime.of(8, 30);
    private static final LocalTime DEFAULT_END            = LocalTime.of(17, 30);

    private final DepartmentWorkTimeRepository repository;
    private final EmployeeRepository employeeRepository;

    public DepartmentWorkTimeController(DepartmentWorkTimeRepository repository, EmployeeRepository employeeRepository) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
    }

    /** GET /api/departments — all dept×branch rows */
    @GetMapping
    public List<DepartmentWorkTime> getAll() {
        return repository.findAll();
    }

    /**
     * GET /api/departments/unique-names
     * Returns a distinct list of department names with their base settings
     * (first matching row per name). Used to populate the first dropdown
     * in the Employee form before a branch/location is chosen.
     */
    @GetMapping("/unique-names")
    public List<Map<String, Object>> getUniqueNames() {
        return repository.findAll().stream()
                .collect(Collectors.toMap(
                        DepartmentWorkTime::getDepartmentName,
                        d -> d,
                        (a, b) -> a   // keep first entry per dept name
                ))
                .values().stream()
                .map(d -> Map.<String, Object>of(
                        "departmentName", d.getDepartmentName(),
                        "officialStart",  d.getOfficialStart() != null ? d.getOfficialStart().toString() : "",
                        "officialEnd",    d.getOfficialEnd()   != null ? d.getOfficialEnd().toString()   : "",
                        "flexibleGroup",  Boolean.TRUE.equals(d.getFlexibleGroup())
                ))
                .collect(Collectors.toList());
    }

    /**
     * GET /api/departments/branches?departmentName=...
     * Returns all branch rows for a given department name.
     * Empty list = no branches (single-location dept).
     */
    @GetMapping("/branches")
    public List<DepartmentWorkTime> getBranchesForDept(@RequestParam String departmentName) {
        return repository.findAll().stream()
                .filter(d -> d.getDepartmentName().equalsIgnoreCase(departmentName)
                        && d.getBranchName() != null && !d.getBranchName().isBlank())
                .collect(Collectors.toList());
    }

    /**
     * POST /api/departments
     * Body (all fields optional except departmentName):
     * {
     *   "departmentName": "المبيعات",
     *   "branchName":     "التجمع الخامس",   // null = no branch
     *   "officialStart":  "09:00",            // defaults applied if omitted
     *   "officialEnd":    "17:30",
     *   "flexibleGroup":  false               // true = Top Management type
     * }
     * The HR manager decides the times and flexible flag — nothing is hard-coded.
     */
    @PostMapping
    public DepartmentWorkTime addDepartment(@RequestBody Map<String, Object> body) {
        String deptName = (String) body.get("departmentName");
        if (deptName == null || deptName.trim().isEmpty()) {
            throw new RuntimeException("Department name is required");
        }
        deptName = deptName.trim();

        String branchName = (String) body.get("branchName");
        if (branchName != null && branchName.isBlank()) branchName = null;

        if (repository.existsByDepartmentNameAndBranchName(deptName, branchName)) {
            throw new RuntimeException("This department / location already exists");
        }

        LocalTime start = parseTimeOrDefault(body.get("officialStart"), DEFAULT_STANDARD_START);
        LocalTime end   = parseTimeOrDefault(body.get("officialEnd"),   DEFAULT_END);

        Boolean flexible = body.get("flexibleGroup") instanceof Boolean
                ? (Boolean) body.get("flexibleGroup") : false;

        DepartmentWorkTime dept = new DepartmentWorkTime();
        dept.setDepartmentName(deptName);
        dept.setBranchName(branchName);
        dept.setOfficialStart(start);
        dept.setOfficialEnd(end);
        dept.setFlexibleGroup(flexible);

        return repository.save(dept);
    }

    /** DELETE /api/departments/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Department not found");
        }
        
        // Check if employees are assigned to this department
        if (employeeRepository.existsByDepartmentWorkTimeId(id)) {
            throw new RuntimeException("Cannot delete department: employees are still assigned to it");
        }
        
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private LocalTime parseTimeOrDefault(Object value, LocalTime defaultTime) {
        if (value == null) return defaultTime;
        try { return LocalTime.parse(value.toString()); }
        catch (Exception e) { return defaultTime; }
    }
}
