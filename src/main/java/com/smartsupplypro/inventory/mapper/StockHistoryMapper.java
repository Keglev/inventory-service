package com.smartsupplypro.inventory.mapper;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.enums.StockChangeReason;

/**
 * Enterprise entity-DTO mapping utility for stock history audit trails with enum transformation.
 * 
 * <p>Provides specialized transformation between {@link StockHistory} entities and 
 * {@link StockHistoryDTO} data transfer objects with audit-specific business logic
 * including enum conversions and temporal data preservation.</p>
 * 
 * <p><strong>Enterprise Audit Features:</strong></p>
 * <ul>
 *   <li><strong>Enum Transformation:</strong> Safe StockChangeReason enum to string conversion</li>
 *   <li><strong>Temporal Integrity:</strong> Preserves precise timestamp and audit trails</li>
 *   <li><strong>Audit Metadata:</strong> Maintains user tracking and change attribution</li>
 *   <li><strong>Historical Context:</strong> Supports price snapshots and quantity tracking</li>
 * </ul>
 * 
 * <p><strong>Enterprise Architecture:</strong> This mapper serves the auditing and compliance
 * subsystem, enabling historical data analysis, stock movement tracking, and regulatory
 * reporting while maintaining data lineage and change attribution.</p>
 */
public final class StockHistoryMapper {

    /**
     * Private constructor to prevent instantiation of utility class.
     * 
     * @throws UnsupportedOperationException if instantiation is attempted
     */
    private StockHistoryMapper() {
        throw new UnsupportedOperationException("Utility class - no instances allowed");
    }

    /**
     * Transforms a stock history entity to a data transfer object with audit information.
     *
     * <p><strong>Enterprise Audit Transformation:</strong></p>
     * <ul>
     *   <li><strong>Enum String Conversion:</strong> Converts StockChangeReason to readable format</li>
     *   <li><strong>Temporal Preservation:</strong> Maintains precise audit timestamps</li>
     *   <li><strong>Change Attribution:</strong> Preserves user and reason tracking</li>
     *   <li><strong>Historical Snapshot:</strong> Captures price and quantity at time of change</li>
     * </ul>
     *
     * <p><strong>Compliance Support:</strong> This transformation enables audit trail reporting,
     * regulatory compliance, and historical analysis by converting internal enum values to
     * human-readable strings for external systems and reports.</p>
     *
     * @param history the stock history entity from audit subsystem, must not be null
     * @return DTO optimized for audit reports and compliance documentation
     * @implNote Enum transformation ensures backward compatibility with external systems
     */
    public static StockHistoryDTO toDTO(StockHistory history) {
        if (history == null) {
            return null;
        }
        
        // Transform enum safely for external system compatibility
        String reasonString = transformEnumSafely(history.getReason());
        
        return StockHistoryDTO.builder()
                .id(history.getId())
                .itemId(history.getItemId())
                .change(history.getChange())
                .reason(reasonString)
                .createdBy(history.getCreatedBy())
                .timestamp(history.getTimestamp())
                .priceAtChange(history.getPriceAtChange())
                .build();
    }

    /**
     * Transforms a stock history DTO back to an entity for audit persistence operations.
     *
     * <p><strong>Audit Entity Reconstruction:</strong></p>
     * <ul>
     *   <li><strong>String to Enum Conversion:</strong> Safely converts reason strings to StockChangeReason</li>
     *   <li><strong>Audit Trail Persistence:</strong> Prepares entity for compliance storage</li>
     *   <li><strong>Test Data Support:</strong> Enables programmatic audit record creation</li>
     *   <li><strong>Temporal Accuracy:</strong> Preserves precise timestamps for regulatory compliance</li>
     * </ul>
     *
     * <p><strong>Enterprise Usage:</strong> Primarily used for test data preparation and internal
     * service interactions where audit records need to be reconstructed from DTO format. The
     * enum conversion includes validation to ensure data integrity in audit subsystems.</p>
     *
     * @param dto the audit DTO from external systems, must not be null
     * @return entity ready for audit persistence and compliance storage
     * @throws IllegalArgumentException if reason string cannot be converted to valid enum
     * @implNote Enum conversion uses valueOf() for strict validation of audit reasons
     */
    public static StockHistory toEntity(StockHistoryDTO dto) {
        if (dto == null) {
            return null;
        }
        
        // Convert enum string with validation and error handling
        StockChangeReason reason = parseEnumSafely(dto.getReason());
        
        return StockHistory.builder()
                .id(dto.getId())
                .itemId(dto.getItemId())
                .change(dto.getChange())
                .reason(reason)
                .createdBy(dto.getCreatedBy())
                .timestamp(dto.getTimestamp())
                .priceAtChange(dto.getPriceAtChange())
                .build();
    }
    
    /**
     * Transforms StockChangeReason enum to string safely for external system compatibility.
     *
     * <p><strong>External System Integration:</strong> Converts internal enum values to
     * stable string representations for API consumers and reporting systems.</p>
     *
     * @param reason the enum value (may be null)
     * @return string representation or null if enum is null
     */
    private static String transformEnumSafely(StockChangeReason reason) {
        return reason != null ? reason.name() : null;
    }
    
    /**
     * Parses string to StockChangeReason enum with validation for audit integrity.
     *
     * <p><strong>Validation Strategy:</strong> Uses strict enum validation to ensure only
     * valid audit reasons are persisted. Throws IllegalArgumentException for invalid values.</p>
     *
     * @param reasonString the string value (may be null)
     * @return enum value or null if string is null
     * @throws IllegalArgumentException if string cannot be converted to valid enum
     */
    private static StockChangeReason parseEnumSafely(String reasonString) {
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