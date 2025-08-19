package com.smartsupplypro.inventory.dto;

import java.math.BigDecimal;
import lombok.*;

/**
 * Period financial summary computed with Weighted Average Cost (WAC).
 *
 * <p>Quantities are unit counts; values are monetary amounts in your inventory currency.
 * Dates are ISO strings to make serialization predictable for UIs.</p>
 */
@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class FinancialSummaryDTO {
    /** Costing method used for this summary (currently "WAC"). */
    private String method;

    /** Inclusive start and end dates in ISO yyyy-MM-dd form. */
    private String fromDate;
    private String toDate;

    /** Opening inventory (as of start-1 second). */
    private long openingQty;
    private BigDecimal openingValue;

    /** Purchases (incl. receipts) during [from..to]. */
    private long purchasesQty;
    private BigDecimal purchasesCost;

    /** Customer returns (stock back in) during [from..to]. */
    private long returnsInQty;
    private BigDecimal returnsInCost;

    /** Cost of goods sold / consumption during [from..to]. */
    private long cogsQty;
    private BigDecimal cogsCost;

    /** Write-offs (damaged/destroyed/expired/lost/adjustment_out) during [from..to]. */
    private long writeOffQty;
    private BigDecimal writeOffCost;

    /** Ending inventory (as of end). */
    private long endingQty;
    private BigDecimal endingValue;
}
