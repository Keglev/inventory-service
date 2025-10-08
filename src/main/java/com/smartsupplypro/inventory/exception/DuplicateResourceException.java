package com.smartsupplypro.inventory.exception;

/**
 * Enterprise exception for resource uniqueness constraint violations.
 * 
 * <p>Indicates business rule enforcement for unique resources including suppliers,
 * inventory items, and operational entities requiring distinct identification.
 * 
 * <p>Key integrations: Entity validation, API error handling, Business rule enforcement.
 * 
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 1.0.0
 * @see GlobalExceptionHandler
 */
public class DuplicateResourceException extends RuntimeException {

    private final String resourceType;
    private final String duplicateValue;
    private final String conflictField;

    /**
     * Creates duplicate resource exception with descriptive message.
     * 
     * @param message specific constraint violation details
     */
    public DuplicateResourceException(String message) {
        super(message);
        this.resourceType = null;
        this.duplicateValue = null;
        this.conflictField = null;
    }

    /**
     * Creates duplicate resource exception with detailed context for enhanced error handling.
     * 
     * @param message specific constraint violation details
     * @param resourceType type of resource causing conflict (e.g., "Supplier", "InventoryItem")
     * @param conflictField field name causing the duplicate (e.g., "name", "sku")
     * @param duplicateValue the conflicting value
     */
    public DuplicateResourceException(String message, String resourceType, String conflictField, String duplicateValue) {
        super(message);
        this.resourceType = resourceType;
        this.conflictField = conflictField;
        this.duplicateValue = duplicateValue;
    }

    // Enterprise utility methods for enhanced error handling

    /**
     * Gets the type of resource involved in the conflict.
     * 
     * @return resource type name or null if not specified
     */
    public String getResourceType() {
        return resourceType;
    }

    /**
     * Gets the field name that caused the duplicate constraint violation.
     * 
     * @return field name or null if not specified
     */
    public String getConflictField() {
        return conflictField;
    }

    /**
     * Gets the duplicate value that caused the constraint violation.
     * 
     * @return duplicate value or null if not specified
     */
    public String getDuplicateValue() {
        return duplicateValue;
    }

    /**
     * Checks if this exception has detailed context information.
     * 
     * @return true if resource type, field, and value are available
     */
    public boolean hasDetailedContext() {
        return resourceType != null && conflictField != null && duplicateValue != null;
    }

    /**
     * Creates a user-friendly error message for API responses.
     * 
     * @return formatted error message suitable for client display
     */
    public String getClientMessage() {
        if (hasDetailedContext()) {
            return String.format("%s with %s '%s' already exists", 
                resourceType, conflictField, duplicateValue);
        }
        return getMessage() != null ? getMessage() : "Resource already exists";
    }

    /**
     * Creates structured error details for API responses.
     * 
     * @return map of error details for client consumption
     */
    public java.util.Map<String, Object> getErrorDetails() {
        java.util.Map<String, Object> details = new java.util.HashMap<>();
        details.put("errorType", "DUPLICATE_RESOURCE");
        
        if (hasDetailedContext()) {
            details.put("resourceType", resourceType);
            details.put("conflictField", conflictField);
            details.put("duplicateValue", duplicateValue);
        }
        
        details.put("message", getClientMessage());
        return details;
    }

    // Static factory methods for common scenarios

    /**
     * Creates exception for supplier name conflicts.
     * 
     * @param supplierName the duplicate supplier name
     * @return configured exception instance
     */
    public static DuplicateResourceException supplierName(String supplierName) {
        return new DuplicateResourceException(
            "Supplier name already exists: " + supplierName,
            "Supplier",
            "name",
            supplierName
        );
    }

    /**
     * Creates exception for inventory item SKU conflicts.
     * 
     * @param sku the duplicate SKU value
     * @return configured exception instance
     */
    public static DuplicateResourceException inventoryItemSku(String sku) {
        return new DuplicateResourceException(
            "Inventory item SKU already exists: " + sku,
            "InventoryItem",
            "sku",
            sku
        );
    }

    /**
     * Creates exception for inventory item name conflicts.
     * 
     * @param itemName the duplicate item name
     * @return configured exception instance
     */
    public static DuplicateResourceException inventoryItemName(String itemName) {
        return new DuplicateResourceException(
            "Inventory item name already exists: " + itemName,
            "InventoryItem",
            "name",
            itemName
        );
    }
}


