package com.smartsupplypro.inventory.service;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

/**
 * Interface defining contract for inventory item management operations.
 *
 * <p>This service exposes high-level business logic related to inventory,
 * including create, update, delete, and search operations. It separates
 * controller-level logic from persistence implementation, and supports
 * auditing and validation workflows.</p>
 *
 * @author
 * SmartSupplyPro Dev Team
 */
public interface InventoryItemService {

    /**
     * Retrieves all inventory items.
     *
     * @return list of all inventory items as DTOs
     */
    List<InventoryItemDTO> getAll();

    /**
     * Retrieves an inventory item by its unique ID.
     *
     * @param id the item ID
     * @return an optional containing the item DTO, or empty if not found
     */
    Optional<InventoryItemDTO> getById(String id);

    /**
     * Finds inventory items by name with pagination, sorted by ascending price.
     *
     * @param name the partial name to search
     * @param pageable pagination and sorting information
     * @return paged list of matching inventory items
     */
    Page<InventoryItemDTO> findByNameSortedByPrice(String name, Pageable pageable);

    /**
     * Saves a new inventory item.
     *
     * @param dto the item data
     * @return the saved inventory item DTO
     */
    InventoryItemDTO save(InventoryItemDTO dto);

    /**
     * Updates an existing inventory item.
     *
     * @param id the ID of the item to update
     * @param dto the updated item data
     * @return the updated item DTO if successful
     */
    Optional<InventoryItemDTO> update(String id, InventoryItemDTO dto);

    /**
     * Deletes an inventory item with a specified reason.
     *
     * @param id the ID of the item to delete
     * @param reason the stock change reason
     */
    void delete(String id, StockChangeReason reason);
}
