/**
 * Universal Currency Detection and Normalization Engine
 * Automatically extracts the store's native currency code (BDT, USD, EUR, GBP, INR, CAD, AUD, etc.)
 * from meta tags, JSON-LD, platform scripts, DOM symbols, and domain heuristics.
 */

const SYMBOL_TO_CODE = {
  '৳': 'BDT',
  '&#2547;': 'BDT',
  '\u09F3': 'BDT',
  'TK': 'BDT',
  'TK.': 'BDT',
  'TAKA': 'BDT',
  'টাকা': 'BDT',
  '₹': 'INR',
  '&#8377;': 'INR',
  '\u20B9': 'INR',
  'RS': 'INR',
  'RS.': 'INR',
  '€': 'EUR',
  '&EURO;': 'EUR',
  '£': 'GBP',
  '&POUND;': 'GBP',
  '¥': 'JPY',
  '&YEN;': 'JPY',
  '₩': 'KRW',
  '₺': 'TRY',
  '₽': 'RUB',
  '₱': 'PHP',
  '฿': 'THB',
  '₫': 'VND',
  'RP': 'IDR',
  '₦': 'NGN',
  'R$': 'BRL',
  'ZŁ': 'PLN',
  'LEI': 'RON',
  'KČ': 'CZK',
  'FT': 'HUF',
  'E£': 'EGP',
  'CHF': 'CHF',
  'AED': 'AED',
  'SAR': 'SAR',
  'QAR': 'QAR',
  'KWD': 'KWD',
  'OMR': 'OMR',
  'BHD': 'BHD',
  'CAD': 'CAD',
  'CA$': 'CAD',
  'C$': 'CAD',
  'AUD': 'AUD',
  'AU$': 'AUD',
  'A$': 'AUD',
  'NZD': 'NZD',
  'NZ$': 'NZD',
  'SGD': 'SGD',
  'S$': 'SGD',
  'HKD': 'HKD',
  'HK$': 'HKD',
  'USD': 'USD',
  '$': 'USD'
};

const TLD_TO_CURRENCY = {
  '.bd': 'BDT',
  '.com.bd': 'BDT',
  '.in': 'INR',
  '.co.in': 'INR',
  '.uk': 'GBP',
  '.co.uk': 'GBP',
  '.ca': 'CAD',
  '.au': 'AUD',
  '.com.au': 'AUD',
  '.de': 'EUR',
  '.fr': 'EUR',
  '.it': 'EUR',
  '.es': 'EUR',
  '.nl': 'EUR',
  '.eu': 'EUR',
  '.pk': 'PKR',
  '.com.pk': 'PKR',
  '.np': 'NPR',
  '.com.np': 'NPR',
  '.lk': 'LKR',
  '.sg': 'SGD',
  '.com.sg': 'SGD',
  '.my': 'MYR',
  '.com.my': 'MYR',
  '.th': 'THB',
  '.co.th': 'THB',
  '.vn': 'VND',
  '.ph': 'PHP',
  '.com.ph': 'PHP',
  '.id': 'IDR',
  '.co.id': 'IDR',
  '.sa': 'SAR',
  '.ae': 'AED',
  '.jp': 'JPY',
  '.co.jp': 'JPY',
  '.br': 'BRL',
  '.com.br': 'BRL',
  '.ng': 'NGN',
  '.za': 'ZAR',
  '.co.za': 'ZAR',
  '.tr': 'TRY',
  '.com.tr': 'TRY',
  '.eg': 'EGP'
};

const KNOWN_DOMAINS_CURRENCY = {
  'maktabatulas': 'BDT',
  'maktabatulazhar': 'BDT',
  'wafilife': 'BDT',
  'rokomari': 'BDT',
  'daraz.com.bd': 'BDT',
  'ghorerbazar': 'BDT',
  'startech': 'BDT',
  'ryans': 'BDT',
  'batabd': 'BDT',
  'aarong': 'BDT',
  'chaldal': 'BDT',
  'shajgoj': 'BDT',
  'othoba': 'BDT',
  'pickaboo': 'BDT',
  'daraz.pk': 'PKR',
  'daraz.com.np': 'NPR',
  'daraz.lk': 'LKR',
  'flipkart': 'INR',
  'myntra': 'INR',
  'ajio': 'INR',
  'amazon.in': 'INR',
  'amazon.co.uk': 'GBP',
  'amazon.ca': 'CAD',
  'amazon.de': 'EUR',
  'amazon.fr': 'EUR',
  'amazon.it': 'EUR',
  'amazon.es': 'EUR',
  'amazon.co.jp': 'JPY',
  'amazon.sa': 'SAR',
  'amazon.ae': 'AED',
  'amazon.com.au': 'AUD'
};

/**
 * Normalizes any currency string / symbol to a clean ISO 4217 code (e.g. 'BDT', 'USD')
 */
function normalizeCurrencyCode(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const upper = raw.toUpperCase().trim();
  if (upper.length === 3 && /^[A-Z]{3}$/.test(upper)) {
    return upper;
  }
  if (SYMBOL_TO_CODE[upper]) {
    return SYMBOL_TO_CODE[upper];
  }
  if (SYMBOL_TO_CODE[raw.trim()]) {
    return SYMBOL_TO_CODE[raw.trim()];
  }
  return null;
}

/**
 * Detects currency from HTML content, cheerio DOM, and URL
 */
