package com.smartsupplypro.inventory.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Financial period summary DTO using Weighted Average Cost (WAC) methodology.
 * Provides opening/closing balances, COGS, purchases, and write-offs for analysis.
 * @see AnalyticsController
 * @see dto-patterns.md for financial calculation patterns
 */
@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class FinancialSummaryDTO {
    // Enterprise Comment: WAC (Weighted Average Cost) methodology - provides consistent valuation
    // across periods by averaging purchase costs, essential for accurate financial reporting
    
    /** Costing method identifier (currently "WAC"). */
    private String method;

    /** Period start date (ISO yyyy-MM-dd format). */
    private String fromDate;
    /** Period end date (ISO yyyy-MM-dd format). */
    private String toDate;

    /** Opening inventory quantities and values. */
    private long openingQty;
    private BigDecimal openingValue;

    /** Purchases and receipts during period. */
    private long purchasesQty;
    private BigDecimal purchasesCost;

    /** Customer returns (inbound stock). */
    private long returnsInQty;
    private BigDecimal returnsInCost;

    /** Cost of goods sold during period. */
    private long cogsQty;
    private BigDecimal cogsCost;

    /** Write-offs and adjustments out. */
    private long writeOffQty;
    private BigDecimal writeOffCost;

    /** Closing inventory quantities and values. */
    private long endingQty;
    private BigDecimal endingValue;
}
