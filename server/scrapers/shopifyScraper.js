const axios = require('axios');
const cheerio = require('cheerio');
const { DEFAULT_HEADERS, BROWSER_HEADER_SETS } = require('./detector');
const { detectStoreCurrency } = require('./currencyHelper');

/**
 * Consistent Browser Headers & User-Agent for all Shopify interactions
 * Binding the same browser fingerprint across password authentication and scraping is required
 * to prevent Shopify from rejecting storefront session digests as hijacking attempts.
 */
const SHOPIFY_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Upgrade-Insecure-Requests': '1'
};

/**
 * Normalizes a raw Shopify product object to the unified format
 */
function normalizeShopifyProduct(item, origin, defaultCurrency = 'USD') {
  const cleanOrigin = origin ? origin.replace(/\/+$/, '') : '';
  const handle = item.handle || (item.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : `prod-${item.id || Date.now()}`);
  const productUrl = item.url ? (item.url.startsWith('http') ? item.url : `${cleanOrigin}${item.url.startsWith('/') ? '' : '/'}${item.url}`) : `${cleanOrigin}/products/${handle}`;

  const isAjaxJs = Boolean(item._isAjaxJs);

  const images = [];
  const seenImgSrcs = new Set();

  const addImage = (src, alt = '', id = null, position = null) => {
    if (!src || typeof src !== 'string') return;
    let s = src.trim();
    if (s.startsWith('//')) s = `https:${s}`;
    if (!s.startsWith('http://') && !s.startsWith('https://')) return;

    // Normalize resolution by stripping Shopify size suffixes (e.g. _small.jpg -> .jpg)
    const cleanSrc = s.replace(/_(small|medium|large|grande|compact|\d+x\d+)\.(jpg|jpeg|png|webp|gif)/i, '.$2');
    if (seenImgSrcs.has(cleanSrc)) return;
    seenImgSrcs.add(cleanSrc);

    images.push({
      id: id || (images.length + 1),
      src: cleanSrc,
      alt: alt || item.title || '',
      position: position || (images.length + 1),
      width: 800,
      height: 800
    });
  };

  // 1. Process item.images
  if (Array.isArray(item.images)) {
    item.images.forEach((img, idx) => {
      if (typeof img === 'string') {
        addImage(img, item.title, idx + 1, idx + 1);
      } else if (img && typeof img === 'object') {
        addImage(img.src || img.url, img.alt || item.title, img.id || (idx + 1), img.position || (idx + 1));
      }
    });
  }

  // 2. Process item.media (modern Shopify themes / API)
  if (Array.isArray(item.media)) {
    item.media.forEach((m, idx) => {
      const src = m.src || (m.preview_image && m.preview_image.src) || (m.image && m.image.src);
      if (src) addImage(src, m.alt || item.title, m.id || (idx + 1), idx + 1);
    });
  }

  // 3. Fallback: single item.image or item.featured_image
  if (images.length === 0) {
    const single = item.featured_image || item.image;
    if (typeof single === 'string') {
      addImage(single, item.title, 1, 1);
    } else if (single && typeof single === 'object') {
      addImage(single.src || single.url, single.alt || item.title, 1, 1);
    }
  }

  const variants = (item.variants && item.variants.length > 0)
    ? item.variants.map((v, idx) => {
        let stock = 99;
        if (v.inventory_quantity !== undefined && v.inventory_quantity !== null && v.inventory_quantity !== '' && !isNaN(Number(v.inventory_quantity))) {
          stock = Number(v.inventory_quantity);
        } else if (item.inventory_quantity !== undefined && item.inventory_quantity !== null && item.inventory_quantity !== '' && !isNaN(Number(item.inventory_quantity))) {
          stock = Number(item.inventory_quantity);
        } else if (v.available === false || item.available === false || v.is_in_stock === false || item.is_in_stock === false) {
          stock = 0;
        }

        // Shopify Ajax API (/products/<handle>.js) returns prices in CENTS (e.g. 2999 = $29.99)
        let rawPrice = v.price;
        let rawCompare = v.compare_at_price;
        if (isAjaxJs) {
          if (typeof rawPrice === 'number') rawPrice = (rawPrice / 100).toFixed(2);
          if (typeof rawCompare === 'number') rawCompare = (rawCompare / 100).toFixed(2);
        }

        const priceNum = parseFloat(rawPrice || 0) || 0;
        const compareNum = rawCompare ? parseFloat(rawCompare) : null;

        return {
          id: v.id || `${item.id}-${idx}`,
          title: v.title || 'Default Title',
          price: priceNum,
          compare_at_price: compareNum,
          sku: v.sku || `SKU-${item.id}-${idx + 1}`,
          inventory_quantity: stock,
          available: v.available !== undefined ? Boolean(v.available) : (stock > 0),
          option1: v.option1 || (v.title !== 'Default Title' ? v.title : null),
          option2: v.option2 || null,
          option3: v.option3 || null,
          weight: v.grams ? (v.grams / 1000) : (v.weight || 0),
          barcode: v.barcode || '',
          image: v.featured_image?.src || v.image?.src || null
        };
      })
    : [{
        id: `${item.id || Date.now()}-1`,
        title: 'Default Title',
        price: parseFloat(item.price || 0) || 0,
        compare_at_price: item.compare_at_price ? parseFloat(item.compare_at_price) : null,
        sku: `SKU-${item.id || Date.now()}`,
        inventory_quantity: (item.inventory_quantity !== undefined && !isNaN(Number(item.inventory_quantity))) ? Number(item.inventory_quantity) : (item.available === false || item.is_in_stock === false ? 0 : 99),
        available: item.available !== false && item.is_in_stock !== false,
        option1: null,
        option2: null,
        option3: null,
        weight: 0,
        barcode: '',
        image: null
      }];

  const primaryPrice = variants[0]?.price || 0;
  const regularPrice = variants[0]?.compare_at_price || primaryPrice;

  return {
    id: String(item.id || Date.now() + Math.random()),
    title: item.title || 'Untitled Product',
    handle: handle,
    description: (item.body_html || item.description || '').trim(),
    vendor: item.vendor || item.brand || 'Store',
    product_type: item.product_type || item.type || 'General',
    tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? item.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
    status: item.published_at ? 'active' : 'active',
    published_at: item.published_at || new Date().toISOString(),
    created_at: item.created_at || new Date().toISOString(),
    price: primaryPrice,
    regular_price: regularPrice,
    currency: item.currency || defaultCurrency || 'USD',
    inventory_quantity: variants[0]?.inventory_quantity !== undefined ? variants[0].inventory_quantity : (item.available === false ? 0 : 99),
    variants: variants,
    images: images,
    options: item.options || [],
    url: productUrl,
    source: 'shopify'
  };
}

