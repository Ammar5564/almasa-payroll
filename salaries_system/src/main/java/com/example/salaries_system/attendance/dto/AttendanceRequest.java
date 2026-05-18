package com.example.salaries_system.attendance.dto;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;


@Data
public class AttendanceRequest {

    private String employeeName;
    private LocalDate date;
    private LocalTime actualStart;
    private LocalTime actualEnd;
}
