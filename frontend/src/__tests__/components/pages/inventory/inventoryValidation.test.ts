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
        'a manual update reason',
        {
          name: 'Test Item',
          code: 'TEST-002',
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
          code: 'TEST-003',
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
          code: 'TEST-INV',
          supplierId: '123',
          quantity: 100,
          price: 49.99,
          reason: 'INITIAL_STOCK',
        },
        'errors:validation.required',
      ],
      [
        'empty supplierId',
        {
          name: 'Test Item',
          code: 'TEST-INV',
          supplierId: '',
          quantity: 100,
          price: 49.99,
          reason: 'INITIAL_STOCK',
        },
        'errors:validation.required',
      ],
      [
        'negative quantity',
        {
          name: 'Test Item',
          code: 'TEST-INV',
          supplierId: '123',
          quantity: -10,
          price: 49.99,
          reason: 'INITIAL_STOCK',
        },
        'errors:validation.nonNegative',
      ],
      [
        'negative price',
        {
          name: 'Test Item',
          code: 'TEST-INV',
          supplierId: '123',
          quantity: 100,
          price: -5.99,
          reason: 'INITIAL_STOCK',
        },
        'errors:validation.nonNegative',
      ],
      [
        'invalid reason',
        {
          name: 'Test Item',
          code: 'TEST-INV',
          supplierId: '123',
          quantity: 100,
          price: 49.99,
          reason: 'INVALID_REASON',
        },
        'errors:validation.required',
      ],
      [
        'empty code',
        {
          name: 'Test Item',
          code: '',
          supplierId: '123',
          quantity: 100,
          price: 49.99,
          reason: 'INITIAL_STOCK',
        },
        'errors:validation.required',
      ],
    ])('should reject %s', (_, data, message) => {
      expectInvalidMessage(itemFormSchema, data, message);
    });
  });

  describe('quantityAdjustSchema', () => {
    it('accepts an increase with an increase-valid reason', () => {
      expectValid(quantityAdjustSchema, {
        itemId: 'item-123',
        currentQuantity: 10,
        newQuantity: 15,
        reason: 'INITIAL_STOCK',
      });
    });

    it('accepts a reduction with a disposal reason', () => {
      expectValid(quantityAdjustSchema, {
        itemId: 'item-123',
        currentQuantity: 20,
        newQuantity: 5,
        reason: 'DESTROYED',
      });
    });

    it('accepts MANUAL_UPDATE in either direction', () => {
      expectValid(quantityAdjustSchema, {
        itemId: 'item-123',
        currentQuantity: 5,
        newQuantity: 12,
        reason: 'MANUAL_UPDATE',
      });
      expectValid(quantityAdjustSchema, {
        itemId: 'item-123',
        currentQuantity: 12,
        newQuantity: 5,
        reason: 'MANUAL_UPDATE',
      });
    });

    it.each([
      [
        'empty itemId',
        { itemId: '', currentQuantity: 10, newQuantity: 15, reason: 'INITIAL_STOCK' },
        'errors:validation.required',
      ],
      [
        'negative quantity',
        { itemId: 'item-123', currentQuantity: 10, newQuantity: -10, reason: 'SOLD' },
        'errors:validation.nonNegative',
      ],
      [
        'unknown reason',
        { itemId: 'item-123', currentQuantity: 10, newQuantity: 15, reason: 'DONATED' },
        'errors:validation.required',
      ],
      [
        'zero-delta change',
        { itemId: 'item-123', currentQuantity: 10, newQuantity: 10, reason: 'MANUAL_UPDATE' },
        'errors:validation.quantityUnchanged',
      ],
      [
        'increase with a reduce-only reason',
        { itemId: 'item-123', currentQuantity: 5, newQuantity: 12, reason: 'SOLD' },
        'errors:validation.reasonInvalidForIncrease',
      ],
      [
        'reduction with an increase-only reason',
        { itemId: 'item-123', currentQuantity: 12, newQuantity: 5, reason: 'RETURNED_BY_CUSTOMER' },
        'errors:validation.reasonInvalidForDecrease',
      ],
    ])('rejects %s', (_, data, message) => {
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
        'errors:validation.required',
      ],
      [
        'zero price',
        { itemId: 'item-789', newPrice: 0 },
        'errors:validation.positive',
      ],
      [
        'negative price',
        { itemId: 'item-789', newPrice: -15.5 },
        'errors:validation.positive',
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
        'errors:validation.required',
      ],
      ['empty newName', { itemId: 'item-111', newName: '' }, 'errors:validation.required'],
    ])('should reject %s', (_, data, message) => {
      expectInvalidMessage(editItemSchema, data, message);
    });
  });

  describe('deleteItemSchema', () => {
    it('should validate valid delete item data', () => {
      expectValid(deleteItemSchema, { itemId: 'item-222' });
    });

    it('should reject empty itemId', () => {
      expectInvalidMessage(deleteItemSchema, { itemId: '' }, 'errors:validation.required');
    });
  });
});