/**
 * Cookie Jar Helper for tracking and building persistent session cookies
 */
class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  add(setCookieHeaders) {
    if (!setCookieHeaders) return;
    const list = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    for (const str of list) {
      if (typeof str !== 'string') continue;
      const first = str.split(';')[0];
      const eq = first.indexOf('=');
      if (eq !== -1) {
        const name = first.slice(0, eq).trim();
        const val = first.slice(eq + 1).trim();
        if (name) {
          this.cookies.set(name, val);
        }
      }
    }
  }

  has(name) {
    return this.cookies.has(name);
  }

  get(name) {
    return this.cookies.get(name);
  }

  getHeader() {
    return Array.from(this.cookies.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

/**
 * Checks whether an Axios response or HTML indicates a password-protected storefront
 */
function isPasswordPageResponse(res) {
  if (!res) return false;
  const finalUrl = res.request?.res?.responseUrl || res.config?.url || '';
  if (finalUrl.includes('/password')) return true;

  const loc = res.headers && (res.headers['location'] || res.headers['Location'] || '');
  if (loc && loc.includes('/password')) return true;

  if (typeof res.data === 'string') {
    const html = res.data;
    if (
      html.includes('storefront_password') ||
      html.includes('action="/password"') ||
      (html.includes('name="password"') && html.includes('shopify')) ||
      html.includes('password-page') ||
      html.includes('template-password') ||
      html.includes('Enter store using password') ||
      html.includes('Opening soon')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Authenticates against Shopify storefront password page and returns session Cookie header.
 * Correctly implements the complete Rails CSRF authenticity token handshake and redirect flow.
 */
async function authenticateShopifyPassword(origin, password, onLog) {
  if (!password || !password.trim()) {
    const err = new Error('This store is password protected. Please enter the storefront password.');
    err.isPasswordProtected = true;
    err.platform = 'shopify';
    throw err;
  }

  const cleanOrigin = origin.replace(/\/+$/, '');
  if (onLog) onLog(`Initiating storefront authentication for ${cleanOrigin}...`);

  const jar = new CookieJar();

  let authenticityToken = '';
  let formAction = `${cleanOrigin}/password`;
  let formType = 'storefront_password';
  let utf8 = '✓';

  // Step 1: GET /password to acquire initial session cookies & Rails authenticity_token
  try {
    if (onLog) onLog(`Loading storefront password protection page from ${cleanOrigin}/password...`);
    const getRes = await axios.get(`${cleanOrigin}/password`, {
      headers: SHOPIFY_HEADERS,
      timeout: 10000,
      maxRedirects: 5,
      beforeRedirect: (options, responseDetails) => {
        jar.add(responseDetails.headers['set-cookie']);
      },
      validateStatus: (status) => status >= 200 && status < 500
    });

    jar.add(getRes.headers['set-cookie']);

    if (getRes.data && typeof getRes.data === 'string') {
      const $ = cheerio.load(getRes.data);
      authenticityToken = $('input[name="authenticity_token"]').val() ||
                          $('form[action*="password"] input[name="authenticity_token"]').val() ||
                          $('meta[name="csrf-token"]').attr('content') ||
                          '';

      const actionAttr = $('form[action*="password"]').attr('action') || $('form.password-form').attr('action') || $('form.storefront-password-form').attr('action');
      if (actionAttr) {
        formAction = actionAttr.startsWith('http') ? actionAttr : `${cleanOrigin}${actionAttr.startsWith('/') ? '' : '/'}${actionAttr}`;
      }

      formType = $('input[name="form_type"]').val() || formType;
      utf8 = $('input[name="utf8"]').val() || utf8;
    }
  } catch (err) {
    if (onLog) onLog(`Notice: Initial GET /password encountered: ${err.message}. Proceeding with standard credentials post...`);
  }

  // Step 2: POST credentials to unlock storefront session
  const postParams = new URLSearchParams();
  postParams.append('form_type', formType);
  postParams.append('utf8', utf8);
  if (authenticityToken && authenticityToken.trim()) {
    postParams.append('authenticity_token', authenticityToken.trim());
  }
  postParams.append('password', password.trim());
  postParams.append('commit', 'Enter');

  if (onLog) onLog(`Submitting storefront password to ${formAction}...`);

  try {
    const postRes = await axios.post(formAction, postParams.toString(), {
      headers: {
        ...SHOPIFY_HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': cleanOrigin,
        'Referer': `${cleanOrigin}/password`,
        'Cookie': jar.getHeader(),
        'Sec-Fetch-Site': 'same-origin'
      },
      timeout: 12000,
      maxRedirects: 5,
      beforeRedirect: (options, responseDetails) => {
        jar.add(responseDetails.headers['set-cookie']);
        const currentCookies = jar.getHeader();
        options.headers = options.headers || {};
        options.headers['Cookie'] = currentCookies;
        options.headers['cookie'] = currentCookies;
      },
      validateStatus: (status) => status >= 200 && status < 500
    });

    jar.add(postRes.headers['set-cookie']);

    if (postRes.status === 429) {
      const err = new Error('Too many password attempts on this store. Please wait 1-2 minutes before trying again.');
      err.isPasswordProtected = true;
      err.invalidPassword = false;
      err.platform = 'shopify';
      throw err;
    }

    const finalCookies = jar.getHeader();
    const hasDigest = jar.has('storefront_digest') || finalCookies.includes('storefront_digest');

    // Step 3: Verification probe with matching browser profile
    if (finalCookies) {
      // 3A: Direct probe against /products.json
      try {
        const testRes = await axios.get(`${cleanOrigin}/products.json?limit=1`, {
          headers: {
            ...SHOPIFY_HEADERS,
            'Cookie': finalCookies,
            'Accept': 'application/json, text/plain, */*'
          },
          timeout: 6000,
          validateStatus: (s) => s === 200
        });

        if (testRes.data && Array.isArray(testRes.data.products)) {
          if (onLog) onLog(`Storefront authentication verified! Catalog accessible.`);
          return finalCookies;
        }
      } catch (probeErr) {}

      // 3B: Probe against store homepage
      try {
        const homeRes = await axios.get(`${cleanOrigin}/`, {
          headers: {
            ...SHOPIFY_HEADERS,
            'Cookie': finalCookies
          },
          timeout: 6000,
          validateStatus: (s) => s === 200
        });

        if (homeRes.data && typeof homeRes.data === 'string' && !isPasswordPageResponse(homeRes)) {
          if (onLog) onLog(`Storefront authentication verified via storefront homepage!`);
          return finalCookies;
        }
      } catch (homeErr) {}
    }

    if (hasDigest) {
      if (onLog) onLog(`Storefront authentication successful (storefront_digest established).`);
      return finalCookies;
    }

    // Password was rejected by Shopify
    const err = new Error('Incorrect storefront password. Please verify the store password and try again.');
    err.isPasswordProtected = true;
    err.invalidPassword = true;
    err.platform = 'shopify';
    throw err;
  } catch (err) {
    if (err.isPasswordProtected) throw err;
    const authErr = new Error(`Storefront authentication failed: ${err.message}`);
    authErr.isPasswordProtected = true;
    authErr.invalidPassword = false;
    authErr.platform = 'shopify';
    throw authErr;
  }
}

/**
 * Scrapes a single Shopify product with multi-tier fallback (JSON -> Ajax JS -> JSON-LD -> HTML)
 */
async function scrapeShopifySingleProduct(url, options = {}, onLog) {
  if (typeof options === 'function') {
    onLog = options;
    options = {};
  }
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;
  const pathname = parsedUrl.pathname;
  const handleMatch = pathname.match(/\/products\/([^\/\?#]+)/);
  const handle = handleMatch ? handleMatch[1] : null;

  let sessionCookie = options.sessionCookie || '';
  if (options.password && !sessionCookie) {
    sessionCookie = await authenticateShopifyPassword(origin, options.password, onLog);
  }

  const reqHeaders = {
    ...SHOPIFY_HEADERS,
    ...(sessionCookie ? { Cookie: sessionCookie } : {})
  };

  if (handle) {
    // Tier 1: Public JSON endpoint /products/${handle}.json
    try {
      if (onLog) onLog(`Fetching Shopify product metadata from /products/${handle}.json...`);
      const res = await axios.get(`${origin}/products/${handle}.json`, {
        headers: reqHeaders,
        timeout: 7000,
        validateStatus: (s) => s >= 200 && s < 500
      });
      if (res.status === 401 || isPasswordPageResponse(res)) {
        const err = new Error(options.password ? 'Incorrect storefront password. Please verify and try again.' : 'This store is password protected. Please enter the storefront password.');
        err.isPasswordProtected = true;
        err.invalidPassword = Boolean(options.password);
        err.platform = 'shopify';
        throw err;
      }
      if (res.data && res.data.product) {
        return [normalizeShopifyProduct(res.data.product, origin)];
      }
    } catch (e) {
      if (e.isPasswordProtected) throw e;
      if (e.response && (e.response.status === 401 || isPasswordPageResponse(e.response))) {
        const err = new Error(options.password ? 'Incorrect storefront password. Please verify and try again.' : 'This store is password protected. Please enter the storefront password.');
        err.isPasswordProtected = true;
        err.invalidPassword = Boolean(options.password);
        err.platform = 'shopify';
        throw err;
      }
    }

    // Tier 2: Shopify Ajax API endpoint /products/${handle}.js (always available in Shopify themes)
    try {
      if (onLog) onLog(`Fetching Shopify product from AJAX API /products/${handle}.js...`);
      const resJs = await axios.get(`${origin}/products/${handle}.js`, {
        headers: reqHeaders,
        timeout: 6000,
        validateStatus: (s) => s >= 200 && s < 500
      });
      if (resJs.status === 401 || isPasswordPageResponse(resJs)) {
        const err = new Error(options.password ? 'Incorrect storefront password. Please verify and try again.' : 'This store is password protected. Please enter the storefront password.');
        err.isPasswordProtected = true;
        err.invalidPassword = Boolean(options.password);
        err.platform = 'shopify';
        throw err;
      }
      if (resJs.data && (resJs.data.id || resJs.data.title)) {
        resJs.data._isAjaxJs = true;
        return [normalizeShopifyProduct(resJs.data, origin)];
      }
    } catch (e) {
      if (e.isPasswordProtected) throw e;
      if (e.response && (e.response.status === 401 || isPasswordPageResponse(e.response))) {
        const err = new Error(options.password ? 'Incorrect storefront password. Please verify and try again.' : 'This store is password protected. Please enter the storefront password.');
        err.isPasswordProtected = true;
        err.invalidPassword = Boolean(options.password);
        err.platform = 'shopify';
        throw err;
      }
    }
  }

  // Tier 3: Parse Product HTML
  if (onLog) onLog(`Parsing single product page HTML from ${url}...`);
  const res = await axios.get(url, {
    headers: reqHeaders,
    timeout: 9000,
    validateStatus: (s) => s >= 200 && s < 500
  });
  if (res.status === 401 || isPasswordPageResponse(res)) {
    const err = new Error(options.password ? 'Incorrect storefront password. Please verify and try again.' : 'This store is password protected. Please enter the storefront password.');
    err.isPasswordProtected = true;
    err.invalidPassword = Boolean(options.password);
    err.platform = 'shopify';
    throw err;
  }

  const $ = cheerio.load(res.data);
  let productData = null;

  // Check for inline JSON Product script
  $('script').each((_, el) => {
    if (productData) return;
    const content = $(el).html() || '';
    if (content.includes('"product":') && content.includes('"variants":')) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.product) productData = parsed.product;
      } catch {}
    }
  });

  // Check for application/ld+json
  if (!productData) {
    $('script[type="application/ld+json"]').each((_, el) => {
      if (productData) return;
      try {
        const json = JSON.parse($(el).html() || '{}');
        if (json['@type'] === 'Product' || (Array.isArray(json['@graph']) && json['@graph'].some(x => x['@type'] === 'Product'))) {
          const p = json['@type'] === 'Product' ? json : json['@graph'].find(x => x['@type'] === 'Product');
          productData = {
            id: p.sku || handle || Date.now(),
            title: p.name,
            handle: handle || (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'product'),
            body_html: p.description || '',
            vendor: p.brand?.name || p.brand || '',
            product_type: p.category || 'General',
            tags: [],
            price: p.offers?.price || p.offers?.lowPrice || 0,
            currency: p.offers?.priceCurrency || 'USD',
            images: Array.isArray(p.image) ? p.image : (p.image ? [p.image] : []),
            variants: []
          };
        }
      } catch {}
    });
  }

  // Extract stock info from DOM
  const isOutOfStock = $('[name="add"][disabled], .sold-out, .out-of-stock, [data-sold-out="true"], .product-form__submit[disabled]').length > 0 ||
    /sold\s*out|out\s*of\s*stock|স্টকে\s*নেই/i.test($('.product-form, .product__info-container, .product-single').text());

  const maxQtyAttr = $('input[name="quantity"], input.quantity__input, [data-quantity-input]').attr('max');
  const domDataStock = $('[data-inventory-quantity], [data-stock], [data-max-qty]').attr('data-inventory-quantity') ||
    $('[data-inventory-quantity], [data-stock], [data-max-qty]').attr('data-stock') ||
    $('[data-inventory-quantity], [data-stock], [data-max-qty]').attr('data-max-qty');
  const stockText = $('.product__inventory, .inventory--low, .product-form__inventory, .stock, .in-stock, .inventory').text();
  const stockMatch = stockText.match(/(\d+)\s*(?:in\s*stock|left\s*in\s*stock|items?\s*left|pieces?|pcs|টি\s*স্টকে|স্টকে\s*আছে)/i);

  let detectedStock = 99;
  if (isOutOfStock) {
    detectedStock = 0;
  } else if (domDataStock && !isNaN(Number(domDataStock))) {
    detectedStock = Number(domDataStock);
  } else if (maxQtyAttr && !isNaN(Number(maxQtyAttr)) && Number(maxQtyAttr) > 0 && Number(maxQtyAttr) < 100000) {
    detectedStock = Number(maxQtyAttr);
  } else if (stockMatch) {
    detectedStock = parseInt(stockMatch[1], 10);
  }

  if (productData) {
    if (productData.inventory_quantity === undefined) {
      productData.inventory_quantity = detectedStock;
    }
    if (isOutOfStock) {
      productData.available = false;
    }
    return [normalizeShopifyProduct(productData, origin)];
  }

  // Tier 4: HTML Cheerio fallback (extract ALL gallery images)
  const title = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim() || 'Scraped Product';
  const description = $('meta[property="og:description"]').attr('content') || $('.product-description, .description, #description').text().trim() || '';
  const priceText = $('meta[property="og:price:amount"]').attr('content') || $('.price, .product-price, [data-price]').first().text().replace(/[^0-9.]/g, '') || '0';
  const images = [];

  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) images.push({ id: 1, src: ogImage, alt: title, position: 1 });

  $('img[src*="cdn.shopify.com"], img[data-src*="cdn.shopify.com"], .product__media img, .product-gallery img').each((_, el) => {
    let src = $(el).attr('data-src') || $(el).attr('src') || $(el).attr('srcset');
    if (src) {
      if (src.includes(',')) src = src.split(',')[0].trim().split(' ')[0];
      if (src.startsWith('//')) src = `https:${src}`;
      src = src.replace(/_(small|medium|large|grande|compact|\d+x\d+)\.(jpg|jpeg|png|webp)/i, '.$2');
      if (src.startsWith('http') && !images.some(img => img.src === src)) {
        images.push({ id: images.length + 1, src, alt: title, position: images.length + 1 });
      }
    }
  });

  return [normalizeShopifyProduct({
    id: handle || Date.now(),
    title,
    handle: handle || 'product',
    body_html: description,
    vendor: origin.replace(/^https?:\/\//, ''),
    product_type: 'General',
    tags: ['Scraped'],
    inventory_quantity: detectedStock,
    available: !isOutOfStock && detectedStock > 0,
    variants: [{
      id: '1',
      title: 'Default Title',
      price: parseFloat(priceText) || 0,
      inventory_quantity: detectedStock,
      available: !isOutOfStock && detectedStock > 0
    }],
    images
  }, origin)];
}

/**
 * High-Speed Shopify Collection HTML Scraper with AJAX Multi-Image Hydration
 * Triggered when /products.json is restricted, blocked by Cloudflare/datacenter IP, or unavailable.
 */
async function scrapeShopifyCollectionHtml(collectionUrl, options = {}, sessionCookie = '', onLog) {
  const parsedUrl = new URL(collectionUrl);
  const origin = parsedUrl.origin;
  const maxProducts = options.limit || 50;
  const products = [];
  const seenHandles = new Set();

  if (options.password && !sessionCookie) {
    sessionCookie = await authenticateShopifyPassword(origin, options.password, onLog);
  }

  const reqHeaders = {
    ...SHOPIFY_HEADERS,
    ...(sessionCookie ? { Cookie: sessionCookie } : {})
  };

  let page = 1;
  const maxPages = Math.ceil(maxProducts / 12) + 2;

  if (onLog) onLog(`[COLLECTION HYDRATION] Crawling collection page HTML with full image & variant hydration...`);

  while (products.length < maxProducts && page <= maxPages) {
    const pageUrl = new URL(collectionUrl);
    pageUrl.searchParams.set('page', String(page));

    if (onLog) onLog(`Extracting product links from collection page ${page}...`);

    let html = '';
    try {
      const res = await axios.get(pageUrl.toString(), {
        headers: reqHeaders,
        timeout: 9000,
        validateStatus: (s) => s >= 200 && s < 500
      });
      if (res.status === 401 || isPasswordPageResponse(res)) {
        const err = new Error(options.password ? 'Incorrect storefront password. Please verify and try again.' : 'This store is password protected. Please enter the storefront password.');
        err.isPasswordProtected = true;
        err.invalidPassword = Boolean(options.password);
        err.platform = 'shopify';
        throw err;
      }
      html = res.data;
    } catch (e) {
      if (e.isPasswordProtected) throw e;
      if (e.response && (e.response.status === 401 || isPasswordPageResponse(e.response))) {
        const err = new Error(options.password ? 'Incorrect storefront password. Please verify and try again.' : 'This store is password protected. Please enter the storefront password.');
        err.isPasswordProtected = true;
        err.invalidPassword = Boolean(options.password);
        err.platform = 'shopify';
        throw err;
      }
      if (onLog) onLog(`Reached end of collection pages at page ${page}.`);
      break;
    }

    if (!html || typeof html !== 'string') break;

    const $ = cheerio.load(html);
    const newHandles = [];

    // Extract all product links
    $('a[href*="/products/"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const match = href.match(/\/products\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const h = match[1].toLowerCase();
        if (!seenHandles.has(h) && !newHandles.includes(h)) {
          seenHandles.add(h);
          newHandles.push(h);
        }
      }
    });

    if (newHandles.length === 0) {
      if (onLog) onLog(`No further product links found on page ${page}.`);
      break;
    }

    if (onLog) onLog(`Found ${newHandles.length} products on page ${page}. Fetching complete metadata & all gallery images...`);

    // Hydrate products with concurrency limit of 4
    const concurrency = 4;
    for (let i = 0; i < newHandles.length && products.length < maxProducts; i += concurrency) {
      const batchHandles = newHandles.slice(i, i + concurrency);
      const batchPromises = batchHandles.map(async (handle) => {
        try {
          // Try /products/${handle}.json first
          const jsonRes = await axios.get(`${origin}/products/${handle}.json`, {
            headers: reqHeaders,
            timeout: 6000
          });
          if (jsonRes.data && jsonRes.data.product) {
            return normalizeShopifyProduct(jsonRes.data.product, origin);
          }
        } catch (e) {}

        try {
          // Try /products/${handle}.js (Shopify Ajax API)
          const jsRes = await axios.get(`${origin}/products/${handle}.js`, {
            headers: reqHeaders,
            timeout: 5000
          });
          if (jsRes.data && (jsRes.data.id || jsRes.data.title)) {
            jsRes.data._isAjaxJs = true;
            return normalizeShopifyProduct(jsRes.data, origin);
          }
        } catch (e) {}

        // Fallback to single product scraper
        try {
          const single = await scrapeShopifySingleProduct(`${origin}/products/${handle}`, { sessionCookie, password: options.password }, null);
          return single[0];
        } catch (e) {
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      for (const prod of batchResults) {
        if (prod && prod.title && products.length < maxProducts) {
          products.push(prod);
        }
      }

      if (onLog) onLog(`Hydrated ${products.length}/${maxProducts} products (with full multi-image galleries)...`);
      await new Promise(r => setTimeout(r, 100));
    }

    page++;
  }

  return products;
}

/**
 * Scrapes entire Shopify catalog via /products.json with automatic pagination,
 * and seamlessly falls back to high-speed collection hydration if public API is blocked.
 */
async function scrapeShopifyCatalog(url, options = {}, onLog) {
  if (typeof options === 'function') {
    onLog = options;
    options = {};
  }
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;
  const maxProducts = options.limit || 50;
  const products = [];

  let sessionCookie = options.sessionCookie || '';
  if (options.password && !sessionCookie) {
    sessionCookie = await authenticateShopifyPassword(origin, options.password, onLog);
  }

  const reqHeaders = {
    ...SHOPIFY_HEADERS,
    ...(sessionCookie ? { Cookie: sessionCookie } : {})
  };

  // Determine collection base path if specified in URL
  let endpoint = `${origin}/products.json`;
  let isCollectionUrl = false;
  let collectionHandle = null;

  if (parsedUrl.pathname.includes('/collections/')) {
    const colMatch = parsedUrl.pathname.match(/\/collections\/([^\/\?#]+)/);
    if (colMatch && colMatch[1] && colMatch[1] !== 'all') {
      isCollectionUrl = true;
      collectionHandle = colMatch[1];
      endpoint = `${origin}/collections/${collectionHandle}/products.json`;
    }
  }

  let page = 1;
  const pageSize = 250; // Shopify max limit per page

  // Detect active store currency via /cart.js or domain
  let storeCurrency = 'USD';
  try {
    const cartRes = await axios.get(`${origin}/cart.js`, {
      headers: reqHeaders,
      timeout: 3500,
      validateStatus: (s) => s === 200
    });
    if (cartRes.data && cartRes.data.currency) {
      storeCurrency = cartRes.data.currency.toUpperCase();
      if (onLog) onLog(`Detected active Shopify store currency: ${storeCurrency}`);
    }
  } catch (e) {
    storeCurrency = detectStoreCurrency('', origin);
  }

  if (onLog) onLog(`Connecting to Shopify Store catalog at ${endpoint}...`);

  let apiFailed = false;

  while (products.length < maxProducts) {
    const currentLimit = Math.min(pageSize, maxProducts - products.length);
    const pageUrl = `${endpoint}?limit=${currentLimit}&page=${page}`;

    if (onLog) onLog(`Fetching page ${page} from ${pageUrl}...`);

    try {
      const res = await axios.get(pageUrl, {
        headers: reqHeaders,
        timeout: 10000,
        validateStatus: (s) => s >= 200 && s < 500
      });

      if (res.status === 401 || isPasswordPageResponse(res)) {
        const err = new Error(options.password ? 'Incorrect storefront password. Please verify and try again.' : 'This store is password protected. Please enter the storefront password to extract products.');
        err.isPasswordProtected = true;
        err.invalidPassword = Boolean(options.password);
        err.platform = 'shopify';
        throw err;
      }

      const batch = res.data && res.data.products;
      if (!batch || !Array.isArray(batch)) {
        if (page === 1) {
          apiFailed = true;
        }
        break;
      }

      if (batch.length === 0) {
        if (onLog) onLog(`Reached end of catalog (Total items: ${products.length}).`);
        break;
      }

      for (const item of batch) {
        products.push(normalizeShopifyProduct(item, origin, storeCurrency));
        if (products.length >= maxProducts) break;
      }

      if (onLog) onLog(`Extracted ${products.length} products (all full image sets preserved)...`);

      if (batch.length < currentLimit) {
        break; // No more products in this collection
      }

      page++;
      await new Promise(r => setTimeout(r, 150));
    } catch (err) {
      if (err.isPasswordProtected) throw err;
      if (err.response && (err.response.status === 401 || isPasswordPageResponse(err.response))) {
        const passwordErr = new Error(options.password ? 'Incorrect storefront password. Please verify and try again.' : 'This store is password protected. Please enter the storefront password to extract products.');
        passwordErr.isPasswordProtected = true;
        passwordErr.invalidPassword = Boolean(options.password);
        passwordErr.platform = 'shopify';
        throw passwordErr;
      }
      if (onLog) onLog(`Shopify API endpoint returned: ${err.message}.`);
      apiFailed = true;
      break;
    }
  }

  // If collection JSON endpoint failed on page 1, try global /products.json or collection HTML hydration
  if (products.length === 0 && apiFailed) {
    if (isCollectionUrl && endpoint !== `${origin}/products.json`) {
      if (onLog) onLog(`Collection products.json unavailable. Testing primary store catalog endpoint...`);
      try {
        const testRes = await axios.get(`${origin}/products.json?limit=1`, {
          headers: reqHeaders,
          timeout: 5000,
          validateStatus: (s) => s >= 200 && s < 500
        });
        if (testRes.status === 401 || isPasswordPageResponse(testRes)) {
          const err = new Error(options.password ? 'Incorrect storefront password. Please verify and try again.' : 'This store is password protected. Please enter the storefront password to extract products.');
          err.isPasswordProtected = true;
          err.invalidPassword = Boolean(options.password);
          err.platform = 'shopify';
          throw err;
        }
        if (testRes.data && Array.isArray(testRes.data.products) && testRes.data.products.length > 0) {
          // Global catalog works! Recurse with root catalog URL
          return scrapeShopifyCatalog(origin, { ...options, sessionCookie }, onLog);
        }
      } catch (e) {
        if (e.isPasswordProtected) throw e;
      }
    }

    // High-Speed HTML crawl with AJAX multi-image hydration
    if (onLog) onLog(`Engaging deep Shopify Collection Extractor with full gallery image hydration...`);
    const targetCollectionUrl = isCollectionUrl ? `${origin}/collections/${collectionHandle}` : `${origin}/collections/all`;
    const hydrated = await scrapeShopifyCollectionHtml(targetCollectionUrl, { ...options, sessionCookie, password: options.password }, sessionCookie, onLog);
    if (hydrated && hydrated.length > 0) {
      return hydrated;
    }
  }

  return products;
}

module.exports = {
  scrapeShopifyCatalog,
  scrapeShopifySingleProduct,
  scrapeShopifyCollectionHtml,
  normalizeShopifyProduct,
  authenticateShopifyPassword,
  isPasswordPageResponse
};
