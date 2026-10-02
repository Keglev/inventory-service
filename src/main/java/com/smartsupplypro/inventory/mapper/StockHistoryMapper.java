package com.smartsupplypro.inventory.mapper;

import org.springframework.stereotype.Component;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.model.StockHistory;

/**
 * Maps {@link StockHistory} entities to their DTO representation. The write path builds
 * the entity in {@code StockHistoryServiceImpl}, so there is no reverse mapping.
 *
 * @see StockHistoryDTO
 */
@Component
public class StockHistoryMapper {

    /**
     * Converts a stock history entity to a DTO.
     *
     * <p>The {@code reason} enum is converted to its string name for external representation.</p>
     */
    public StockHistoryDTO toDTO(StockHistory history) {
        if (history == null) {
            return null;
        }
        return StockHistoryDTO.builder()
                .id(history.getId())
                .itemId(history.getItemId())
                .change(history.getChange())
                .reason(history.getReason() != null ? history.getReason().name() : null)
                .createdBy(history.getCreatedBy())
                .timestamp(history.getTimestamp())
                .priceAtChange(history.getPriceAtChange())
                .build();
    }
}
