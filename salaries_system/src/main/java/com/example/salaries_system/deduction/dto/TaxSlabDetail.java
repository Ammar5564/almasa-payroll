package com.example.salaries_system.deduction.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;

/** One row of the annual tax slab table, showing exactly how much tax fell in this bracket. */
@Data
@AllArgsConstructor
public class TaxSlabDetail {
    private String     slabLabel;      // e.g. "Slab 2 (10%)"
    private BigDecimal rangeFrom;      // slab lower bound (EGP annual)
    private BigDecimal rangeTo;        // slab upper bound; null = unlimited
    private BigDecimal rate;           // e.g. 0.10
    private BigDecimal amountInRange;  // portion of taxable income that falls here
    private BigDecimal taxOnSlab;      // amountInRange * rate
}
