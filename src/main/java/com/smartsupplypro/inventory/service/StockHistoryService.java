package com.smartsupplypro.inventory.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;

/**
 * Service contract for immutable stock movement event logging and audit trail management.
 *
 * <p>Defines operations for logging stock changes with optional price snapshots,
 * querying history by item or reason, paginated filtered search, and deletion recording.</p>
 *
 * @see com.smartsupplypro.inventory.service.impl.StockHistoryServiceImpl
 * @see com.smartsupplypro.inventory.model.StockHistory
 * @see com.smartsupplypro.inventory.validation.StockHistoryValidator
 */
public interface StockHistoryService {

    /**
     * Retrieves all stock history entries.
     * @return list of all stock history DTOs
     */
    List<StockHistoryDTO> getAll();

    /**
     * Retrieves stock history for a specific inventory item, newest first.
     * @param itemId inventory item ID
     * @return stock history DTOs ordered by timestamp descending
     */
    List<StockHistoryDTO> getByItemId(String itemId);

    /**
     * Retrieves stock history filtered by change reason, newest first.
     * @param reason stock change reason filter
     * @return stock history DTOs ordered by timestamp descending
     */
    List<StockHistoryDTO> getByReason(StockChangeReason reason);

    /**
     * Retrieves paginated stock history filtered by date range, item name, and supplier.
     * @param startDate  start date (inclusive, nullable)
     * @param endDate    end date (inclusive, nullable)
     * @param itemName   item name filter (partial match, nullable)
     * @param supplierId supplier ID filter (nullable)
     * @param pageable   pagination parameters
     * @return page of stock history DTOs
     */
    Page<StockHistoryDTO> findFiltered(LocalDateTime startDate,
                                       LocalDateTime endDate,
                                       String itemName,
                                       String supplierId,
                                       Pageable pageable);

    /**
     * Logs a stock change without a price snapshot.
     * Delegates to the price-aware overload with a null price.
     *
     * @param itemId    inventory item ID
     * @param change    quantity change (positive or negative)
     * @param reason    business reason for change
     * @param createdBy user who initiated change
     * @throws IllegalArgumentException if input validation fails
     */
    void logStockChange(String itemId, int change, StockChangeReason reason, String createdBy);

    /**
     * Logs a stock change with a price snapshot for WAC analytics.
     * @param itemId        inventory item ID
     * @param change        quantity change (positive or negative)
     * @param reason        business reason for change
     * @param createdBy     user who initiated change
     * @param priceAtChange unit price at time of change (nullable)
     * @throws IllegalArgumentException if input validation fails
     */
    void logStockChange(String itemId,
                        int change,
                        StockChangeReason reason,
                        String createdBy,
                        BigDecimal priceAtChange);

    /**
     * Persists a stock history event from an API-facing DTO.
     * Applies domain validation and enriches the record with denormalized supplierId.
     *
     * @param dto stock history DTO (validated by this method)
     * @throws IllegalArgumentException if validation fails or reason is not a valid enum name
     */
    void save(StockHistoryDTO dto);

    /**
     * Records item deletion in stock history using -1 as a sentinel quantity.
     * @param itemId    inventory item ID
     * @param reason    deletion reason
     * @param createdBy user who initiated deletion
     */
    void delete(String itemId, StockChangeReason reason, String createdBy);
}
