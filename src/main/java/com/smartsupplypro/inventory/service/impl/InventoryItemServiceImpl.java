package com.smartsupplypro.inventory.service.impl;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.validation.InventoryItemValidator;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class InventoryItemServiceImpl implements com.smartsupplypro.inventory.service.InventoryItemService {

    private final InventoryItemRepository inventoryRepo;
    private final StockHistoryRepository stockHistoryRepo;

    @Override
    public List<InventoryItemDTO> getAll() {
        return inventoryRepo.findAll().stream()
                .map(InventoryItemDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<InventoryItemDTO> getById(String id) {
        return inventoryRepo.findById(id).map(InventoryItemDTO::fromEntity);
    }

    @Override
    @Transactional
    public InventoryItemDTO save(InventoryItemDTO dto) {
        InventoryItemValidator.validateBase(dto);
        InventoryItemValidator.validateInventoryItemNotExists(dto.getName(), dto.getPrice(), inventoryRepo);

        InventoryItem item = InventoryItem.fromDTO(dto);
        InventoryItem saved = inventoryRepo.save(item);

        recordStockChange(saved, dto.getQuantity(), StockChangeReason.CREATED, dto.getCreatedBy());

        return InventoryItemDTO.fromEntity(saved);
    }

    @Override
    @Transactional
    public Optional<InventoryItemDTO> update(String id, InventoryItemDTO dto) {
        Optional<InventoryItem> existingOpt = inventoryRepo.findById(id);
        if (existingOpt.isEmpty()) return Optional.empty();

        InventoryItem existing = existingOpt.get();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && dto.getPrice() != null &&
            existing.getPrice().compareTo(dto.getPrice()) != 0) {
            throw new IllegalArgumentException("Only ADMIN can change price.");
        }

        // Update fields
        existing.setName(dto.getName());
        existing.setQuantity(dto.getQuantity());
        existing.setMinimumQuantity(dto.getMinimumQuantity());
        if (isAdmin) {
            existing.setPrice(dto.getPrice());
        }

        InventoryItem updated = inventoryRepo.save(existing);

        int quantityChange = dto.getQuantity() - existing.getQuantity();
        if (quantityChange != 0) {
            recordStockChange(existing, quantityChange, StockChangeReason.UPDATED, dto.getCreatedBy());
        }

        return Optional.of(InventoryItemDTO.fromEntity(updated));
    }

    @Override
    @Transactional
    public void delete(String id, StockChangeReason reason) {
        Optional<InventoryItem> itemOpt = inventoryRepo.findById(id);
        itemOpt.ifPresent(item -> {
            recordStockChange(item, -item.getQuantity(), reason, "SYSTEM_DELETE");
            inventoryRepo.deleteById(id);
        });
    }

    @Override
    public List<InventoryItemDTO> findByName(String name) {
        return inventoryRepo.findByNameContainingIgnoreCaseOrderByPriceAsc(name).stream()
                .map(InventoryItemDTO::fromEntity)
                .collect(Collectors.toList());
    }

    private void recordStockChange(InventoryItem item, int change, StockChangeReason reason, String createdBy) {
        if (change == 0) return;

        StockHistory history = new StockHistory();
        history.setItem(item);
        history.setChange(change);
        history.setReason(reason);
        history.setCreatedBy(createdBy);
        history.setTimestamp(LocalDateTime.now());
        history.setPriceAtChange(item.getPrice());

        stockHistoryRepo.save(history);
    }
}

