package com.smartsupplypro.inventory.dto;

import java.math.BigDecimal;

import lombok.Builder;

/**
 * Response payload for a financial period summary using Weighted Average Cost (WAC) methodology.
 *
 * <p>Returned by {@link com.smartsupplypro.inventory.controller.AnalyticsController}
 * for the financial analytics endpoint.</p>
 *
 * @param method        costing method identifier; currently always {@code "WAC"}
 * @param fromDate      period start date in {@code yyyy-MM-dd} format
 * @param toDate        period end date in {@code yyyy-MM-dd} format
 * @param openingQty    opening inventory unit count
 * @param openingValue  opening inventory value
 * @param purchasesQty  units received during the period
 * @param purchasesCost total cost of received stock
 * @param returnsInQty  units returned by customers during the period
 * @param returnsInCost total value of customer returns
 * @param cogsQty       units sold during the period
 * @param cogsCost      total cost of goods sold
 * @param writeOffQty   units written off or adjusted out
 * @param writeOffCost  total value written off
 * @param endingQty     closing inventory unit count
 * @param endingValue   closing inventory value
 */
@Builder
public record FinancialSummaryDTO(
        String method,
        String fromDate,
        String toDate,
        long openingQty,
        BigDecimal openingValue,
        long purchasesQty,
        BigDecimal purchasesCost,
        long returnsInQty,
        BigDecimal returnsInCost,
        long cogsQty,
        BigDecimal cogsCost,
        long writeOffQty,
        BigDecimal writeOffCost,
        long endingQty,
        BigDecimal endingValue
) {}
