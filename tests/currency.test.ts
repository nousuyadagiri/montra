import {
  toMinorUnits,
  fromMinorUnits,
  formatCurrency,
  formatMinorUnits,
  parseCurrencyInput,
} from '../src/utils/currency';

describe('Currency and Minor Units Arithmetic', () => {
  describe('toMinorUnits & fromMinorUnits', () => {
    it('accurately converts major currency decimals to integer paise/cents', () => {
      expect(toMinorUnits(150.5)).toBe(15050);
      expect(toMinorUnits(10.0)).toBe(1000);
      expect(toMinorUnits(0.99)).toBe(99);
      expect(toMinorUnits(0)).toBe(0);
    });

    it('handles floating-point edge cases safely without rounding artifacts', () => {
      // 0.1 + 0.2 in JS is 0.30000000000000004
      const sum = 0.1 + 0.2;
      expect(toMinorUnits(sum)).toBe(30);
      expect(fromMinorUnits(toMinorUnits(sum))).toBe(0.3);
    });

    it('correctly converts minor units back to major decimals', () => {
      expect(fromMinorUnits(15050)).toBe(150.5);
      expect(fromMinorUnits(99)).toBe(0.99);
      expect(fromMinorUnits(0)).toBe(0);
    });

    it('handles negative amounts safely', () => {
      expect(toMinorUnits(-45.5)).toBe(-4550);
      expect(fromMinorUnits(-4550)).toBe(-45.5);
    });
  });

  describe('formatCurrency', () => {
    it('formats INR with rupee symbol and Indian grouping format', () => {
      const formatted = formatCurrency(150000, 'INR', true);
      expect(formatted).toContain('₹');
      expect(formatted).toContain('1,50,000');
    });

    it('formats USD with dollar symbol', () => {
      const formatted = formatCurrency(2500.5, 'USD', true);
      expect(formatted).toContain('$');
      expect(formatted).toContain('2,500.50');
    });

    it('formats EUR and GBP correctly', () => {
      expect(formatCurrency(100, 'EUR', false)).toContain('€');
      expect(formatCurrency(100, 'GBP', false)).toContain('£');
    });

    it('formats negative balances correctly', () => {
      const formatted = formatCurrency(-500, 'INR', true);
      expect(formatted.startsWith('-₹') || formatted.includes('-')).toBe(true);
    });
  });

  describe('parseCurrencyInput', () => {
    it('parses standard numbers', () => {
      expect(parseCurrencyInput('1500')).toBe(1500);
      expect(parseCurrencyInput('1500.75')).toBe(1500.75);
    });

    it('strips commas, currency symbols, and whitespace', () => {
      expect(parseCurrencyInput('₹ 1,50,000.50')).toBe(150000.5);
      expect(parseCurrencyInput('$1,234.56')).toBe(1234.56);
    });

    it('returns 0 for empty or invalid inputs', () => {
      expect(parseCurrencyInput('')).toBe(0);
      expect(parseCurrencyInput('abc')).toBe(0);
    });
  });
});

