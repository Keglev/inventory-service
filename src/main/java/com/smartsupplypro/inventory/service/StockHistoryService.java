package com.smartsupplypro.inventory.service;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.StockHistoryMapper;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.validation.StockHistoryValidator;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for managing historical stock movements in the inventory system.
 * <p>
 * This class provides methods to:
 * <ul>
 *   <li>Retrieve all stock history entries</li>
 *   <li>Filter stock history by item ID, change reason, or time range</li>
 *   <li>Log validated stock changes with timestamp and user attribution</li>
 * </ul>
 * The service ensures clean separation between domain logic and persistence concerns,
 * while also applying domain-specific validation through {@link StockHistoryValidator}.
 * </p>
 *
 * @author
 * SmartSupplyPro Dev Team
 */
@Service
@RequiredArgsConstructor
public class StockHistoryService {

    /** JPA repository for stock history persistence operations */
    private final StockHistoryRepository repository;

    /**
     * Retrieves all stock history records in the system.
     *
     * @return list of all stock changes, mapped to DTOs
     */
    public List<StockHistoryDTO> getAll() {
        return repository.findAll().stream()
                .map(StockHistoryMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all stock history records associated with a given item ID.
     *
     * @param itemId the inventory item ID to filter by
     * @return list of stock changes for the specified item
     */
    public List<StockHistoryDTO> getByItemId(String itemId) {
        return repository.findAll().stream()
                .filter(h -> h.getItemId().equals(itemId))
                .map(StockHistoryMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all stock history records for a specific change reason.
     *
     * @param reason the {@link StockChangeReason} to filter by
     * @return list of stock changes matching the given reason
     */
    public List<StockHistoryDTO> getByReason(StockChangeReason reason) {
        return repository.findAll().stream()
                .filter(h -> reason.equals(h.getReason()))
                .map(StockHistoryMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves paginated stock history entries filtered by date range, item name, and supplier ID.
     *
     * @param startDate  filter start date and time (inclusive)
     * @param endDate    filter end date and time (inclusive)
     * @param itemName   optional item name for partial matching
     * @param supplierId optional supplier ID to narrow results
     * @param pageable   pagination and sorting configuration
     * @return page of matching stock history records
     */
    public Page<StockHistoryDTO> findFiltered(LocalDateTime startDate, LocalDateTime endDate, String itemName, String supplierId, Pageable pageable) {
        return repository.findFiltered(startDate, endDate, itemName, supplierId, pageable)
                .map(StockHistoryMapper::toDTO);
    }

    /**
     * Logs a new stock change with full validation and timestamping.
     * <p>
     * A unique ID is generated using the item ID and system timestamp to ensure uniqueness.
     * The reason is validated using {@link StockHistoryValidator}.
     * </p>
     *
     * @param itemId    the ID of the item whose stock changed
     * @param change    the quantity change (positive or negative)
     * @param reason    the {@link StockChangeReason} enum describing the reason
     * @param createdBy the user (email or ID) who initiated the change
     * @throws IllegalArgumentException if input is invalid
     */
    public void logStockChange(String itemId, int change, StockChangeReason reason, String createdBy) {
        // Validate the enum value to ensure consistency
        StockHistoryValidator.validateEnum(reason);

        // Construct a DTO for validation purposes
        StockHistoryDTO dto = StockHistoryDTO.builder()
                .itemId(itemId)
                .change(change)
                .reason(reason.name())
                .createdBy(createdBy)
                .build();

        // Validate fields for business logic constraints
        StockHistoryValidator.validate(dto);

        // Create and persist a new StockHistory entity
        StockHistory history = StockHistory.builder()
                .id("sh-" + itemId + "-" + System.currentTimeMillis())
                .itemId(itemId)
                .change(change)
                .reason(reason.name() != null ? StockChangeReason.valueOf(reason.name()) : null) 
                .createdBy(createdBy)
                .timestamp(LocalDateTime.now())
                .build();

        repository.save(history);
    }

    /**
    * Accepts a validated StockHistoryDTO and persists it as a StockHistory entity.
    *
    * @param dto the DTO to be saved
    */
    public void save(StockHistoryDTO dto) {
        // Validate fields for business logic constraints
        StockHistoryValidator.validate(dto);

        // Create and persist a new StockHistory entity
        StockHistory history = StockHistory.builder()
                .id("sh-" + dto.getItemId() + "-" + System.currentTimeMillis())
                .itemId(dto.getItemId())
                .change(dto.getChange())
                .reason(dto.getReason() != null ? StockChangeReason.valueOf(dto.getReason()) : null)
                .createdBy(dto.getCreatedBy())
                .timestamp(LocalDateTime.now())
                .build();

        repository.save(history);
    }

    /**
    * Records a stock deletion operation in the history.
    *
    * @param itemId    the ID of the deleted item
    * @param reason    the reason for deletion (must be SCRAPPED, DESTROYED, etc.)
    * @param createdBy the user who performed the deletion
    */
    public void delete(String itemId, StockChangeReason reason, String createdBy) {
        // Use logStockChange internally to maintain consistency
        logStockChange(itemId, -1, reason, createdBy); // convention: -1 indicates deletion
    }

}
// This code handles the stock history service, providing methods to log and retrieve stock changes.