function detectStoreCurrency(html = '', url = '', $ = null) {
  let hostname = '';
  try {
    const parsed = new URL(url);
    hostname = parsed.hostname.toLowerCase();
  } catch (e) {
    hostname = (url || '').toLowerCase();
  }

  // 1. Check known domain overrides
  for (const [key, curr] of Object.entries(KNOWN_DOMAINS_CURRENCY)) {
    if (hostname.includes(key)) {
      return curr;
    }
  }

  // 2. Check HTML Meta Tags
  if ($) {
    const ogCurrency = $('meta[property="og:price:currency"]').attr('content') ||
                       $('meta[name="og:price:currency"]').attr('content') ||
                       $('meta[property="product:price:currency"]').attr('content') ||
                       $('meta[itemprop="priceCurrency"]').attr('content') ||
                       $('meta[name="currency"]').attr('content') ||
                       $('meta[name="twitter:data2"]').attr('content');

    const normalizedMeta = normalizeCurrencyCode(ogCurrency);
    if (normalizedMeta) return normalizedMeta;

    // WooCommerce Currency Symbol Class
    const wcSymbol = $('.woocommerce-Price-currencySymbol').first().text().trim();
    if (wcSymbol) {
      const normalizedWc = normalizeCurrencyCode(wcSymbol);
      if (normalizedWc) return normalizedWc;
    }
  }

  // 3. Inspect JSON-LD Blocks
  if ($) {
    let jsonLdCurrency = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      if (jsonLdCurrency) return;
      try {
        const parsed = JSON.parse($(el).html() || '{}');
        const items = Array.isArray(parsed) ? parsed : (parsed['@graph'] || [parsed]);
        for (const item of items) {
          if (item?.offers?.priceCurrency) {
            jsonLdCurrency = normalizeCurrencyCode(item.offers.priceCurrency);
            if (jsonLdCurrency) break;
          }
          if (Array.isArray(item?.offers) && item.offers[0]?.priceCurrency) {
            jsonLdCurrency = normalizeCurrencyCode(item.offers[0].priceCurrency);
            if (jsonLdCurrency) break;
          }
        }
      } catch (e) {}
    });
    if (jsonLdCurrency) return jsonLdCurrency;
  }

  // 4. Inspect JavaScript / Theme Globals
  if (typeof html === 'string') {
    // Shopify Currency regex
    const shopifyCurrMatch = html.match(/["']?currency["']?\s*:\s*["']([A-Z]{3})["']/i) ||
                             html.match(/Shopify\.currency\s*=\s*\{["']active["']\s*:\s*["']([A-Z]{3})["']/i) ||
                             html.match(/window\.ShopifyAnalytics\.meta\.currency\s*=\s*["']([A-Z]{3})["']/i);
    if (shopifyCurrMatch && shopifyCurrMatch[1]) {
      const parsedCurr = normalizeCurrencyCode(shopifyCurrMatch[1]);
      if (parsedCurr) return parsedCurr;
    }

    // WooCommerce params
    const wcParamMatch = html.match(/woocommerce_params\s*=\s*\{[^}]*["']currency_symbol["']\s*:\s*["']([^"']+)["']/i);
    if (wcParamMatch && wcParamMatch[1]) {
      const parsedWc = normalizeCurrencyCode(wcParamMatch[1]);
      if (parsedWc) return parsedWc;
    }

    // Direct symbol scans in price wrappers
    if (html.includes('৳') || html.includes('&#2547;') || html.includes('টাকা') || /\bTk\.?\s*\d+/i.test(html) || /\bBDT\b/i.test(html)) {
      return 'BDT';
    }
    if (html.includes('₹') || html.includes('&#8377;') || /\bRs\.?\s*\d+/i.test(html) || /\bINR\b/i.test(html)) {
      return 'INR';
    }
    if (html.includes('€') || html.includes('&euro;') || /\bEUR\b/i.test(html)) {
      return 'EUR';
    }
    if (html.includes('£') || html.includes('&pound;') || /\bGBP\b/i.test(html)) {
      return 'GBP';
    }
    if (html.includes('¥') || html.includes('&yen;') || /\bJPY\b/i.test(html)) {
      return 'JPY';
    }
    if (html.includes('₺') || /\bTRY\b/i.test(html)) {
      return 'TRY';
    }
    if (html.includes('₱') || /\bPHP\b/i.test(html)) {
      return 'PHP';
    }
    if (html.includes('฿') || /\bTHB\b/i.test(html)) {
      return 'THB';
    }
    if (html.includes('₫') || /\bVND\b/i.test(html)) {
      return 'VND';
    }
    if (/\bCAD\b/i.test(html) || html.includes('CA$') || html.includes('C$')) {
      return 'CAD';
    }
    if (/\bAUD\b/i.test(html) || html.includes('AU$') || html.includes('A$')) {
      return 'AUD';
    }
    if (/\bAED\b/i.test(html) || html.includes('د.إ')) {
      return 'AED';
    }
    if (/\bSAR\b/i.test(html) || html.includes('ر.س')) {
      return 'SAR';
    }
  }

  // 5. TLD / Domain Ext Suffix Fallback
  for (const [tld, curr] of Object.entries(TLD_TO_CURRENCY)) {
    if (hostname.endsWith(tld) || hostname.includes(tld + '/')) {
      return curr;
    }
  }

  // Default fallback
  return 'USD';
}

module.exports = {
  detectStoreCurrency,
  normalizeCurrencyCode,
  SYMBOL_TO_CODE
};
