/**
 * @file inventoryValidation.test.ts
 * @module __tests__/pages/inventory/inventoryValidation
 * 
 * @summary
 * Tests for inventory validation schemas using Zod.
 * Tests itemFormSchema, quantityAdjustSchema, priceChangeSchema,
 * editItemSchema, and deleteItemSchema.
 */

import { describe, it, expect } from 'vitest';
import {
  itemFormSchema,
  quantityAdjustSchema,
  priceChangeSchema,
  editItemSchema,
  deleteItemSchema,
} from '../../../../pages/inventory/validation/inventoryValidation';

describe('inventoryValidation', () => {
  describe('itemFormSchema', () => {
    it('should validate valid item form data', () => {
      const validData = {
        name: 'Test Item',
        code: 'TEST-001',
        supplierId: '123',
        quantity: 100,
        price: 49.99,
        reason: 'INITIAL_STOCK' as const,
      };

      const result = itemFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should validate with optional code field', () => {
      const dataWithoutCode = {
        name: 'Test Item',
        supplierId: '456',
        quantity: 50,
        price: 25.0,
        reason: 'MANUAL_UPDATE' as const,
      };

      const result = itemFormSchema.safeParse(dataWithoutCode);
      expect(result.success).toBe(true);
    });

    it('should validate with numeric supplierId', () => {
      const dataWithNumericSupplier = {
        name: 'Test Item',
        supplierId: 789,
        quantity: 10,
        price: 15.5,
        reason: 'INITIAL_STOCK' as const,
      };

      const result = itemFormSchema.safeParse(dataWithNumericSupplier);
      expect(result.success).toBe(true);
    });

    it('should reject empty item name', () => {
      const invalidData = {
        name: '',
        supplierId: '123',
        quantity: 100,
        price: 49.99,
        reason: 'INITIAL_STOCK',
      };

      const result = itemFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Item name is required');
      }
    });

    it('should reject empty supplierId', () => {
      const invalidData = {
        name: 'Test Item',
        supplierId: '',
        quantity: 100,
        price: 49.99,
        reason: 'INITIAL_STOCK',
      };

      const result = itemFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Supplier is required');
      }
    });

    it('should reject negative quantity', () => {
      const invalidData = {
        name: 'Test Item',
        supplierId: '123',
        quantity: -10,
        price: 49.99,
        reason: 'INITIAL_STOCK',
      };

      const result = itemFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Initial stock must be non-negative');
      }
    });

    it('should reject negative price', () => {
      const invalidData = {
        name: 'Test Item',
        supplierId: '123',
        quantity: 100,
        price: -5.99,
        reason: 'INITIAL_STOCK',
      };

      const result = itemFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Price must be non-negative');
      }
    });

    it('should reject invalid reason', () => {
      const invalidData = {
        name: 'Test Item',
        supplierId: '123',
        quantity: 100,
        price: 49.99,
        reason: 'INVALID_REASON',
      };

      const result = itemFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Reason is required');
      }
    });
  });

  describe('quantityAdjustSchema', () => {
    it('should validate valid quantity adjustment data', () => {
      const validData = {
        itemId: 'item-123',
        newQuantity: 50,
        reason: 'Stock replenishment',
      };

      const result = quantityAdjustSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should allow zero quantity', () => {
      const dataWithZero = {
        itemId: 'item-456',
        newQuantity: 0,
        reason: 'Sold out',
      };

      const result = quantityAdjustSchema.safeParse(dataWithZero);
      expect(result.success).toBe(true);
    });

    it('should reject empty itemId', () => {
      const invalidData = {
        itemId: '',
        newQuantity: 50,
        reason: 'Adjustment',
      };

      const result = quantityAdjustSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Item selection is required');
      }
    });

    it('should reject negative quantity', () => {
      const invalidData = {
        itemId: 'item-123',
        newQuantity: -10,
        reason: 'Adjustment',
      };

      const result = quantityAdjustSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Quantity cannot be negative');
      }
    });

    it('should reject empty reason', () => {
      const invalidData = {
        itemId: 'item-123',
        newQuantity: 50,
        reason: '',
      };

      const result = quantityAdjustSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Reason is required');
      }
    });
  });

  describe('priceChangeSchema', () => {
    it('should validate valid price change data', () => {
      const validData = {
        itemId: 'item-789',
        newPrice: 99.99,
      };

      const result = priceChangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject empty itemId', () => {
      const invalidData = {
        itemId: '',
        newPrice: 99.99,
      };

      const result = priceChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Item selection is required');
      }
    });

    it('should reject zero price', () => {
      const invalidData = {
        itemId: 'item-789',
        newPrice: 0,
      };

      const result = priceChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Price must be greater than 0');
      }
    });

    it('should reject negative price', () => {
      const invalidData = {
        itemId: 'item-789',
        newPrice: -15.50,
      };

      const result = priceChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Price must be greater than 0');
      }
    });
  });

  describe('editItemSchema', () => {
    it('should validate valid edit item data', () => {
      const validData = {
        itemId: 'item-111',
        newName: 'Updated Item Name',
      };

      const result = editItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject empty itemId', () => {
      const invalidData = {
        itemId: '',
        newName: 'Updated Name',
      };

      const result = editItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Item selection is required');
      }
    });

    it('should reject empty newName', () => {
      const invalidData = {
        itemId: 'item-111',
        newName: '',
      };

      const result = editItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Item name is required');
      }
    });
  });

  describe('deleteItemSchema', () => {
    it('should validate valid delete item data', () => {
      const validData = {
        itemId: 'item-222',
      };

      const result = deleteItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject empty itemId', () => {
      const invalidData = {
        itemId: '',
      };

      const result = deleteItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Item selection is required');
      }
    });
  });
});
