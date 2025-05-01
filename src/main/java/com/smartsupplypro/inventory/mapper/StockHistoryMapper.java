package com.smartsupplypro.inventory.mapper;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.model.StockHistory;

public class StockHistoryMapper {
    
    public static StockHistoryDTO toDTO(StockHistory history) {
        return StockHistoryDTO.builder()
                .id(history.getId())
                .itemId(history.getItemId())
                .change(history.getChange())
                .reason(history.getReason())
                .createdBy(history.getCreatedBy())
                .timestamp(history.getTimestamp())
                .build();
    }

    public static StockHistory toEntity(StockHistoryDTO dto) {
        return StockHistory.builder()
                .id(dto.getId())
                .itemId(dto.getItemId())
                .change(dto.getChange())
                .reason(dto.getReason())
                .createdBy(dto.getCreatedBy())
                .timestamp(dto.getTimestamp())
                .build();
    }
}
