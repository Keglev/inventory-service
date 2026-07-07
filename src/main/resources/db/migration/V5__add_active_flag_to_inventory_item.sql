-- V5: Soft-delete support for inventory items (CB-APP93).
-- Items are never physically deleted; deletion marks them inactive so the
-- full stock history remains available for auditing and tax retention.
-- Existing rows are active by default.

ALTER TABLE inventory_item ADD (active NUMBER(1) DEFAULT 1 NOT NULL);

ALTER TABLE inventory_item ADD CONSTRAINT chk_inventory_item_active CHECK (active IN (0, 1));
