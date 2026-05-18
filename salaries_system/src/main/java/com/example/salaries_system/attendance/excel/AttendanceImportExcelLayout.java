package com.example.salaries_system.attendance.excel;

/**
 * Column layout for {@code POST /api/attendance/import} and the downloadable import template.
 * Row 0 = headers; data rows start at row index 1 (Excel row 2).
 */
public final class AttendanceImportExcelLayout {

    private AttendanceImportExcelLayout() {}

    /** First sheet — must stay index 0 because the importer uses {@code getSheetAt(0)}. */
    public static final String DATA_SHEET_NAME = "Attendance";

    public static final String[] COLUMN_HEADERS = {
            "Employee_Code",
            "Date",
            "Check_In",
            "Check_Out",
            "Status_Remark",
    };

    public static final int COL_EMPLOYEE = 0;
    public static final int COL_DATE = 1;
    public static final int COL_CHECK_IN = 2;
    public static final int COL_CHECK_OUT = 3;
    public static final int COL_REMARK = 4;
}
