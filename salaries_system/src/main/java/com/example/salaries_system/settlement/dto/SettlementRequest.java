package com.example.salaries_system.settlement.dto;

import lombok.Data;
import java.time.LocalDate;

/**
 * Request body for both the preview and confirmation endpoints.
 */
@Data
public class SettlementRequest {
    /** The employee's unique name (primary key). */
    private String    employeeName;
    /** Official last working day (used to calculate pro-rated salary). */
    private LocalDate terminationDate;
}
