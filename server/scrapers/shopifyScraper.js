const axios = require('axios');
const cheerio = require('cheerio');
const { DEFAULT_HEADERS } = require('./detector');

/**
 * Normalizes a raw Shopify product object to the unified format
 */
function normalizeShopifyProduct(item, origin) {
  const handle = item.handle || (item.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : `prod-${item.id}`);
  const productUrl = item.url ? (item.url.startsWith('http') ? item.url : `${origin}${item.url.startsWith('/') ? '' : '/'}${item.url}`) : `${origin}/products/${handle}`;

  const images = (item.images || []).map((img, idx) => {
    let src = typeof img === 'string' ? img : (img.src || img.url || '');
    if (src.startsWith('//')) src = `https:${src}`;
    return {
      id: img.id || (idx + 1),
      src: src,
      alt: img.alt || item.title || '',
      position: idx + 1,
      width: img.width || 800,
      height: img.height || 800
    };
  });

  // If images array is empty, check item.image
  if (images.length === 0 && item.image) {
    let src = typeof item.image === 'string' ? item.image : (item.image.src || '');
    if (src.startsWith('//')) src = `https:${src}`;
    if (src) {
      images.push({
        id: 1,
        src,
        alt: item.title || '',
        position: 1,
        width: 800,
        height: 800
      });
    }
  }

  const variants = (item.variants && item.variants.length > 0)
    ? item.variants.map((v, idx) => ({
        id: v.id || `${item.id}-${idx}`,
        title: v.title || 'Default Title',
        price: parseFloat(v.price || 0) || 0,
        compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
        sku: v.sku || `SKU-${item.id}-${idx + 1}`,
        inventory_quantity: v.inventory_quantity !== undefined ? v.inventory_quantity : 99,
        available: v.available !== undefined ? v.available : true,
        option1: v.option1 || (v.title !== 'Default Title' ? v.title : null),
        option2: v.option2 || null,
        option3: v.option3 || null,
        weight: v.grams ? (v.grams / 1000) : (v.weight || 0),
        barcode: v.barcode || ''
      }))
    : [{
        id: `${item.id}-1`,
        title: 'Default Title',
        price: parseFloat(item.price || 0) || 0,
        compare_at_price: null,
        sku: `SKU-${item.id}`,
        inventory_quantity: 99,
        available: true,
        option1: null,
        option2: null,
        option3: null,
        weight: 0,
        barcode: ''
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
    currency: item.currency || 'USD',
    variants: variants,
    images: images,
    options: item.options || [],
    url: productUrl,
    source: 'shopify'
  };
}

/**
 * Scrapes a single Shopify product page
 */
async function scrapeShopifySingleProduct(url, onLog) {
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;
  const pathname = parsedUrl.pathname;
  const handleMatch = pathname.match(/\/products\/([^\/\?#]+)/);
  const handle = handleMatch ? handleMatch[1] : null;

  if (handle) {
    // Try hitting .json endpoint for the product
    try {
      if (onLog) onLog(`Fetching Shopify single product metadata from /products/${handle}.json...`);
      const res = await axios.get(`${origin}/products/${handle}.json`, {
        headers: DEFAULT_HEADERS,
        timeout: 6000
      });
      if (res.data && res.data.product) {
        return [normalizeShopifyProduct(res.data.product, origin)];
      }
    } catch (e) {
      if (onLog) onLog(`Could not fetch .json directly, parsing HTML...`);
    }
  }

  // Fallback to HTML parsing
  const res = await axios.get(url, { headers: DEFAULT_HEADERS, timeout: 8000 });
  const $ = cheerio.load(res.data);

  // Look for JSON-LD Product or Product JSON script
  let productData = null;

  // Check for inline Shopify product JSON
  $('script').each((_, el) => {
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

  if (productData) {
    return [normalizeShopifyProduct(productData, origin)];
  }

  // Pure HTML Scrape fallback
  const title = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim() || 'Scraped Product';
  const description = $('meta[property="og:description"]').attr('content') || $('.product-description, .description, #description').text().trim() || '';
  const priceText = $('meta[property="og:price:amount"]').attr('content') || $('.price, .product-price, [data-price]').first().text().replace(/[^0-9.]/g, '') || '0';
  const ogImage = $('meta[property="og:image"]').attr('content');
  const images = [];
  if (ogImage) images.push({ id: 1, src: ogImage, alt: title, position: 1 });

  $('img[src*="cdn.shopify.com/s/files"]').each((i, el) => {
    let src = $(el).attr('src') || $(el).attr('data-src');
    if (src) {
      if (src.startsWith('//')) src = `https:${src}`;
      // Strip size query params to get full-res image
      src = src.replace(/_(small|medium|large|grande|compact|\d+x\d+)\./, '.');
      if (!images.some(img => img.src === src)) {
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
    variants: [{ id: '1', title: 'Default Title', price: parseFloat(priceText) || 0 }],
    images
  }, origin)];
}

/**
 * Scrapes entire Shopify catalog via /products.json with pagination
 */
async function scrapeShopifyCatalog(url, options = {}, onLog) {
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;
  const maxProducts = options.limit || 50;
  const products = [];

  // Determine collection base path if specified in URL
  let endpoint = `${origin}/products.json`;
  if (parsedUrl.pathname.includes('/collections/')) {
    const colMatch = parsedUrl.pathname.match(/\/collections\/([^\/\?#]+)/);
    if (colMatch && colMatch[1] && colMatch[1] !== 'all') {
      endpoint = `${origin}/collections/${colMatch[1]}/products.json`;
    }
  }

  let page = 1;
  const pageSize = 250; // Shopify max limit per page

  if (onLog) onLog(`Connecting to Shopify Store catalog at ${origin}...`);

  while (products.length < maxProducts) {
    const currentLimit = Math.min(pageSize, maxProducts - products.length);
    const pageUrl = `${endpoint}?limit=${currentLimit}&page=${page}`;

    if (onLog) onLog(`Fetching page ${page} from ${pageUrl}...`);

    try {
      const res = await axios.get(pageUrl, {
        headers: DEFAULT_HEADERS,
        timeout: 10000
      });

      const batch = res.data && res.data.products;
      if (!batch || !Array.isArray(batch) || batch.length === 0) {
        if (onLog) onLog(`Reached end of catalog (Total items: ${products.length}).`);
        break;
      }

      for (const item of batch) {
        products.push(normalizeShopifyProduct(item, origin));
        if (products.length >= maxProducts) break;
      }

      if (onLog) onLog(`Extracted ${products.length} products so far...`);

      if (batch.length < currentLimit) {
        break; // No more products
      }

      page++;
      // Polite slight delay
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      if (onLog) onLog(`Shopify API page ${page} returned error: ${err.message}. Trying collection fallback...`);
      break;
    }
  }

  return products;
}

module.exports = {
  scrapeShopifyCatalog,
  scrapeShopifySingleProduct,
  normalizeShopifyProduct
};
