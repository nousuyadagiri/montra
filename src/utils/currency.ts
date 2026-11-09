/**
 * Currency utilities for MONTRA
 * Enforces integer minor units (e.g. paise / cents) to prevent floating-point arithmetic errors.
 * 1 unit of major currency = 100 minor units.
 */

export type SupportedCurrency = 'INR' | 'USD' | 'EUR' | 'GBP';

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

/**
 * Converts a decimal amount (e.g. 150.50) into minor units (paise/cents = 15050).
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Converts minor units (paise/cents = 15050) back to major currency float (150.50).
 */
export function fromMinorUnits(minorUnits: number): number {
  return minorUnits / 100;
}

/**
 * Formats a major currency amount into a locale-aware currency string.
 * Supports INR (₹) Indian numbering system (e.g. ₹1,50,000.00) and other major currencies.
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency = 'INR',
  includeDecimals: boolean = true
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '₹';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formattedNumber: string;

  try {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    formattedNumber = new Intl.NumberFormat(locale, {
      minimumFractionDigits: includeDecimals ? 2 : 0,
      maximumFractionDigits: includeDecimals ? 2 : 0,
    }).format(absAmount);
  } catch {
    formattedNumber = absAmount.toFixed(includeDecimals ? 2 : 0);
  }

  const result = `${symbol}${formattedNumber}`;
  return isNegative ? `-${result}` : result;
}

/**
 * Formats minor units (e.g. integer paise) directly to a formatted string.
 */
export function formatMinorUnits(
  minorUnits: number,
  currency: SupportedCurrency = 'INR',
  includeDecimals: boolean = true
): string {
  return formatCurrency(fromMinorUnits(minorUnits), currency, includeDecimals);
}

/**
 * Parses user input string (e.g. "1,500.50") safely into a numeric float.
 * Returns 0 if invalid.
 */
export function parseCurrencyInput(value: string): number {
  if (!value) return 0;
  // Strip everything except digits and decimal point
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

