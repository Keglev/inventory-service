package com.smartsupplypro.inventory.service;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.validation.InventoryItemSecurityValidator;
import com.smartsupplypro.inventory.validation.InventoryItemValidator;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service layer responsible for managing inventory item operations including
 * creation, update, deletion, and retrieval. Also coordinates stock history logging
 * and supplier validation.
 * <p>
 * This class centralizes business logic for inventory item management and ensures:
 * <ul>
 *   <li>Proper data validation and mapping between entity and DTO</li>
 *   <li>Supplier existence verification</li>
 *   <li>Automated stock change logging for all quantity-altering operations</li>
 *   <li>Enforcement of domain rules (e.g., deletion only allowed with specific reasons)</li>
 * </ul>
 * </p>
 *
 * @author
 * SmartSupplyPro Dev Team
 */
@Service
public class InventoryItemService {

    private final InventoryItemRepository repository;
    private final StockHistoryService stockHistoryService;
    private final SupplierRepository supplierRepository;

    /**
     * Constructs the InventoryItemService with required dependencies.
     *
     * @param repository           the inventory item repository
     * @param stockHistoryService the service for logging stock history
     * @param supplierRepository  the repository for supplier validation
     */
    public InventoryItemService(
        InventoryItemRepository repository,
        StockHistoryService stockHistoryService,
        SupplierRepository supplierRepository
    ) {
        this.repository = repository;
        this.stockHistoryService = stockHistoryService;
        this.supplierRepository = supplierRepository;
    }

    /**
     * Retrieves all inventory items in the system as DTOs.
     *
     * @return a list of all inventory item DTOs
     */
    public List<InventoryItemDTO> getAll() {
        return repository.findAll().stream()
                .map(InventoryItemMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a single inventory item by its unique identifier.
     *
     * @param id the item ID
     * @return an optional containing the found item DTO, or empty if not found
     */
    public Optional<InventoryItemDTO> getById(String id) {
        return repository.findById(id)
                .map(InventoryItemMapper::toDTO);
    }

    /**
     * Persists a new inventory item after validating input data and logging its initial stock level.
     *
     * @param dto the inventory item data transfer object
     * @return the saved inventory item DTO
     */
    public InventoryItemDTO save(InventoryItemDTO dto) {
        InventoryItemValidator.validateBase(dto);
        InventoryItemValidator.validateInventoryItemNotExists(dto.getName(), repository);
        validateSupplierExists(dto.getSupplierId());
    
        InventoryItem entity = InventoryItemMapper.toEntity(dto);

        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(LocalDateTime.now());
        }

        if (entity.getMinimumQuantity() <= 0) {
            entity.setMinimumQuantity(10); // default fallback value
        }

        InventoryItem saved = repository.save(entity);

        stockHistoryService.logStockChange(
            saved.getId(),
            saved.getQuantity(),
            StockChangeReason.INITIAL_STOCK,
            saved.getCreatedBy()
        );

        return InventoryItemMapper.toDTO(saved);
    }

    /**
     * Updates an existing inventory item by ID. Validates permissions, logs quantity changes,
     * and maps back to DTO after persistence.
     *
     * @param id  the item ID to update
     * @param dto the new inventory data
     * @return an optional containing the updated inventory item DTO
     */
    public Optional<InventoryItemDTO> update(String id, InventoryItemDTO dto) {
        InventoryItemValidator.validateBase(dto);
        validateSupplierExists(dto.getSupplierId());

        return repository.findById(id)
                .map(existing -> {
                    InventoryItemSecurityValidator.validateUpdatePermissions(existing, dto);

                    int quantityDiff = dto.getQuantity() - existing.getQuantity();
                    
                    existing.setName(dto.getName());
                    existing.setQuantity(dto.getQuantity());
                    existing.setPrice(dto.getPrice());
                    existing.setSupplierId(dto.getSupplierId());
                    existing.setCreatedBy(dto.getCreatedBy());

                    InventoryItem updated = repository.save(existing);

                    if (quantityDiff != 0) {
                        stockHistoryService.logStockChange(
                            updated.getId(),
                            quantityDiff,
                            StockChangeReason.MANUAL_UPDATE,
                            updated.getCreatedBy()
                        );
                    }

                    return InventoryItemMapper.toDTO(updated);
                });
    }

    /**
     * Validates that a given supplier exists by ID.
     *
     * @param supplierId the ID of the supplier to check
     * @throws IllegalArgumentException if the supplier does not exist
     */
    private void validateSupplierExists(String supplierId) {
        if (!supplierRepository.existsById(supplierId)) {
            throw new IllegalArgumentException("Supplier does not exist");
        }
    }

    /**
     * Deletes an inventory item with a mandatory stock change reason.
     * Also logs the full quantity reduction to stock history before deletion.
     *
     * @param id     the ID of the item to delete
     * @param reason the reason for deletion (must be valid)
     * @throws IllegalArgumentException if item not found or reason is invalid
     */
    public void delete(String id, StockChangeReason reason) {
        if (reason != StockChangeReason.SCRAPPED && 
            reason != StockChangeReason.DESTROYED &&
            reason != StockChangeReason.DAMAGED &&
            reason != StockChangeReason.EXPIRED &&
            reason != StockChangeReason.LOST &&
            reason != StockChangeReason.RETURNED_TO_SUPPLIER) {
            throw new IllegalArgumentException("Invalid reason for deletion");
        }

        Optional<InventoryItem> itemOpt = repository.findById(id);
        if (itemOpt.isPresent()) {
            InventoryItem item = itemOpt.get();
    
            stockHistoryService.logStockChange(
                item.getId(),
                -item.getQuantity(),
                reason,
                item.getCreatedBy()
            );
    
            repository.deleteById(id);
        } else {
            throw new IllegalArgumentException("Item not found");
        }
    }

    /**
     * Searches for inventory items by name using case-insensitive partial match.
     *
     * @param name the name or partial name of the item
     * @return a list of matching inventory item DTOs
     */
    public List<InventoryItemDTO> findByName(String name) {
        return repository.findByNameContainingIgnoreCase(name).stream()
                .map(InventoryItemMapper::toDTO)
                .collect(Collectors.toList());
    }
}
// This code provides the InventoryItemService class, which manages inventory items in the system.