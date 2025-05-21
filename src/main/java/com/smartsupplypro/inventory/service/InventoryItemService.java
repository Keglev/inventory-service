package com.smartsupplypro.inventory.service;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.validation.InventoryItemValidator;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InventoryItemService {

    private final InventoryItemRepository repository;
    private final StockHistoryService stockHistoryService;
    private final SupplierRepository supplierRepository;

    public InventoryItemService(
        InventoryItemRepository repository,
        StockHistoryService stockHistoryService,
        SupplierRepository supplierRepository
    ) {
        this.repository = repository;
        this.stockHistoryService = stockHistoryService;
        this.supplierRepository = supplierRepository;
    }

    public List<InventoryItemDTO> getAll() {
        return repository.findAll().stream()
                .map(InventoryItemMapper::toDTO)
                .collect(Collectors.toList());
    }

    public Optional<InventoryItemDTO> getById(String id) {
        return repository.findById(id)
                .map(InventoryItemMapper::toDTO);
    }

    public InventoryItemDTO save(InventoryItemDTO dto) {
        InventoryItemValidator.validateBase(dto);
        InventoryItemValidator.validateInventoryItemNotExists(dto.getName(), repository);
        validateSupplierExists(dto.getSupplierId());
    
        InventoryItem entity = InventoryItemMapper.toEntity(dto);

        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(LocalDateTime.now());
        }

        if (entity.getMinimumQuantity() <= 0) {
            entity.setMinimumQuantity(10); // default fallback
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

    public Optional<InventoryItemDTO> update(String id, InventoryItemDTO dto) {
        InventoryItemValidator.validateBase(dto);
        validateSupplierExists(dto.getSupplierId());

        return repository.findById(id)
                .map(existing -> {
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

    private void validateSupplierExists(String supplierId) {
        if (!supplierRepository.existsById(supplierId)) {
            throw new IllegalArgumentException("Supplier does not exist");
        }
    }

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
    
            // Log deletion to stock history before deletion
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

    public List<InventoryItemDTO> findByName(String name) {
        return repository.findByNameContainingIgnoreCase(name).stream()
                .map(InventoryItemMapper::toDTO)
                .collect(Collectors.toList());
    }
}
