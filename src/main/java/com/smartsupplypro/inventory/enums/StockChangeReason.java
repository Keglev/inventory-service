package com.smartsupplypro.inventory.enums;

import java.util.EnumSet;
import java.util.Set;

/**
 * Standardized stock change reasons for inventory movement tracking.
 * 
 * <p>Provides enterprise-level categorization for audit compliance, financial reconciliation,
 * and operational analytics. Used across inventory management, reporting, and compliance systems.
 * 
 * <p>Key integrations: StockHistoryDTO, InventoryService, Analytics, Financial reporting.
 * 
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 1.0.0
 */
public enum StockChangeReason {

    /** Initial inventory entry during item creation. Critical for audit trail establishment. */
    INITIAL_STOCK,

    /** Administrative adjustment for inventory discrepancies. Requires manager approval. */
    MANUAL_UPDATE,

    /** Price adjustment without quantity impact. Financial reporting classification. */
    PRICE_CHANGE,

    /** Customer purchase transaction. Revenue recognition and COGS calculation trigger. */
    SOLD,

    /** Quality control removal for damaged/defective items. Loss prevention tracking. */
    SCRAPPED,

    /** Catastrophic loss requiring insurance claim documentation. Asset write-off trigger. */
    DESTROYED,

    /** Temporary quality hold pending repair/assessment. Operational impact tracking. */
    DAMAGED,

    /** Expiration date breach removal. Regulatory compliance and waste management. */
    EXPIRED,

    /** Inventory shrinkage for unaccounted losses. Security and process review trigger. */
    LOST,

    /** Vendor return for defective merchandise. Supplier performance tracking. */
    RETURNED_TO_SUPPLIER,

    /** Customer return processing. Customer satisfaction and refund management. */
    RETURNED_BY_CUSTOMER;

    // Enterprise utility methods for business logic optimization

    /**
     * Determines if this reason requires manager approval for processing.
     * 
     * @return true if manager approval is required
     */
    public boolean requiresManagerApproval() {
        return switch (this) {
            case MANUAL_UPDATE, DESTROYED, LOST -> true;
            default -> false;
        };
    }

    /**
     * Checks if this reason affects available inventory quantity.
     * 
     * @return true if quantity is affected
     */
    public boolean affectsQuantity() {
        return this != PRICE_CHANGE;
    }

    /**
     * Determines if this reason represents a financial loss.
     * 
     * @return true if it represents a loss
     */
    public boolean isLossReason() {
        return getLossReasons().contains(this);
    }

    /**
     * Checks if this reason requires regulatory compliance documentation.
     * 
     * @return true if compliance documentation is required
     */
    public boolean requiresComplianceDocumentation() {
        return switch (this) {
            case EXPIRED, DESTROYED, LOST -> true;
            default -> false;
        };
    }

    /**
     * Gets the audit severity level for this reason.
     * 
     * @return audit severity classification
     */
    public AuditSeverity getAuditSeverity() {
        return switch (this) {
            case DESTROYED, LOST -> AuditSeverity.CRITICAL;
            case INITIAL_STOCK, SOLD -> AuditSeverity.HIGH;
            case MANUAL_UPDATE, SCRAPPED, EXPIRED -> AuditSeverity.MEDIUM;
            default -> AuditSeverity.LOW;
        };
    }

    // Static utility methods for business operations

    /**
     * Returns all reasons that represent inventory losses.
     * 
     * @return immutable set of loss reasons
     */
    public static Set<StockChangeReason> getLossReasons() {
        return EnumSet.of(SCRAPPED, DESTROYED, EXPIRED, LOST);
    }

    /**
     * Returns all reasons that represent customer-related transactions.
     * 
     * @return immutable set of customer-related reasons
     */
    public static Set<StockChangeReason> getCustomerReasons() {
        return EnumSet.of(SOLD, RETURNED_BY_CUSTOMER);
    }

    /**
     * Returns all reasons that represent supplier-related transactions.
     * 
     * @return immutable set of supplier-related reasons
     */
    public static Set<StockChangeReason> getSupplierReasons() {
        return EnumSet.of(RETURNED_TO_SUPPLIER);
    }

    /**
     * Returns all reasons that require security investigation.
     * 
     * @return immutable set of security-sensitive reasons
     */
    public static Set<StockChangeReason> getSecuritySensitiveReasons() {
        return EnumSet.of(LOST, DESTROYED);
    }

    /**
     * Safely parses a string to StockChangeReason with detailed error handling.
     * 
     * @param reasonString the string to parse
     * @return the corresponding enum value
     * @throws IllegalArgumentException if the string is invalid
     */
    public static StockChangeReason parseReason(String reasonString) {
        if (reasonString == null || reasonString.trim().isEmpty()) {
            throw new IllegalArgumentException("Stock change reason cannot be null or empty");
        }
        
        try {
            return valueOf(reasonString.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                String.format("Invalid stock change reason '%s'. Valid options: %s", 
                    reasonString, java.util.Arrays.toString(values())), e);
        }
    }

    // Nested enum for audit severity classification
    public enum AuditSeverity {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}

