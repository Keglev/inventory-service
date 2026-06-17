package com.smartsupplypro.inventory.mapper;

import org.springframework.stereotype.Component;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;

/**
 * Maps between {@link StockHistory} entities and their DTO representations.
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

    /**
     * Converts a stock history DTO to an entity.
     *
     * <p>The {@code reason} string is parsed back to a {@link StockChangeReason} enum.
     * Throws {@link IllegalArgumentException} if the string does not match a valid enum constant.</p>
     */
    public StockHistory toEntity(StockHistoryDTO dto) {
        if (dto == null) {
            return null;
        }
        return StockHistory.builder()
                .id(dto.id())
                .itemId(dto.itemId())
                .change(dto.change())
                .reason(parseReason(dto.reason()))
                .createdBy(dto.createdBy())
                .timestamp(dto.timestamp())
                .priceAtChange(dto.priceAtChange())
                .build();
    }

    private StockChangeReason parseReason(String reasonString) {
        if (reasonString == null) {
            return null;
        }
        try {
            return StockChangeReason.valueOf(reasonString);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "Invalid stock change reason: " + reasonString +
                ". Valid values: " + java.util.Arrays.toString(StockChangeReason.values()), e);
        }
    }
}
