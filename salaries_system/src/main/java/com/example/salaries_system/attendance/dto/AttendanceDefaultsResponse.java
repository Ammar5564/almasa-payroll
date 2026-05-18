package com.example.salaries_system.attendance.dto;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AttendanceDefaultsResponse {
    
    private LocalDate today;
    private LocalTime officialStart;
    private LocalTime officialEnd;
    
    public AttendanceDefaultsResponse() {}
    
    public AttendanceDefaultsResponse(LocalDate today, LocalTime officialStart, LocalTime officialEnd) {
        this.today = today;
        this.officialStart = officialStart;
        this.officialEnd = officialEnd;
    }
}

