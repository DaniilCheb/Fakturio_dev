import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatCurrency,
  formatSwissNumber,
  formatSwissCurrency,
} from '@/lib/utils/formatters';

describe('Formatters', () => {
  describe('formatNumber', () => {
    it('should format number to 2 decimal places', () => {
      expect(formatNumber(100)).toBe('100.00');
      expect(formatNumber(100.5)).toBe('100.50');
      expect(formatNumber(100.567)).toBe('100.57');
    });

    it('should handle string values', () => {
      expect(formatNumber('100')).toBe('100.00');
      expect(formatNumber('100.5')).toBe('100.50');
    });

    it('should handle undefined and null', () => {
      expect(formatNumber(undefined)).toBe('0.00');
      expect(formatNumber(null)).toBe('0.00');
      expect(formatNumber('')).toBe('0.00');
    });

    it('should handle invalid values', () => {
      expect(formatNumber('invalid')).toBe('0.00');
      expect(formatNumber(NaN)).toBe('0.00');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-100)).toBe('-100.00');
      expect(formatNumber(-100.5)).toBe('-100.50');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with default CHF', () => {
      expect(formatCurrency(100)).toBe('CHF 100.00');
    });

    it('should format currency with custom currency', () => {
      expect(formatCurrency(100, 'EUR')).toBe('EUR 100.00');
      expect(formatCurrency(100, 'USD')).toBe('USD 100.00');
    });

    it('should handle string values', () => {
      expect(formatCurrency('100.5', 'CHF')).toBe('CHF 100.50');
    });

    it('should handle undefined and null', () => {
      expect(formatCurrency(undefined)).toBe('CHF 0.00');
      expect(formatCurrency(null)).toBe('CHF 0.00');
    });
  });

  describe('formatSwissNumber', () => {
    it('should format number with Swiss formatting (space as thousand separator)', () => {
      expect(formatSwissNumber(1000)).toBe('1 000.00');
      expect(formatSwissNumber(1000000)).toBe('1 000 000.00');
      expect(formatSwissNumber(1234.56)).toBe('1 234.56');
    });

    it('should handle numbers less than 1000', () => {
      expect(formatSwissNumber(100)).toBe('100.00');
      expect(formatSwissNumber(99.99)).toBe('99.99');
    });

    it('should handle string values', () => {
      expect(formatSwissNumber('1000')).toBe('1 000.00');
    });

    it('should handle undefined and null', () => {
      expect(formatSwissNumber(undefined)).toBe('0.00');
      expect(formatSwissNumber(null)).toBe('0.00');
    });

    it('should handle negative numbers', () => {
      expect(formatSwissNumber(-1000)).toBe('-1 000.00');
    });
  });

  describe('formatSwissCurrency', () => {
    it('should format currency with Swiss formatting', () => {
      expect(formatSwissCurrency(1000)).toBe('CHF 1 000.00');
      expect(formatSwissCurrency(1000000)).toBe('CHF 1 000 000.00');
    });

    it('should format with custom currency', () => {
      expect(formatSwissCurrency(1000, 'EUR')).toBe('EUR 1 000.00');
    });

    it('should handle string values', () => {
      expect(formatSwissCurrency('1000', 'CHF')).toBe('CHF 1 000.00');
    });

    it('should handle undefined and null', () => {
      expect(formatSwissCurrency(undefined)).toBe('CHF 0.00');
      expect(formatSwissCurrency(null)).toBe('CHF 0.00');
    });
  });
});

