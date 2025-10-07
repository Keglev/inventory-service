package com.smartsupplypro.inventory.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.StockHistoryMapper;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.validation.StockHistoryValidator;

import lombok.RequiredArgsConstructor;

/**
 * Service for immutable stock movement event logging and audit trail management.
 *
 * <p><strong>Characteristics</strong>:
 * <ul>
 *   <li><strong>Event Sourcing</strong>: Immutable history records for all inventory changes</li>
 *   <li><strong>Denormalization</strong>: Stores supplier ID for efficient analytics queries</li>
 *   <li><strong>Price Snapshots</strong>: Captures unit price at transaction time for WAC</li>
 *   <li><strong>Audit Compliance</strong>: Tracks user, timestamp, reason for all changes</li>
 *   <li><strong>Read-Only Operations</strong>: Query methods with filtering and pagination</li>
 * </ul>
 *
 * <p><strong>Architecture Documentation</strong>:
 * For event sourcing patterns, denormalization strategy, compliance features, and integration details, see:
 * <a href="../../../../../docs/architecture/services/stock-history-service.md">Stock History Service Architecture</a>
 *
 * @see StockHistory
 * @see StockHistoryValidator
 * @see StockHistoryMapper
 */
@Service
@RequiredArgsConstructor
public class StockHistoryService {

    private final StockHistoryRepository repository;
    private final InventoryItemRepository itemRepository;

    /**
     * Resolves supplier ID for denormalization in stock history records.
     * @param itemId inventory item ID
     * @return supplier ID or null if item/supplier not found
     */
    private String resolveSupplierId(String itemId) {
        // Enterprise Comment: Denormalization for Analytics Performance
        // Supplier ID stored directly on history record to avoid joins
        // Enables efficient supplier-centric analytics queries with index: (SUPPLIER_ID, CREATED_AT)
        return itemRepository.findById(itemId)
                .map(item -> item.getSupplierId())
                .orElse(null); // keep null-safe; index still works for present values
    }

    /**
     * Retrieves all stock history entries.
     * @return list of stock history DTOs
     */
    public List<StockHistoryDTO> getAll() {
        return repository.findAll().stream()
                .map(StockHistoryMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves stock history for specific inventory item (newest first).
     * @param itemId inventory item ID
     * @return list of stock history DTOs ordered by timestamp descending
     */
    public List<StockHistoryDTO> getByItemId(String itemId) {
        // Prefer ordered repo method (added in our repository suggestions)
        var list = repository.findByItemIdOrderByTimestampDesc(itemId);
        return list.stream().map(StockHistoryMapper::toDTO).toList();
    }

    /**
     * Retrieves stock history for specific change reason (newest first).
     * @param reason stock change reason filter
     * @return list of stock history DTOs ordered by timestamp descending
     */
    public List<StockHistoryDTO> getByReason(StockChangeReason reason) {
        var list = repository.findByReasonOrderByTimestampDesc(reason);
        return list.stream().map(StockHistoryMapper::toDTO).toList();
    }

    /**
     * Retrieves paginated stock history filtered by date range, item name, and supplier.
     * @param startDate start date (inclusive)
     * @param endDate end date (inclusive)
     * @param itemName item name filter (partial match)
     * @param supplierId supplier ID filter
     * @param pageable pagination parameters
     * @return page of stock history DTOs
     */
    public Page<StockHistoryDTO> findFiltered(LocalDateTime startDate,
                                              LocalDateTime endDate,
                                              String itemName,
                                              String supplierId,
                                              Pageable pageable) {
        return repository.findFiltered(startDate, endDate, itemName, supplierId, pageable)
                .map(StockHistoryMapper::toDTO);
    }

    /**
     * Logs stock change without price snapshot (backwards compatibility).
     * @param itemId inventory item ID
     * @param change quantity change (positive or negative)
     * @param reason business reason for change
     * @param createdBy user who initiated change
     * @throws IllegalArgumentException if input validation fails
     */
    public void logStockChange(String itemId, int change, StockChangeReason reason, String createdBy) {
        // Delegate to the price-aware overload with a null snapshot
        logStockChange(itemId, change, reason, createdBy, null);
    }

    /**
     * Logs stock change with price snapshot for analytics (WAC calculation).
     * @param itemId inventory item ID
     * @param change quantity change (positive or negative)
     * @param reason business reason for change
     * @param createdBy user who initiated change
     * @param priceAtChange unit price snapshot at time of change (nullable)
     * @throws IllegalArgumentException if input validation fails
     */
    public void logStockChange(String itemId,
                               int change,
                               StockChangeReason reason,
                               String createdBy,
                               BigDecimal priceAtChange) {

        // Validate the enum value & basic constraints
        StockHistoryValidator.validateEnum(reason);

        // Enterprise Comment: DTO Construction for Validation
        // Price snapshot enables WAC calculations and PRICE_CHANGE tracking
        // Construct a DTO for validation (includes price snapshot when provided)
        StockHistoryDTO dto = StockHistoryDTO.builder()
                .itemId(itemId)
                .change(change)
                .reason(reason.name()) // If DTO already uses enum, set it directly instead of name()
                .createdBy(createdBy)
                .priceAtChange(priceAtChange)
                .build();

        // Business validation (e.g., zero allowed only for PRICE_CHANGE, etc.)
        StockHistoryValidator.validate(dto);

        // Enterprise Comment: Denormalization Pattern
        // Resolve supplier ID once and store on history record for analytics
        String supplierId = resolveSupplierId(itemId);

        // Enterprise Comment: Immutable Event Creation
        // Server-authoritative timestamp ensures consistency across distributed systems
        // Persist entity with server-authoritative timestamp
        StockHistory history = StockHistory.builder()
                .id("sh-" + itemId + "-" + System.currentTimeMillis())
                .itemId(itemId)
                .supplierId(supplierId)
                .change(change)
                .reason(reason)              // entity uses enum directly
                .createdBy(createdBy)
                .timestamp(LocalDateTime.now())
                .priceAtChange(priceAtChange)
                .build();

        repository.save(history);
    }
    
    /**
     * Persists validated stock history DTO with server timestamp.
     * @param dto validated stock history DTO
     * @throws IllegalArgumentException if validation fails
     */
    public void save(StockHistoryDTO dto) {
        // Validate DTO with domain rules
        StockHistoryValidator.validate(dto);

        String supplierId = resolveSupplierId(dto.getItemId());

        // Map & persist
        StockHistory history = StockHistory.builder()
                .id("sh-" + dto.getItemId() + "-" + System.currentTimeMillis())
                .itemId(dto.getItemId())
                .supplierId(supplierId)
                .change(dto.getChange())
                .reason(dto.getReason() != null
                        ? StockChangeReason.valueOf(dto.getReason())
                        : null)
                .createdBy(dto.getCreatedBy())
                .timestamp(LocalDateTime.now())
                .priceAtChange(dto.getPriceAtChange())
                .build();

        repository.save(history);
    }

    /**
     * Records item deletion in stock history (legacy convention: -1 quantity).
     * @param itemId inventory item ID
     * @param reason deletion reason
     * @param createdBy user who initiated deletion
     */
    public void delete(String itemId, StockChangeReason reason, String createdBy) {
        logStockChange(itemId, -1, reason, createdBy);
    }
}
