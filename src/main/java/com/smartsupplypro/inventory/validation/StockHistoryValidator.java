package com.smartsupplypro.inventory.validation;

import java.util.EnumSet;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;

/**
 * Utility class responsible for validating {@link StockHistoryDTO} instances and
 * {@link StockChangeReason} enums before persisting stock change records.
 *
 * <p>This validator enforces strict business rules to ensure data integrity for all stock history changes,
 * such as:</p>
 * <ul>
 *     <li>Non-null and valid item IDs</li>
 *     <li>Non-zero stock changes</li>
 *     <li>Valid reason codes mapped to the {@code StockChangeReason} enum</li>
 *     <li>Mandatory audit fields such as {@code createdBy}</li>
 * </ul>
 *
 * <p><strong>Design:</strong> Implements the utility class pattern using a private constructor
 * and static methods only. Intended for use in service layer logic (e.g., {@code StockHistoryService}).</p>
 *
 * @author
 * SmartSupplyPro Dev Team
 */
public class StockHistoryValidator {

    /**
     * Private constructor to enforce utility class semantics.
     */
    private StockHistoryValidator() {}

    /**
     * Validates the contents of a {@link StockHistoryDTO} before it is persisted.
     * <p>Ensures the following:</p>
     * <ul>
     *     <li>{@code itemId} is not null or empty</li>
     *     <li>{@code change} value is not zero</li>
     *     <li>{@code reason} is not null and is a valid enum constant</li>
     *     <li>{@code createdBy} is provided</li>
     * </ul>
     *
     * @param dto the data transfer object representing the stock change
     * @throws IllegalArgumentException if any validation rule fails
     */
    public static void validate(StockHistoryDTO dto) {
        if (dto.getItemId() == null || dto.getItemId().trim().isEmpty()) {
            throw new IllegalArgumentException("Item ID cannot be null or empty");
        }
        if (dto.getChange() == 0) {
            throw new IllegalArgumentException("Change amount must be non-zero");
        }
        if (dto.getReason() == null || dto.getReason().trim().isEmpty()) {
            throw new IllegalArgumentException("Change reason is required");
        }
        try {
            StockChangeReason.valueOf(dto.getReason());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unsupported change reason: " + dto.getReason());
        }
        if (dto.getCreatedBy() == null || dto.getCreatedBy().trim().isEmpty()) {
            throw new IllegalArgumentException("CreatedBy is required");
        }
    }

    /**
     * Validates that the given {@link StockChangeReason} enum is part of the allowed set.
     * <p>Helps avoid saving or logging stock changes with unsupported reason codes.</p>
     *
     * @param reason the reason enum to validate
     * @throws IllegalArgumentException if the reason is null or not within the allowed set
     */
    public static void validateEnum(StockChangeReason reason) {
        if (reason == null || !EnumSet.of(
                StockChangeReason.SOLD,
                StockChangeReason.SCRAPPED,
                StockChangeReason.RETURNED_TO_SUPPLIER,
                StockChangeReason.RETURNED_BY_CUSTOMER,
                StockChangeReason.INITIAL_STOCK,
                StockChangeReason.MANUAL_UPDATE
        ).contains(reason)) {
            throw new IllegalArgumentException("Invalid stock change reason: " + reason);
        }
    }
}
// This code provides the StockHistoryValidator class, which enforces validation rules for stock history data.