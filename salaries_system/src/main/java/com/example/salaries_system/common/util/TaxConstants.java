package com.example.salaries_system.common.util;

import java.math.BigDecimal;

/**
 * Central constants table for all tax & SI rates.
 * Change values here to update the entire system.
 */
public final class TaxConstants {

    private TaxConstants() {}

    // ── Social Insurance (Law 148/2019 – Updated rates) ────────────────────
    public static final BigDecimal SI_MIN_BASE      = BigDecimal.valueOf(2_700);
    public static final BigDecimal SI_MAX_BASE      = BigDecimal.valueOf(16_700);
    public static final BigDecimal SI_EMPLOYEE_RATE = new BigDecimal("0.11");   // 11%
    public static final BigDecimal SI_COMPANY_RATE  = new BigDecimal("0.1875"); // 18.75%

    // ── Income Tax – Personal Exemption (Current Law) ───────────────────────
    public static final BigDecimal PERSONAL_EXEMPTION = BigDecimal.valueOf(20_000);

    // ── Income Tax Slab Ceilings – Law 30/2023 (annual EGP) ────────────────
    public static final BigDecimal SLAB1_CEIL = BigDecimal.valueOf(40_000);
    public static final BigDecimal SLAB2_CEIL = BigDecimal.valueOf(55_000);
    public static final BigDecimal SLAB3_CEIL = BigDecimal.valueOf(70_000);
    public static final BigDecimal SLAB4_CEIL = BigDecimal.valueOf(200_000);
    public static final BigDecimal SLAB5_CEIL = BigDecimal.valueOf(400_000);
    public static final BigDecimal SLAB6_CEIL = BigDecimal.valueOf(1_200_000);
    // Slab 7: everything above 1,200,000

    // ── Income Tax Slab Rates ───────────────────────────────────────────────
    public static final BigDecimal SLAB1_RATE = BigDecimal.ZERO;           // 0%
    public static final BigDecimal SLAB2_RATE = new BigDecimal("0.10");    // 10%
    public static final BigDecimal SLAB3_RATE = new BigDecimal("0.15");    // 15%
    public static final BigDecimal SLAB4_RATE = new BigDecimal("0.20");    // 20%
    public static final BigDecimal SLAB5_RATE = new BigDecimal("0.225");   // 22.5%
    public static final BigDecimal SLAB6_RATE = new BigDecimal("0.25");    // 25%
    public static final BigDecimal SLAB7_RATE = new BigDecimal("0.275");   // 27.5%

    // ── Martyrs' Fund ────────────────────────────────────────────────────────
    public static final BigDecimal MARTYRS_FUND_RATE = new BigDecimal("0.0005"); // 0.05%
}
