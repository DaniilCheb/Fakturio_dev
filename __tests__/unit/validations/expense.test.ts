import { describe, it, expect } from 'vitest';
import { updateExpenseSchema } from '@/lib/validations/expense';

describe('Expense Validation', () => {
  describe('updateExpenseSchema', () => {
    it('should validate valid expense update data', () => {
      const validData = {
        name: 'Office Supplies',
        description: 'Monthly office supplies',
        category: 'Office' as const,
        type: 'one-time' as const,
        amount: 150.50,
        currency: 'CHF',
        date: '2024-01-15',
      };

      const result = updateExpenseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid category', () => {
      const invalidData = {
        category: 'InvalidCategory',
      };

      const result = updateExpenseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all valid categories', () => {
      const categories = ['Office', 'Travel', 'Software', 'Equipment', 'Marketing', 'Professional Services', 'Other'] as const;
      
      categories.forEach(category => {
        const result = updateExpenseSchema.safeParse({ category });
        expect(result.success).toBe(true);
      });
    });

    it('should accept all valid expense types', () => {
      const types = ['one-time', 'recurring', 'asset'] as const;
      
      types.forEach(type => {
        const result = updateExpenseSchema.safeParse({ type });
        expect(result.success).toBe(true);
      });
    });

    it('should reject negative amount', () => {
      const invalidData = {
        amount: -100,
      };

      const result = updateExpenseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid currency code', () => {
      const invalidData = {
        currency: 'CH',
      };

      const result = updateExpenseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid VAT rate', () => {
      const invalidData = {
        vat_rate: 150,
      };

      const result = updateExpenseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept valid VAT rate', () => {
      const validData = {
        vat_rate: 7.7,
      };

      const result = updateExpenseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject name that is too long', () => {
      const invalidData = {
        name: 'a'.repeat(201), // Exceeds 200 character limit
      };

      const result = updateExpenseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject description that is too long', () => {
      const invalidData = {
        description: 'a'.repeat(2001), // Exceeds 2000 character limit
      };

      const result = updateExpenseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept null for nullable fields', () => {
      const validData = {
        description: null,
        vat_amount: null,
        vat_rate: null,
        end_date: null,
        frequency: null,
        depreciation_years: null,
        receipt_url: null,
        project_id: null,
        contact_id: null,
      };

      const result = updateExpenseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept all valid frequency values', () => {
      const frequencies = ['Weekly', 'Monthly', 'Quarterly', 'Yearly', 'Other'] as const;
      
      frequencies.forEach(frequency => {
        const result = updateExpenseSchema.safeParse({ frequency });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid depreciation years', () => {
      const invalidData = {
        depreciation_years: 101, // Exceeds max of 100
      };

      const result = updateExpenseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid receipt URL', () => {
      const invalidData = {
        receipt_url: 'not-a-url',
      };

      const result = updateExpenseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

