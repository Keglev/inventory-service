package com.smartsupplypro.inventory.service;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.StockHistoryMapper;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service

public class StockHistoryService {
    private final StockHistoryRepository repository;

    public StockHistoryService(StockHistoryRepository repository) {
        this.repository = repository;
    }

    public List<StockHistoryDTO> getAll() {
        return repository.findAll().stream()
                .map(StockHistoryMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<StockHistoryDTO> getByItemId(String itemId) {
        return repository.findByItemId(itemId).stream()
                .map(StockHistoryMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<StockHistoryDTO> getByReason(StockChangeReason reason) {
        return repository.findByReason(reason).stream()
                .map(StockHistoryMapper::toDTO)
                .collect(Collectors.toList());
    }
}
