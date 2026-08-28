-- e2e seed for the Playwright suite (ADR-0009, frontend). H2 Oracle mode.
-- Runs after Hibernate create-drop via spring.sql.init in the e2e profile.
-- Deliberately small: enough rows for a non-empty inventory grid, one
-- low-stock item, and several stock-change reasons so every dashboard chart
-- has data. Not a copy of the Oracle demo seed; keep it independent.
-- Timestamps are fixed so assertions never depend on the run date.

INSERT INTO users_app (ID, EMAIL, NAME, ROLE, CREATED_AT) VALUES
  ('e2e-user-0001', 'e2e-admin@example.test', 'E2E Admin', 'ADMIN', TIMESTAMP '2026-01-05 08:00:00');

INSERT INTO SUPPLIER (ID, NAME, CONTACT_NAME, PHONE, EMAIL, CREATED_BY, CREATED_AT) VALUES
  ('e2e-sup-0001', 'Nordlicht Werkzeuge GmbH', 'Anna Berg', '+49 40 1234567', 'anna.berg@example.test', 'e2e-admin@example.test', TIMESTAMP '2026-01-05 08:10:00'),
  ('e2e-sup-0002', 'Rheinland Verpackung KG',  'Peter Kaul', '+49 221 7654321', 'p.kaul@example.test',    'e2e-admin@example.test', TIMESTAMP '2026-01-05 08:15:00');

INSERT INTO INVENTORY_ITEM (ID, NAME, SKU, QUANTITY, PRICE, SUPPLIER_ID, CREATED_BY, MINIMUM_QUANTITY, CREATED_AT, ACTIVE) VALUES
  ('e2e-item-0001', 'Hammer 300 g',          'E2E-HAM-300', 40, 12.50, 'e2e-sup-0001', 'e2e-admin@example.test', 10, TIMESTAMP '2026-01-06 09:00:00', 1),
  ('e2e-item-0002', 'Schraubendreher Set',   'E2E-SDR-SET', 25, 19.90, 'e2e-sup-0001', 'e2e-admin@example.test', 10, TIMESTAMP '2026-01-06 09:05:00', 1),
  ('e2e-item-0003', 'Wasserwaage 60 cm',     'E2E-WWG-060',  3, 24.00, 'e2e-sup-0001', 'e2e-admin@example.test',  5, TIMESTAMP '2026-01-06 09:10:00', 1),
  ('e2e-item-0004', 'Kartons 40x30x30',      'E2E-KRT-403', 200, 0.85, 'e2e-sup-0002', 'e2e-admin@example.test', 50, TIMESTAMP '2026-01-06 09:15:00', 1),
  ('e2e-item-0005', 'Klebeband 50 m',        'E2E-KLB-050', 60,  2.40, 'e2e-sup-0002', 'e2e-admin@example.test', 20, TIMESTAMP '2026-01-06 09:20:00', 1);

INSERT INTO STOCK_HISTORY (ID, ITEM_ID, SUPPLIER_ID, QUANTITY_CHANGE, REASON, CREATED_BY, CREATED_AT, PRICE_AT_CHANGE) VALUES
  ('e2e-sh-0001', 'e2e-item-0001', 'e2e-sup-0001',  50, 'INITIAL_STOCK',        'e2e-admin@example.test', TIMESTAMP '2026-01-06 09:00:00', 12.50),
  ('e2e-sh-0002', 'e2e-item-0002', 'e2e-sup-0001',  30, 'INITIAL_STOCK',        'e2e-admin@example.test', TIMESTAMP '2026-01-06 09:05:00', 19.90),
  ('e2e-sh-0003', 'e2e-item-0003', 'e2e-sup-0001',  10, 'INITIAL_STOCK',        'e2e-admin@example.test', TIMESTAMP '2026-01-06 09:10:00', 24.00),
  ('e2e-sh-0004', 'e2e-item-0004', 'e2e-sup-0002', 250, 'INITIAL_STOCK',        'e2e-admin@example.test', TIMESTAMP '2026-01-06 09:15:00',  0.85),
  ('e2e-sh-0005', 'e2e-item-0005', 'e2e-sup-0002',  60, 'INITIAL_STOCK',        'e2e-admin@example.test', TIMESTAMP '2026-01-06 09:20:00',  2.40),
  ('e2e-sh-0006', 'e2e-item-0001', 'e2e-sup-0001', -10, 'SOLD',                 'e2e-admin@example.test', TIMESTAMP '2026-01-12 10:00:00', 12.50),
  ('e2e-sh-0007', 'e2e-item-0002', 'e2e-sup-0001',  -5, 'SOLD',                 'e2e-admin@example.test', TIMESTAMP '2026-01-13 10:00:00', 19.90),
  ('e2e-sh-0008', 'e2e-item-0003', 'e2e-sup-0001',  -6, 'SOLD',                 'e2e-admin@example.test', TIMESTAMP '2026-01-14 10:00:00', 24.00),
  ('e2e-sh-0009', 'e2e-item-0003', 'e2e-sup-0001',  -1, 'DAMAGED',              'e2e-admin@example.test', TIMESTAMP '2026-01-15 10:00:00', 24.00),
  ('e2e-sh-0010', 'e2e-item-0004', 'e2e-sup-0002', -50, 'SOLD',                 'e2e-admin@example.test', TIMESTAMP '2026-01-16 10:00:00',  0.85),
  ('e2e-sh-0011', 'e2e-item-0002', 'e2e-sup-0001',   0, 'PRICE_CHANGE',         'e2e-admin@example.test', TIMESTAMP '2026-01-20 10:00:00', 19.90),
  ('e2e-sh-0012', 'e2e-item-0005', 'e2e-sup-0002',  -4, 'RETURNED_TO_SUPPLIER', 'e2e-admin@example.test', TIMESTAMP '2026-01-22 10:00:00',  2.40);
