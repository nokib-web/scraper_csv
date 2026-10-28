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
async function fetchWithBrowserFallback(url, customTimeout = 10000, extraHeaders = {}) {
  let lastError = null;

  for (let i = 0; i < BROWSER_HEADER_SETS.length; i++) {
    const headers = { ...BROWSER_HEADER_SETS[i], ...extraHeaders };
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
    }
  }

  if (lastError && lastError.response && lastError.response.status === 403) {
    const isCloudflare = lastError.response.headers['server']?.includes('cloudflare') ||
      (typeof lastError.response.data === 'string' && (lastError.response.data.includes('Just a moment...') || lastError.response.data.includes('challenges.cloudflare.com')));
    if (isCloudflare) {
      let hostname = url;
      try { hostname = new URL(url).hostname; } catch {}
      const cfErr = new Error(`Access Denied (HTTP 403): ${hostname} is protected by Cloudflare WAF (Managed Challenge / Turnstile CAPTCHA). Cloudflare's edge firewall is blocking automated server requests.`);
      cfErr.isCloudflareBlocked = true;
      cfErr.status = 403;
      throw cfErr;
    }
  }

  throw lastError || new Error(`Failed to fetch from ${url}`);
}

/**
 * Detect the platform / engine of an e-commerce website
 */
async function detectPlatform(url, options = {}) {
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

    // 0. Direct Password URL Check
    if (pathname === '/password' || pathname.endsWith('/password')) {
      return {
        platform: 'shopify',
        confidence: 1.0,
        origin,
        path: pathname,
        isSingleProduct: false,
        isPasswordProtected: true,
        details: 'Password-Protected Shopify Store'
      };
    }

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
        validateStatus: (status) => status >= 200 && status < 400
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

      // Check if redirect ended up on password page
      const finalProbeUrl = probeShopify.request?.res?.responseUrl || probeShopify.config?.url || '';
      if (finalProbeUrl.includes('/password') || (typeof probeShopify.data === 'string' && probeShopify.data.includes('storefront_password'))) {
        return {
          platform: 'shopify',
          confidence: 1.0,
          origin,
          path: pathname,
          isSingleProduct,
          isPasswordProtected: true,
          details: 'Password-Protected Shopify Store'
        };
      }
    } catch (e) {}

    // 2. Fetch page HTML to inspect meta tags & scripts
    let customCookie = options.cookie || options.sessionCookie || '';
    if (!customCookie && options.password) {
      const rawPwd = options.password.trim();
      customCookie = rawPwd.includes('=') ? rawPwd : `cf_clearance=${rawPwd}`;
    }
    const extraHeaders = customCookie ? { Cookie: customCookie } : {};
    const response = await fetchWithBrowserFallback(url, 8000, extraHeaders);
    const html = response.data;
    if (typeof html !== 'string') {
      return { platform: 'generic', confidence: 0.5, origin, path: pathname, isSingleProduct };
    }

    const $ = cheerio.load(html);

    // Shopify HTML indicators
    const isPasswordProtected = (
      pathname === '/password' ||
      pathname.endsWith('/password') ||
      html.includes('storefront_password') ||
      html.includes('action="/password"') ||
      html.includes('template-password') ||
      html.includes('password-page') ||
      (response.request?.res?.responseUrl || response.config?.url || '').includes('/password')
    );

    const isShopify = (
      isPasswordProtected ||
      html.includes('Shopify.shop') ||
      html.includes('cdn.shopify.com') ||
      $('script[src*="shopify"]').length > 0 ||
      $('link[href*="shopify"]').length > 0 ||
      html.includes('shopify-checkout') ||
      html.includes('var Shopify =')
    );

    if (isShopify) {
      return {
        platform: 'shopify',
        confidence: 0.95,
        origin,
        path: pathname,
        isSingleProduct,
        isPasswordProtected: Boolean(isPasswordProtected),
        details: isPasswordProtected ? 'Password-Protected Shopify Store' : 'Shopify Storefront Assets'
      };
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

    // Amazon Detection
    if (url.includes('amazon.com') || url.includes('amazon.in') || url.includes('amazon.co.uk') || url.includes('amzn.to')) {
      return {
        platform: 'amazon',
        confidence: 1.0,
        name: 'Amazon Marketplace',
        apiUrl: null
      };
    }

    // Daraz & Lazada Marketplace
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

    if (error.isCloudflareBlocked) {
      return {
        platform: 'generic',
        confidence: 0.5,
        origin: parsedUrl.origin || url,
        path: parsedUrl.pathname || '/',
        isSingleProduct: false,
        isCloudflareBlocked: true,
        details: 'Cloudflare WAF Protected (Managed Challenge)'
      };
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
