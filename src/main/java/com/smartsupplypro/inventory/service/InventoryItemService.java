package com.smartsupplypro.inventory.service;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import org.springframework.stereotype.Service;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InventoryItemService {

    public InventoryItemService(
        InventoryItemRepository repository,
        StockHistoryRepository stockHistoryRepository
    ) {
        this.repository = repository;
        this.stockHistoryRepository = stockHistoryRepository;
    }

    private final StockHistoryRepository stockHistoryRepository;

    private final InventoryItemRepository repository;

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
        InventoryItem entity = InventoryItemMapper.toEntity(dto);

        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(java.time.LocalDateTime.now());
        }

        InventoryItem saved = repository.save(entity);
         // Add initial stock history entry
        StockHistory history = StockHistory.builder()
            .id("sh-" + saved.getId())
            .itemId(saved.getId())
            .change(saved.getQuantity())
            .reason("Initial stock")
            .createdBy(saved.getCreatedBy())
            .timestamp(LocalDateTime.now())
            .build();

        stockHistoryRepository.save(history);

        return InventoryItemMapper.toDTO(saved);
    }

    public Optional<InventoryItemDTO> update(String id, InventoryItemDTO dto) {
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
                        StockHistory history = StockHistory.builder()
                                .id("sh-" + updated.getId() + "-" + System.currentTimeMillis())
                                .itemId(updated.getId())
                                .change(quantityDiff)
                                .reason("Manual update")
                                .createdBy(updated.getCreatedBy())
                                .timestamp(LocalDateTime.now())
                                .build();
                        stockHistoryRepository.save(history);
                    }
                    return InventoryItemMapper.toDTO(updated);
                });
    }

    public void delete(String id) {
        repository.deleteById(id);
    }
}
