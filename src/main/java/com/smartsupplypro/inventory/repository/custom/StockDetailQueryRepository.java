package com.smartsupplypro.inventory.repository.custom;

import java.time.LocalDateTime;
import java.util.List;

import com.smartsupplypro.inventory.dto.StockEventRowDTO;

/**
 * Custom repository for granular stock history searches and WAC event streaming.
 *
 * <p>Handles multi-criteria filtering and cost-flow event replay that cannot be expressed
 * as Spring Data derived query methods — both require dynamic SQL or JPQL construction.</p>
 *
 * @see StockHistoryRepository
 */
public interface StockDetailQueryRepository {

    /**
     * Returns filtered stock update records with all criteria optional.
     *
     * <p>All parameters are nullable; pass {@code null} to omit a filter.
     * Result format: [item_name, supplier_name, quantity_change, reason, created_by, created_at].
     *
     * @param startDate  optional minimum creation timestamp
     * @param endDate    optional maximum creation timestamp
     * @param itemName   optional partial item name (case-insensitive)
     * @param supplierId optional supplier ID (exact match)
     * @param createdBy  optional creator username (case-insensitive exact match)
     * @param minChange  optional minimum quantity change
     * @param maxChange  optional maximum quantity change
     * @return filtered records ordered by creation time descending
     */
    List<Object[]> searchStockUpdates(
        LocalDateTime startDate,
        LocalDateTime endDate,
        String itemName,
        String supplierId,
        String createdBy,
        Integer minChange,
        Integer maxChange
    );

    /**
     * Returns time-ordered stock events up to {@code end} for WAC cost-flow replay.
     *
     * <p>Events are ordered by item then timestamp to allow sequential reconstruction
     * of per-item running quantities required by the Weighted Average Cost algorithm.
     *
     * @param end        inclusive upper timestamp bound
     * @param supplierId optional supplier filter
     * @return events projected to {@link StockEventRowDTO}, ordered by itemId then timestamp
     */
    List<StockEventRowDTO> streamEventsForWAC(LocalDateTime end, String supplierId);
}
