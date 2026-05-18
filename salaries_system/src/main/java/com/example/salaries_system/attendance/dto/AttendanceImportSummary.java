package com.example.salaries_system.attendance.dto;

import java.util.List;

/**
 * Enterprise-style Excel import outcome so HR sees processed vs skipped rows.
 */
public record AttendanceImportSummary(
        List<AttendanceResponse> imported,
        int rowsRead,
        int rowsImported,
        int skippedDuplicate,
        int skippedInvalidEmployee,
        int skippedOther
) {}
