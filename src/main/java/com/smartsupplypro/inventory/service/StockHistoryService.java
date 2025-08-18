package com.smartsupplypro.inventory.service;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.StockHistoryMapper;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.validation.StockHistoryValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for managing historical stock movements in the inventory system.
 *
 * <h2>Denormalization Policy</h2>
 * <p>When persisting a history record, this service resolves and stores the
 * supplier identifier on the {@code StockHistory} row. This denormalization
 * enables efficient supplier-centric analytics (index: SUPPLIER_ID, CREATED_AT)
 * without requiring joins at query time.</p>
 *
 * <h2>Time Column Mapping</h2>
 * <p>The domain field {@code timestamp} is persisted to the database column
 * {@code CREATED_AT} to avoid reserved keyword conflicts across databases.</p>
 */
@Service
@RequiredArgsConstructor
public class StockHistoryService {

    /** JPA repository for stock history persistence operations. */
    private final StockHistoryRepository repository;
    private final InventoryItemRepository itemRepository;

    /**
    * Look up the supplier that owns the given item and return its ID.
    * <p>Returns {@code null} if the item is missing or supplier is not set. The
    * history row remains valid; supplier-based indexes simply won’t include it.</p>
    *
    * <p><b>Performance:</b> For high-throughput write paths, consider a repository
    * projection returning only (id, supplierId) or passing supplierId directly from
    * the caller if it is already known at the call site.</p>
    */
    private String resolveSupplierId(String itemId) {
        return itemRepository.findById(itemId)
                .map(item -> item.getSupplierId())
                .orElse(null); // keep null-safe; index still works for present values
    }

    /**
     * @return all stock history entries as DTOs.
     */
    public List<StockHistoryDTO> getAll() {
        return repository.findAll().stream()
                .map(StockHistoryMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all stock history records associated with a given item ID.
     * Uses ordered finder (newest first) if available.
     */
    public List<StockHistoryDTO> getByItemId(String itemId) {
        // Prefer ordered repo method (added in our repository suggestions)
        var list = repository.findByItemIdOrderByTimestampDesc(itemId);
        return list.stream().map(StockHistoryMapper::toDTO).toList();
    }

    /**
     * Retrieves all stock history records for a specific change reason.
     * Uses ordered finder (newest first) if available.
     */
    public List<StockHistoryDTO> getByReason(StockChangeReason reason) {
        var list = repository.findByReasonOrderByTimestampDesc(reason);
        return list.stream().map(StockHistoryMapper::toDTO).toList();
    }

    /**
     * Paginated stock history entries filtered by date range, item name, and supplier ID.
     * Bounds are inclusive. Sorting is applied in the native query (timestamp DESC).
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
     * Logs a new stock change with full validation and timestamping (no price snapshot).
     * <p>Keeps backwards compatibility for existing callers.</p>
     *
     * @throws IllegalArgumentException if input is invalid
     */
    public void logStockChange(String itemId, int change, StockChangeReason reason, String createdBy) {
        // Delegate to the price-aware overload with a null snapshot
        logStockChange(itemId, change, reason, createdBy, null);
    }

    /**
     * Logs a new stock change with full validation, timestamping, and an optional price snapshot.
     *
     * <p>Use this overload to capture {@code priceAtChange} for analytics, e.g.:
     * <ul>
     *   <li>PRICE_CHANGE events (quantity change == 0)</li>
     *   <li>Any quantity movement where the current unit price should be recorded</li>
     * </ul>
     * </p>
     *
     * @param itemId        the ID of the item whose stock changed
     * @param change        the quantity change (positive or negative)
     * @param reason        the business reason (enum)
     * @param createdBy     the user (email or ID) who initiated the change
     * @param priceAtChange unit price snapshot at the time of change (nullable)
     * @throws IllegalArgumentException if input is invalid (validator will raise)
     */
    public void logStockChange(String itemId,
                               int change,
                               StockChangeReason reason,
                               String createdBy,
                               BigDecimal priceAtChange) {

        // Validate the enum value & basic constraints
        StockHistoryValidator.validateEnum(reason);

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

        String supplierId = resolveSupplierId(itemId);

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
     * Accepts a validated DTO and persists it as a {@link StockHistory} entity.
     * Captures server time and passes through the given price snapshot if present.
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
     * Records a stock deletion operation in the history.
     * <p>Convention: quantity {@code -1} indicates deletion. Retained for backward compatibility.
     * Prefer logging the full negative remaining quantity at call-site when deleting an item.</p>
     */
    public void delete(String itemId, StockChangeReason reason, String createdBy) {
        logStockChange(itemId, -1, reason, createdBy);
    }
}
