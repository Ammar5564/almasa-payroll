package com.example.salaries_system.common.util;

import java.time.Duration;
import java.time.LocalTime;

public class TimeCalculator {

    public static long calculateLate(LocalTime officialStart, LocalTime actualStart) {

        if (actualStart.isBefore(officialStart)) return 0;

        return Duration.between(officialStart, actualStart).toMinutes();
    }

    public static long calculateOvertime(LocalTime officialEnd, LocalTime actualEnd) {

        if (actualEnd.isBefore(officialEnd)) return 0;

        return Duration.between(officialEnd, actualEnd).toMinutes();
    }
}
