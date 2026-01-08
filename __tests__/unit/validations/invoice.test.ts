import { describe, it, expect } from 'vitest';
import { updateInvoiceSchema } from '@/lib/validations/invoice';

describe('Invoice Validation', () => {
  describe('updateInvoiceSchema', () => {
    it('should validate valid invoice update data', () => {
      const validData = {
        status: 'issued' as const,
        invoice_number: '2024-01',
        issued_on: '2024-01-15',
        due_date: '2024-02-15',
        currency: 'CHF',
        total: 1000.50,
      };

      const result = updateInvoiceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        status: 'invalid_status',
      };

      const result = updateInvoiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid currency code (must be 3 characters)', () => {
      const invalidData = {
        currency: 'CH',
      };

      const result = updateInvoiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative total', () => {
      const invalidData = {
        total: -100,
      };

      const result = updateInvoiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid VAT rate (must be 0-100)', () => {
      const invalidData = {
        vat_rate: 150,
      };

      const result = updateInvoiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept valid VAT rate', () => {
      const validData = {
        vat_rate: 7.7,
      };

      const result = updateInvoiceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const invalidData = {
        issued_on: '2024/01/15', // Wrong format
      };

      const result = updateInvoiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept null for nullable fields', () => {
      const validData = {
        paid_date: null,
        contact_id: null,
        project_id: null,
        bank_account_id: null,
        notes: null,
      };

      const result = updateInvoiceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject notes that are too long', () => {
      const invalidData = {
        notes: 'a'.repeat(5001), // Exceeds 5000 character limit
      };

      const result = updateInvoiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all valid status values', () => {
      const statuses = ['draft', 'issued', 'paid', 'overdue', 'cancelled'] as const;
      
      statuses.forEach(status => {
        const result = updateInvoiceSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });
  });
});

