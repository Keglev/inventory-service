package com.smartsupplypro.inventory.exception;

import java.lang.reflect.Field;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link DuplicateResourceException}.
 *
 * <h2>Scope</h2>
 * Validates the exception's enrichment logic used by API error handlers:
 * <ul>
 *   <li>"Simple" constructor behavior (no detailed context)</li>
 *   <li>"Detailed" constructor behavior (resource type + conflict field + duplicate value)</li>
 *   <li>Branching in {@link DuplicateResourceException#getClientMessage()} for:
 *       <ul>
 *         <li>detailed-context formatting</li>
 *         <li>message passthrough</li>
 *         <li>null-message fallback</li>
 *       </ul>
 *   </li>
 *   <li>Conditional shaping of {@link DuplicateResourceException#getErrorDetails()}</li>
 *   <li>Static factory helpers for common duplicates</li>
 * </ul>
 *
 * <h2>Why this matters</h2>
 * This exception is part of the public error contract. If details are missing or formatted incorrectly,
 * client applications may misclassify conflicts or fail to highlight the duplicated field/value.
 */
class DuplicateResourceExceptionTest {

    @Test
    @DisplayName("Simple constructor: no detailed context and client message passthrough")
    void simpleConstructor_noDetailedContext() {
        DuplicateResourceException ex = new DuplicateResourceException("Supplier already exists");

        assertNull(ex.getResourceType());
        assertNull(ex.getConflictField());
        assertNull(ex.getDuplicateValue());
        assertFalse(ex.hasDetailedContext());

        assertEquals("Supplier already exists", ex.getClientMessage());

        Map<String, Object> details = ex.getErrorDetails();
        assertEquals("DUPLICATE_RESOURCE", details.get("errorType"));
        assertEquals("Supplier already exists", details.get("message"));

        assertFalse(details.containsKey("resourceType"));
        assertFalse(details.containsKey("conflictField"));
        assertFalse(details.containsKey("duplicateValue"));
    }

    @Test
    @DisplayName("Detailed constructor: exposes context, formats client message, and adds structured details")
    void detailedConstructor_formatsClientMessage_andAddsDetails() {
        DuplicateResourceException ex = new DuplicateResourceException(
            "constraint violation",
            "Supplier",
            "name",
            "Acme GmbH"
        );

        assertTrue(ex.hasDetailedContext());
        assertEquals("Supplier", ex.getResourceType());
        assertEquals("name", ex.getConflictField());
        assertEquals("Acme GmbH", ex.getDuplicateValue());

        assertEquals("Supplier with name 'Acme GmbH' already exists", ex.getClientMessage());

        Map<String, Object> details = ex.getErrorDetails();
        assertEquals("DUPLICATE_RESOURCE", details.get("errorType"));
        assertEquals("Supplier", details.get("resourceType"));
        assertEquals("name", details.get("conflictField"));
        assertEquals("Acme GmbH", details.get("duplicateValue"));
        assertEquals("Supplier with name 'Acme GmbH' already exists", details.get("message"));
    }

    @Test
    @DisplayName("Client message: null message falls back to a stable default")
    void clientMessage_nullMessageFallsBack() {
        // Anonymous subclass allows us to simulate getMessage() == null without changing production code.
        DuplicateResourceException ex = new DuplicateResourceException("ignored") {
            @Override
            public String getMessage() {
                return null;
            }
        };

        assertFalse(ex.hasDetailedContext());
        assertEquals("Resource already exists", ex.getClientMessage());

        Map<String, Object> details = ex.getErrorDetails();
        assertEquals("Resource already exists", details.get("message"));
    }

    @Test
    @DisplayName("Factory helpers: supplierName / inventoryItemSku / inventoryItemName")
    void factoryHelpers_createDetailedExceptions() {
        DuplicateResourceException supplier = DuplicateResourceException.supplierName("Acme GmbH");
        assertTrue(supplier.hasDetailedContext());
        assertEquals("Supplier", supplier.getResourceType());
        assertEquals("name", supplier.getConflictField());
        assertEquals("Acme GmbH", supplier.getDuplicateValue());
        assertEquals("Supplier with name 'Acme GmbH' already exists", supplier.getClientMessage());

        DuplicateResourceException sku = DuplicateResourceException.inventoryItemSku("SKU-123");
        assertTrue(sku.hasDetailedContext());
        assertEquals("InventoryItem", sku.getResourceType());
        assertEquals("sku", sku.getConflictField());
        assertEquals("SKU-123", sku.getDuplicateValue());
        assertEquals("InventoryItem with sku 'SKU-123' already exists", sku.getClientMessage());

        DuplicateResourceException name = DuplicateResourceException.inventoryItemName("Monitor");
        assertTrue(name.hasDetailedContext());
        assertEquals("InventoryItem", name.getResourceType());
        assertEquals("name", name.getConflictField());
        assertEquals("Monitor", name.getDuplicateValue());
        assertEquals("InventoryItem with name 'Monitor' already exists", name.getClientMessage());
    }

    @Test
    @DisplayName("hasDetailedContext: short-circuit branches for partial context (reflection-assisted)")
    void hasDetailedContext_shortCircuitBranches_partialContext() throws Exception {
        // Constructors either set all context fields or none.
        // This test creates partial context states to fully exercise the && short-circuit branches.
        DuplicateResourceException ex = new DuplicateResourceException("Message");

        Field resourceType = DuplicateResourceException.class.getDeclaredField("resourceType");
        Field conflictField = DuplicateResourceException.class.getDeclaredField("conflictField");
        Field duplicateValue = DuplicateResourceException.class.getDeclaredField("duplicateValue");
        resourceType.setAccessible(true);
        conflictField.setAccessible(true);
        duplicateValue.setAccessible(true);

        // Case 1: resourceType != null, conflictField == null, duplicateValue == null
        resourceType.set(ex, "Supplier");
        conflictField.set(ex, null);
        duplicateValue.set(ex, null);
        assertFalse(ex.hasDetailedContext());

        // Case 2: resourceType != null, conflictField != null, duplicateValue == null
        conflictField.set(ex, "name");
        duplicateValue.set(ex, null);
        assertFalse(ex.hasDetailedContext());
    }
}
