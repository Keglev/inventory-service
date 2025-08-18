package com.smartsupplypro.inventory.dto;

import java.math.BigDecimal;
import lombok.*;

/**
 * Period financial summary computed via Weighted Average Cost (WAC).
 * Quantities are units; values are in the inventory currency.
 */
@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class FinancialSummaryDTO {
    private String method;       // "WAC"
    private String fromDate;     // ISO yyyy-MM-dd
    private String toDate;       // ISO yyyy-MM-dd

    // Opening inventory (as of start-1 second)
    private long openingQty;
    private BigDecimal openingValue;

    // Purchases (incl. receipts) during [from..to]
    private long purchasesQty;
    private BigDecimal purchasesCost;

    // Customer returns (stock back in)
    private long returnsInQty;
    private BigDecimal returnsInCost;

    // Cost of goods sold / consumption during [from..to]
    private long cogsQty;
    private BigDecimal cogsCost;

    // Write-offs (damaged/destroyed/expired/lost/adjustment_out)
    private long writeOffQty;
    private BigDecimal writeOffCost;

    // Ending inventory (as of end)
    private long endingQty;
    private BigDecimal endingValue;
}

