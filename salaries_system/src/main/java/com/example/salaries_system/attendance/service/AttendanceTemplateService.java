package com.example.salaries_system.attendance.service;

import com.example.salaries_system.attendance.excel.AttendanceImportExcelLayout;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormat;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;

/**
 * Builds the official attendance Excel import template (headers + sample row + user notes sheet).
 */
@Service
public class AttendanceTemplateService {

    private static final String INSTRUCTIONS_SHEET = "Instructions_تعليمات";

    public byte[] buildImportTemplate() throws IOException {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            DataFormat dataFormat = wb.createDataFormat();

            CellStyle headerStyle = headerStyle(wb);
            CellStyle sampleStyle = sampleRowStyle(wb);
            CellStyle dateStyle = wb.createCellStyle();
            dateStyle.setDataFormat(dataFormat.getFormat("yyyy-mm-dd"));
            dateStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            Sheet data = wb.createSheet(AttendanceImportExcelLayout.DATA_SHEET_NAME);
            Row headerRow = data.createRow(0);
            for (int i = 0; i < AttendanceImportExcelLayout.COLUMN_HEADERS.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(AttendanceImportExcelLayout.COLUMN_HEADERS[i]);
                c.setCellStyle(headerStyle);
                data.setColumnWidth(i, i == AttendanceImportExcelLayout.COL_REMARK ? 9000 : 4800);
            }

            Row sample = data.createRow(1);
            Cell emp = sample.createCell(AttendanceImportExcelLayout.COL_EMPLOYEE);
            emp.setCellValue("EMP-001");
            emp.setCellStyle(sampleStyle);

            Cell dateCell = sample.createCell(AttendanceImportExcelLayout.COL_DATE);
            LocalDate exampleDate = LocalDate.now().withDayOfMonth(15);
            Date excelDate = Date.from(exampleDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
            dateCell.setCellValue(excelDate);
            dateCell.setCellStyle(dateStyle);

            Cell checkInCell = sample.createCell(AttendanceImportExcelLayout.COL_CHECK_IN);
            checkInCell.setCellValue("08:30");
            checkInCell.setCellStyle(sampleStyle);

            Cell checkOutCell = sample.createCell(AttendanceImportExcelLayout.COL_CHECK_OUT);
            checkOutCell.setCellValue("17:00");
            checkOutCell.setCellStyle(sampleStyle);

            Cell remark = sample.createCell(AttendanceImportExcelLayout.COL_REMARK);
            remark.setCellValue("");
            remark.setCellStyle(sampleStyle);

            for (int r = 2; r <= 12; r++) {
                data.createRow(r);
            }

            data.createFreezePane(0, 1);

            Sheet help = wb.createSheet(INSTRUCTIONS_SHEET);
            help.setColumnWidth(0, 22_000);
            CellStyle noteStyle = noteStyle(wb);
            String[] lines = new String[] {
                    "Attendance import — how to use this file / استيراد الحضور",
                    "",
                    "1) Use the \"" + AttendanceImportExcelLayout.DATA_SHEET_NAME + "\" sheet only for upload. "
                            + "The system reads the first sheet.",
                    "   يُستورد من الورقة الأولى فقط — \"" + AttendanceImportExcelLayout.DATA_SHEET_NAME + "\".",
                    "",
                    "2) Row 1 (under the headers) is an EXAMPLE. Delete it before importing real data, "
                            + "or replace it with your rows.",
                    "   الصف الأول تحت العناوين مثال توضيحي — احذفه أو استبدله قبل الرفع.",
                    "",
                    "3) Employee_Code: use the employee business code (e.g. EMP-001) OR the full employee name as in the system.",
                    "   عمود الموظف: رمز الموظف (مثل EMP-001) أو الاسم الكامل كما في النظام.",
                    "",
                    "4) Date: yyyy-MM-dd as text, or an Excel date cell. Invalid dates are skipped.",
                    "   التاريخ: نص yyyy-MM-dd أو خلية تاريخ في Excel.",
                    "",
                    "5) Check_In / Check_Out: use 24-hour text like 08:30 and 17:00 (HH:mm). Leave both empty if not applicable.",
                    "   وقت الدخول/الخروج: بصيغة 24 ساعة مثل 08:30 و 17:00.",
                    "",
                    "6) Status_Remark: optional free-text remark stored on the attendance row.",
                    "   الملاحظة: اختيارية.",
                    "",
                    "7) Rows with empty Employee_Code or Date are ignored. Duplicate (employee + date) rows are skipped.",
                    "   الصفوف الفارغة أو المكررة تُتخطى.",
            };
            for (int i = 0; i < lines.length; i++) {
                Row row = help.createRow(i);
                Cell cell = row.createCell(0);
                cell.setCellValue(lines[i]);
                cell.setCellStyle(noteStyle);
            }

            wb.write(out);
            return out.toByteArray();
        }
    }

    private static CellStyle headerStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setBold(true);
        f.setFontHeightInPoints((short) 11);
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setBorderBottom(BorderStyle.THIN);
        s.setBorderTop(BorderStyle.THIN);
        s.setBorderLeft(BorderStyle.THIN);
        s.setBorderRight(BorderStyle.THIN);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        s.setAlignment(HorizontalAlignment.CENTER);
        return s;
    }

    private static CellStyle sampleRowStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        s.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setBorderBottom(BorderStyle.THIN);
        s.setBorderTop(BorderStyle.THIN);
        s.setBorderLeft(BorderStyle.THIN);
        s.setBorderRight(BorderStyle.THIN);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        return s;
    }

    private static CellStyle noteStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        s.setWrapText(true);
        s.setVerticalAlignment(VerticalAlignment.TOP);
        return s;
    }
}
