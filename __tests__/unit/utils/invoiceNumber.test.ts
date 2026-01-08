import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateInvoiceId } from '@/lib/utils/invoiceNumber';

// Mock the guest invoice service
vi.mock('@/lib/services/guestInvoiceService', () => ({
  getAllGuestInvoices: vi.fn(() => []),
}));

describe('Invoice Number Utilities', () => {
  describe('generateInvoiceId', () => {
    it('should generate a unique invoice ID', () => {
      const id1 = generateInvoiceId();
      const id2 = generateInvoiceId();
      
      expect(id1).toMatch(/^inv_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^inv_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should start with inv_ prefix', () => {
      const id = generateInvoiceId();
      expect(id.startsWith('inv_')).toBe(true);
    });

    it('should include timestamp and random string', () => {
      const id = generateInvoiceId();
      const parts = id.split('_');
      expect(parts.length).toBeGreaterThanOrEqual(3);
      expect(parts[0]).toBe('inv');
      expect(parts[1]).toMatch(/^\d+$/); // timestamp
      expect(parts[2]).toMatch(/^[a-z0-9]+$/); // random string
    });
  });
});

