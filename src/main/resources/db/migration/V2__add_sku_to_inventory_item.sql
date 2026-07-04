-- ============================================================================
-- V2__add_sku_to_inventory_item.sql
-- ----------------------------------------------------------------------------
-- Purpose : Introduce the SKU (Stock Keeping Unit) column on INVENTORY_ITEM.
-- Strategy: The column is added NULLABLE first. Oracle cannot add a NOT NULL
--           column to a non-empty table without a default. Data is provided
--           by V3 (full demo reseed); the NOT NULL + UNIQUE constraints are
--           enforced afterwards in V4.
-- Rollback: Not automated. Reverse manually with
--           ALTER TABLE INVENTORY_ITEM DROP COLUMN SKU;
-- WARNING : Never edit this file after it has been applied to any environment.
--           Flyway validates file checksums; historic files are immutable.
-- ============================================================================

ALTER TABLE INVENTORY_ITEM ADD SKU VARCHAR2(32);

COMMENT ON COLUMN INVENTORY_ITEM.SKU IS
  'Stock Keeping Unit - unique, human-readable item code (category prefix + type code). Required for all items since schema V4.';
