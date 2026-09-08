/**
 * Universal Currency Symbol & Formatter Utility
 * Supports all international e-commerce currencies.
 */

export const CURRENCY_SYMBOLS = {
  // Asia & South Asia
  'BDT': '৳',
  'TK': '৳',
  'TAKA': '৳',
  '৳': '৳',
  'INR': '₹',
  '₹': '₹',
  'PKR': 'Rs',
  'NPR': 'Rs',
  'LKR': 'Rs',
  'JPY': '¥',
  'CNY': '¥',
  'KRW': '₩',
  'PHP': '₱',
  'THB': '฿',
  'VND': '₫',
  'IDR': 'Rp',
  'MYR': 'RM',
  'SGD': 'S$',
  'HKD': 'HK$',

  // Middle East
  'SAR': 'SAR',
  'AED': 'AED',
  'QAR': 'QAR',
  'KWD': 'KD',
  'OMR': 'OMR',
  'BHD': 'BD',
  'TRY': '₺',
  'EGP': 'E£',

  // Americas
  'USD': '$',
  '$': '$',
  'CAD': 'CA$',
  'BRL': 'R$',
  'MXN': 'Mex$',
  'ARS': 'AR$',
  'CLP': 'CLP$',
  'COP': 'COL$',

  // Europe & UK
  'EUR': '€',
  '€': '€',
  'GBP': '£',
  '£': '£',
  'CHF': 'CHF',
  'RUB': '₽',
  'PLN': 'zł',
  'SEK': 'kr',
  'NOK': 'kr',
  'DKK': 'kr',
  'CZK': 'Kč',
  'HUF': 'Ft',
  'RON': 'lei',

  // Oceania
  'AUD': 'A$',
  'NZD': 'NZ$',

  // Africa
  'NGN': '₦',
  'ZAR': 'R',
  'KES': 'KSh',
  'GHS': 'GH₵'
};

/**
 * Returns the proper symbol for a currency code (e.g. 'BDT' -> '৳', 'INR' -> '₹')
 */
export function getCurrencySymbol(code = 'USD') {
  if (!code) return '$';
  const clean = String(code).trim().toUpperCase();
  if (CURRENCY_SYMBOLS[clean]) {
    return CURRENCY_SYMBOLS[clean];
  }
  if (CURRENCY_SYMBOLS[code.trim()]) {
    return CURRENCY_SYMBOLS[code.trim()];
  }
  // If already a single non-alphanumeric symbol like ৳, €, £, ₹
  if (/^[^a-zA-Z0-9\s]$/.test(code.trim())) {
    return code.trim();
  }
  return clean;
}

/**
 * Formats a price number with its corresponding currency symbol
 */
export function formatCurrencyPrice(price = 0, code = 'USD') {
  const symbol = getCurrencySymbol(code);
  const num = Number(price || 0);
  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return `${symbol}${formatted}`;
}
