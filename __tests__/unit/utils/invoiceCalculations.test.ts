import { describe, it, expect } from 'vitest';
import {
  calculateItemTotal,
  calculateItemVAT,
  calculateItemTotalWithVAT,
  calculateSubtotal,
  calculateTotalVAT,
  calculateDiscountAmount,
  calculateGrandTotal,
} from '@/lib/utils/invoiceCalculations';
import type { InvoiceItem } from '@/lib/types/invoice';

describe('Invoice Calculations', () => {
  describe('calculateItemTotal', () => {
    it('should calculate item total correctly', () => {
      const item: InvoiceItem = {
        id: '1',
        quantity: 2,
        um: 1,
        description: 'Test item',
        pricePerUm: 50,
        vat: 7.7,
      };
      expect(calculateItemTotal(item)).toBe(100);
    });

    it('should handle string values', () => {
      const item: InvoiceItem = {
        id: '1',
        quantity: '3',
        um: 1,
        description: 'Test item',
        pricePerUm: '25.50',
        vat: 7.7,
      };
      expect(calculateItemTotal(item)).toBe(76.5);
    });

    it('should handle zero quantity', () => {
      const item: InvoiceItem = {
        id: '1',
        quantity: 0,
        um: 1,
        description: 'Test item',
        pricePerUm: 50,
        vat: 7.7,
      };
      expect(calculateItemTotal(item)).toBe(0);
    });

    it('should handle invalid values', () => {
      const item: InvoiceItem = {
        id: '1',
        quantity: 'invalid',
        um: 1,
        description: 'Test item',
        pricePerUm: 'invalid',
        vat: 7.7,
      };
      expect(calculateItemTotal(item)).toBe(0);
    });
  });

  describe('calculateItemVAT', () => {
    it('should calculate VAT correctly', () => {
      const item: InvoiceItem = {
        id: '1',
        quantity: 2,
        um: 1,
        description: 'Test item',
        pricePerUm: 50,
        vat: 7.7,
      };
      expect(calculateItemVAT(item)).toBe(7.7);
    });

    it('should handle zero VAT rate', () => {
      const item: InvoiceItem = {
        id: '1',
        quantity: 2,
        um: 1,
        description: 'Test item',
        pricePerUm: 50,
        vat: 0,
      };
      expect(calculateItemVAT(item)).toBe(0);
    });

    it('should handle string VAT rate', () => {
      const item: InvoiceItem = {
        id: '1',
        quantity: 1,
        um: 1,
        description: 'Test item',
        pricePerUm: 100,
        vat: '8.1',
      };
      expect(calculateItemVAT(item)).toBe(8.1);
    });
  });

  describe('calculateItemTotalWithVAT', () => {
    it('should calculate total with VAT correctly', () => {
      const item: InvoiceItem = {
        id: '1',
        quantity: 2,
        um: 1,
        description: 'Test item',
        pricePerUm: 50,
        vat: 7.7,
      };
      expect(calculateItemTotalWithVAT(item)).toBe(107.7);
    });
  });

  describe('calculateSubtotal', () => {
    it('should calculate subtotal from multiple items', () => {
      const items: InvoiceItem[] = [
        {
          id: '1',
          quantity: 2,
          um: 1,
          description: 'Item 1',
          pricePerUm: 50,
          vat: 7.7,
        },
        {
          id: '2',
          quantity: 1,
          um: 1,
          description: 'Item 2',
          pricePerUm: 100,
          vat: 7.7,
        },
      ];
      expect(calculateSubtotal(items)).toBe(200);
    });

    it('should handle empty array', () => {
      expect(calculateSubtotal([])).toBe(0);
    });
  });

  describe('calculateTotalVAT', () => {
    it('should calculate total VAT from multiple items', () => {
      const items: InvoiceItem[] = [
        {
          id: '1',
          quantity: 2,
          um: 1,
          description: 'Item 1',
          pricePerUm: 50,
          vat: 7.7,
        },
        {
          id: '2',
          quantity: 1,
          um: 1,
          description: 'Item 2',
          pricePerUm: 100,
          vat: 7.7,
        },
      ];
      expect(calculateTotalVAT(items)).toBe(15.4);
    });

    it('should handle different VAT rates', () => {
      const items: InvoiceItem[] = [
        {
          id: '1',
          quantity: 1,
          um: 1,
          description: 'Item 1',
          pricePerUm: 100,
          vat: 7.7,
        },
        {
          id: '2',
          quantity: 1,
          um: 1,
          description: 'Item 2',
          pricePerUm: 100,
          vat: 8.1,
        },
      ];
      expect(calculateTotalVAT(items)).toBe(15.8);
    });
  });

  describe('calculateDiscountAmount', () => {
    it('should calculate discount amount correctly', () => {
      expect(calculateDiscountAmount(100, 10)).toBe(10);
    });

    it('should handle string discount percentage', () => {
      expect(calculateDiscountAmount(100, '15')).toBe(15);
    });

    it('should handle zero discount', () => {
      expect(calculateDiscountAmount(100, 0)).toBe(0);
    });

    it('should handle 100% discount', () => {
      expect(calculateDiscountAmount(100, 100)).toBe(100);
    });
  });

  describe('calculateGrandTotal', () => {
    it('should calculate grand total correctly without discount', () => {
      const items: InvoiceItem[] = [
        {
          id: '1',
          quantity: 2,
          um: 1,
          description: 'Item 1',
          pricePerUm: 50,
          vat: 7.7,
        },
      ];
      const result = calculateGrandTotal(items, 0);
      expect(result.subtotal).toBe(100);
      expect(result.discountAmount).toBe(0);
      expect(result.subtotalAfterDiscount).toBe(100);
      expect(result.total).toBe(107.7);
    });

    it('should calculate grand total with discount', () => {
      const items: InvoiceItem[] = [
        {
          id: '1',
          quantity: 2,
          um: 1,
          description: 'Item 1',
          pricePerUm: 50,
          vat: 7.7,
        },
      ];
      const result = calculateGrandTotal(items, 10);
      expect(result.subtotal).toBe(100);
      expect(result.discountAmount).toBe(10);
      expect(result.subtotalAfterDiscount).toBe(90);
      expect(result.vatAmount).toBeCloseTo(6.93, 2);
      expect(result.total).toBeCloseTo(96.93, 2);
    });

    it('should handle multiple items with different VAT rates', () => {
      const items: InvoiceItem[] = [
        {
          id: '1',
          quantity: 1,
          um: 1,
          description: 'Item 1',
          pricePerUm: 100,
          vat: 7.7,
        },
        {
          id: '2',
          quantity: 1,
          um: 1,
          description: 'Item 2',
          pricePerUm: 100,
          vat: 8.1,
        },
      ];
      const result = calculateGrandTotal(items, 0);
      expect(result.subtotal).toBe(200);
      expect(result.total).toBe(215.8);
      expect(result.vatBreakdown).toHaveProperty('7.7');
      expect(result.vatBreakdown).toHaveProperty('8.1');
    });

    it('should handle empty items array', () => {
      const result = calculateGrandTotal([], 0);
      expect(result.subtotal).toBe(0);
      expect(result.discountAmount).toBe(0);
      expect(result.total).toBe(0);
    });
  });
});

