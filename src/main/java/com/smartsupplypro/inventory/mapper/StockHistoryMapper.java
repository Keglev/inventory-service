package com.smartsupplypro.inventory.mapper;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.enums.StockChangeReason;

/**
 * Utility class for mapping between {@link StockHistory} entities
 * and {@link StockHistoryDTO} transfer objects.
 *
 * <p>Supports structured transformation of historical inventory change events
 * for both backend persistence and frontend reporting.
 *
 * <p>This mapper is commonly used in:
 * <ul>
 *   <li>REST API controllers for stock history</li>
 *   <li>Audit views and analytics exports</li>
 *   <li>Service-to-service communication (e.g., reporting services)</li>
 * </ul>
 */
public class StockHistoryMapper {

    /**
     * Converts a {@link StockHistory} entity into a {@link StockHistoryDTO}.
     *
     * @param history the entity to convert
     * @return a DTO containing readable audit data
     */
    public static StockHistoryDTO toDTO(StockHistory history) {
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
     * Converts a {@link StockHistoryDTO} into a {@link StockHistory} entity.
     *
     * <p>This is typically used during test data preparation or internal service interactions.
     *
     * @param dto the DTO to convert
     * @return entity ready for persistence or further processing
     */
    public static StockHistory toEntity(StockHistoryDTO dto) {
        return StockHistory.builder()
                .id(dto.getId())
                .itemId(dto.getItemId())
                .change(dto.getChange())
                .reason(dto.getReason() != null ? StockChangeReason.valueOf(dto.getReason()) : null)
                .createdBy(dto.getCreatedBy())
                .timestamp(dto.getTimestamp())
                .priceAtChange(dto.getPriceAtChange())
                .build();
    }
}
// This mapper is designed to be used in service layers where conversion between
// persistence entities and DTOs is required, especially in applications with complex
// business logic or multiple data sources. It ensures that the conversion logic is
// centralized, making it easier to maintain and test. The use of builders allows for
// fluent and readable code, while the explicit mapping of fields ensures that all
// necessary data is transferred correctly between layers. This approach also allows
// for easy extension in the future if additional fields or transformations are needed.