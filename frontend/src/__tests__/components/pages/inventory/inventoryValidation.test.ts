/**
 * @file inventoryValidation.test.ts
 * @module __tests__/components/pages/inventory/inventoryValidation
 * @description Contract tests for inventory validation schemas (Zod):
 * - itemFormSchema
 * - quantityAdjustSchema
 * - priceChangeSchema
 * - editItemSchema
 * - deleteItemSchema
 *
 * Out of scope:
 * - UI component behavior (covered in component tests).
 * - Deep Zod internals (we validate our schema constraints/messages only).
 */

import { describe, it } from 'vitest';
import {
  itemFormSchema,
  quantityAdjustSchema,
  priceChangeSchema,
  editItemSchema,
  deleteItemSchema,
} from '../../../../pages/inventory/validation/inventoryValidation';
import { expectInvalidMessage, expectValid } from './validationTestUtils';

describe('inventoryValidation', () => {
  describe('itemFormSchema', () => {
    const validData = {
      name: 'Test Item',
      code: 'TEST-001',
      supplierId: '123',
      quantity: 100,
      price: 49.99,
      reason: 'INITIAL_STOCK' as const,
    };

    it('should validate valid item form data', () => {
      expectValid(itemFormSchema, validData);
    });

    it.each([
      [
        'optional code field',
        {
          name: 'Test Item',
          supplierId: '456',
          quantity: 50,
          price: 25.0,
          reason: 'MANUAL_UPDATE' as const,
        },
      ],
      [
        'numeric supplierId',
        {
          name: 'Test Item',
          supplierId: 789,
          quantity: 10,
          price: 15.5,
          reason: 'INITIAL_STOCK' as const,
        },
      ],
    ])('should validate with %s', (_, data) => {
      const result = itemFormSchema.safeParse(data);
      expectValid(itemFormSchema, data, result.success ? result.data : undefined);
    });

    it.each([
      [
        'empty item name',
        {
          name: '',
          supplierId: '123',
          quantity: 100,
          price: 49.99,
          reason: 'INITIAL_STOCK',
        },
        'Item name is required',
      ],
      [
        'empty supplierId',
        {
          name: 'Test Item',
          supplierId: '',
          quantity: 100,
          price: 49.99,
          reason: 'INITIAL_STOCK',
        },
        'Supplier is required',
      ],
      [
        'negative quantity',
        {
          name: 'Test Item',
          supplierId: '123',
          quantity: -10,
          price: 49.99,
          reason: 'INITIAL_STOCK',
        },
        'Initial stock must be non-negative',
      ],
      [
        'negative price',
        {
          name: 'Test Item',
          supplierId: '123',
          quantity: 100,
          price: -5.99,
          reason: 'INITIAL_STOCK',
        },
        'Price must be non-negative',
      ],
      [
        'invalid reason',
        {
          name: 'Test Item',
          supplierId: '123',
          quantity: 100,
          price: 49.99,
          reason: 'INVALID_REASON',
        },
        'Reason is required',
      ],
    ])('should reject %s', (_, data, message) => {
      expectInvalidMessage(itemFormSchema, data, message);
    });
  });

  describe('quantityAdjustSchema', () => {
    it('should validate valid quantity adjustment data', () => {
      expectValid(quantityAdjustSchema, {
        itemId: 'item-123',
        newQuantity: 50,
        reason: 'Stock replenishment',
      });
    });

    it('should allow zero quantity', () => {
      const data = {
        itemId: 'item-456',
        newQuantity: 0,
        reason: 'Sold out',
      };

      const result = quantityAdjustSchema.safeParse(data);
      expectValid(quantityAdjustSchema, data, result.success ? result.data : undefined);
    });

    it.each([
      [
        'empty itemId',
        { itemId: '', newQuantity: 50, reason: 'Adjustment' },
        'Item selection is required',
      ],
      [
        'negative quantity',
        { itemId: 'item-123', newQuantity: -10, reason: 'Adjustment' },
        'Quantity cannot be negative',
      ],
      [
        'empty reason',
        { itemId: 'item-123', newQuantity: 50, reason: '' },
        'Reason is required',
      ],
    ])('should reject %s', (_, data, message) => {
      expectInvalidMessage(quantityAdjustSchema, data, message);
    });
  });

  describe('priceChangeSchema', () => {
    it('should validate valid price change data', () => {
      const validData = {
        itemId: 'item-789',
        newPrice: 99.99,
      };

      expectValid(priceChangeSchema, validData);
    });

    it.each([
      [
        'empty itemId',
        { itemId: '', newPrice: 99.99 },
        'Item selection is required',
      ],
      [
        'zero price',
        { itemId: 'item-789', newPrice: 0 },
        'Price must be greater than 0',
      ],
      [
        'negative price',
        { itemId: 'item-789', newPrice: -15.5 },
        'Price must be greater than 0',
      ],
    ])('should reject %s', (_, data, message) => {
      expectInvalidMessage(priceChangeSchema, data, message);
    });
  });

  describe('editItemSchema', () => {
    it('should validate valid edit item data', () => {
      expectValid(editItemSchema, { itemId: 'item-111', newName: 'Updated Item Name' });
    });

    it.each([
      [
        'empty itemId',
        { itemId: '', newName: 'Updated Name' },
        'Item selection is required',
      ],
      ['empty newName', { itemId: 'item-111', newName: '' }, 'Item name is required'],
    ])('should reject %s', (_, data, message) => {
      expectInvalidMessage(editItemSchema, data, message);
    });
  });

  describe('deleteItemSchema', () => {
    it('should validate valid delete item data', () => {
      expectValid(deleteItemSchema, { itemId: 'item-222' });
    });

    it('should reject empty itemId', () => {
      expectInvalidMessage(deleteItemSchema, { itemId: '' }, 'Item selection is required');
    });
  });
});
