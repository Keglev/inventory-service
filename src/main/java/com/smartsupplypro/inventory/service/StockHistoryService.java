package com.smartsupplypro.inventory.service;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.StockHistoryMapper;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockHistoryService {
    private final StockHistoryRepository repository;

    public List<StockHistoryDTO> getAll() {
        return repository.findAll().stream()
                .map(StockHistoryMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<StockHistoryDTO> getByItemId(String itemId) {
        return repository.findAll().stream()
                .filter(h -> h.getItemId().equals(itemId))
                .map(StockHistoryMapper::toDTO)
                .collect(Collectors.toList());
    }

   public List<StockHistoryDTO> getByReason(StockChangeReason reason) {
    return repository.findAll().stream()
            .filter(h -> h.getReason().equals(reason.name()))
            .map(StockHistoryMapper::toDTO)
            .collect(Collectors.toList());
    }

    public Page<StockHistoryDTO> findFiltered(LocalDateTime startDate, LocalDateTime endDate, String itemName, String supplierId, Pageable pageable) {
        return repository.findFiltered(startDate, endDate, itemName, supplierId, pageable)
                .map(StockHistoryMapper::toDTO);
    }
}
