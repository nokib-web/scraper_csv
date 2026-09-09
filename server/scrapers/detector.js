const axios = require('axios');
const cheerio = require('cheerio');

const BROWSER_HEADER_SETS = [
  {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Upgrade-Insecure-Requests': '1'
  },
  {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  }
];

const DEFAULT_HEADERS = BROWSER_HEADER_SETS[0];

/**
 * Robust HTTP GET with multi-browser header rotation & anti-bot retry
 */
async function fetchWithBrowserFallback(url, customTimeout = 10000) {
  let lastError = null;

  for (let i = 0; i < BROWSER_HEADER_SETS.length; i++) {
    const headers = BROWSER_HEADER_SETS[i];
    try {
      const res = await axios.get(url, {
        headers,
        timeout: customTimeout,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400
      });
      if (res.data) {
        return res;
      }
    } catch (err) {
      lastError = err;
      // If 403 or 401 or 503, retry next header set
    }
  }

  throw lastError || new Error(`Failed to fetch from ${url}`);
}

/**
 * Detect the platform / engine of an e-commerce website
 */
async function detectPlatform(url) {
  try {
    let parsedUrl = new URL(url);
    const origin = parsedUrl.origin;
    const pathname = parsedUrl.pathname;
    const hostname = parsedUrl.hostname.toLowerCase();

    const isSingleProduct = Boolean(
      pathname.includes('/products/') ||
      pathname.includes('/product/') ||
      pathname.includes('/item/') ||
      pathname.includes('/p/') ||
      pathname.includes('/dp/') ||
      pathname.includes('/gp/product/') ||
      pathname.match(/\/(product|item|dp)\/[a-zA-Z0-9_-]+/i)
    );

    // 0. Instant Domain Check for Amazon & Marketplaces
    if (hostname.includes('amazon.') || hostname.includes('amzn.')) {
      return {
        platform: 'amazon',
        confidence: 1.0,
        origin,
        path: pathname,
        isSingleProduct: isSingleProduct || pathname.includes('/dp/') || pathname.includes('/gp/product/'),
        details: 'Amazon Marketplace'
      };
    }

    if (hostname.includes('daraz.') || hostname.includes('lazada.')) {
      return {
        platform: 'daraz',
        confidence: 1.0,
        origin,
        path: pathname,
        isSingleProduct,
        details: 'Daraz / Lazada Marketplace'
      };
    }

    if (hostname.includes('guardianpubs.com') || hostname.includes('guardianpublication')) {
      return {
        platform: 'guardianpubs',
        confidence: 1.0,
        origin,
        path: pathname,
        isSingleProduct: pathname.includes('/product-details/'),
        details: 'Guardian Publications Catalog API'
      };
    }

    // 1. Quick probe for Shopify products.json
    try {
      const probeShopify = await axios.get(`${origin}/products.json?limit=1`, {
        headers: DEFAULT_HEADERS,
        timeout: 4000,
        validateStatus: (status) => status === 200
      });
      if (probeShopify.data && Array.isArray(probeShopify.data.products)) {
        return {
          platform: 'shopify',
          confidence: 1.0,
          origin,
          path: pathname,
          isSingleProduct,
          details: 'Verified Shopify Public Catalog API'
        };
      }
    } catch (e) {}

    // 2. Fetch page HTML to inspect meta tags & scripts
    const response = await fetchWithBrowserFallback(url, 8000);
    const html = response.data;
    if (typeof html !== 'string') {
      return { platform: 'generic', confidence: 0.5, origin, path: pathname, isSingleProduct };
    }

    const $ = cheerio.load(html);

    // Shopify HTML indicators
    const isShopify = (
      html.includes('Shopify.shop') ||
      html.includes('cdn.shopify.com') ||
      $('script[src*="shopify"]').length > 0 ||
      $('link[href*="shopify"]').length > 0 ||
      html.includes('shopify-checkout') ||
      html.includes('var Shopify =')
    );

    if (isShopify) {
      return { platform: 'shopify', confidence: 0.95, origin, path: pathname, isSingleProduct, details: 'Shopify Storefront Assets' };
    }

    // WooCommerce HTML indicators
    const isWoo = (
      html.includes('woocommerce') ||
      html.includes('wc-api') ||
      $('body').hasClass('woocommerce') ||
      $('link[href*="woocommerce"]').length > 0 ||
      $('script[src*="woocommerce"]').length > 0 ||
      html.includes('wp-content/plugins/woocommerce')
    );

    if (isWoo) {
      return { platform: 'woocommerce', confidence: 0.9, origin, path: pathname, isSingleProduct, details: 'WooCommerce Storefront' };
    }

    // Zatiq HTML / Asset indicators
    const isZatiq = (
      html.includes('zatiq') ||
      html.includes('zatiqeasy.com') ||
      html.includes('assets.zatiqeasy.com') ||
      html.includes('easybill.zatiq.tech')
    );

    if (isZatiq) {
      return { platform: 'zatiq', confidence: 0.95, origin, path: pathname, isSingleProduct, details: 'Zatiq / ZatiqEasy Platform' };
    }

    // 0. Amazon Detection
    if (url.includes('amazon.com') || url.includes('amazon.in') || url.includes('amazon.co.uk') || url.includes('amzn.to')) {
      return {
        platform: 'amazon',
        confidence: 1.0,
        name: 'Amazon Marketplace',
        apiUrl: null
      };
    }

    // 1. Daraz & Lazada Marketplace
    if (url.includes('daraz.') || url.includes('lazada.') || html.includes('daraz') || html.includes('lazada')) {
      return { platform: 'daraz', confidence: 0.95, origin, path: pathname, isSingleProduct, details: 'Daraz / Lazada Marketplace' };
    }

    // Wix HTML indicators
    const isWix = (
      html.includes('wix.com') ||
      html.includes('wix-warmup-data') ||
      html.includes('wix-thunderbolt') ||
      $('meta[name="generator"][content*="Wix"]').length > 0
    );

    if (isWix) {
      return { platform: 'wix', confidence: 0.85, origin, path: pathname, isSingleProduct, details: 'Wix eCommerce Engine' };
    }

    return {
      platform: 'generic',
      confidence: 0.7,
      origin,
      path: pathname,
      isSingleProduct,
      details: 'HTML5 E-Commerce / Generic Store'
    };
  } catch (error) {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      parsedUrl = { origin: url, pathname: '/' };
    }
    return {
      platform: 'generic',
      confidence: 0.5,
      origin: parsedUrl.origin || url,
      path: parsedUrl.pathname || '/',
      isSingleProduct: false,
      details: `Generic Store (${error.message})`
    };
  }
}

module.exports = {
  detectPlatform,
  fetchWithBrowserFallback,
  DEFAULT_HEADERS,
  BROWSER_HEADER_SETS
};
