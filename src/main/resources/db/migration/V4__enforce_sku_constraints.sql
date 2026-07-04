-- ============================================================================
-- V4__enforce_sku_constraints.sql
-- ----------------------------------------------------------------------------
-- Purpose : Enforce SKU integrity after V3 populated every row.
--           Kept separate from V2 because Oracle rejects adding a NOT NULL
--           column to a non-empty table; the add / populate / constrain
--           sequence must be three ordered steps.
-- Rollback: Not automated. Reverse manually with
--           ALTER TABLE INVENTORY_ITEM DROP CONSTRAINT UK_INVENTORY_ITEM_SKU;
--           ALTER TABLE INVENTORY_ITEM MODIFY SKU NULL;
-- WARNING : Never edit this file after it has been applied to any environment.
--           Flyway validates file checksums; historic files are immutable.
-- ============================================================================

ALTER TABLE INVENTORY_ITEM MODIFY SKU NOT NULL;

ALTER TABLE INVENTORY_ITEM ADD CONSTRAINT UK_INVENTORY_ITEM_SKU UNIQUE (SKU);
