const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const { DEFAULT_HEADERS } = require('./detector');

const AES_KEY = Buffer.from("b3817f6f8bb8e5ed1c16c4c578f9ed8e", 'utf8');
const IV = Buffer.from(crypto.createHash('sha256').update("").digest('hex').slice(0, 16), 'utf8');

function encryptZatiq(obj) {
  const jsonStr = JSON.stringify(obj);
  const cipher = crypto.createCipheriv('aes-256-cbc', AES_KEY, IV);
  let encrypted = cipher.update(Buffer.from(jsonStr, 'utf8'));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('base64');
}

function decryptZatiq(ciphertextBase64) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', AES_KEY, IV);
  let decrypted = decipher.update(Buffer.from(ciphertextBase64, 'base64'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

/**
 * Normalizes Zatiq inventory product into unified model
 */
function normalizeZatiqProduct(item, origin) {
  const title = item.name || 'Untitled Product';
  const handle = item.slug || title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/(^-|-$)/g, '') || `item-${item.id}`;
  const price = parseFloat(item.price || item.selling_price || 0) || 0;
  const oldPrice = item.old_price ? parseFloat(item.old_price) : null;
  const regularPrice = oldPrice && oldPrice > price ? oldPrice : price;

  const images = (item.images || []).map((img, idx) => {
    let src = typeof img === 'string' ? img : (img.url || img.image_url || img.original_url || '');
    if (src.startsWith('//')) src = `https:${src}`;
    return {
      id: img.id || (idx + 1),
      src: src,
      alt: title,
      position: idx + 1,
      width: 800,
      height: 800
    };
  }).filter(i => Boolean(i.src));

  const categories = (item.categories || []).map(c => c.name || c).filter(Boolean);
  const productType = categories[0] || 'General';

  // Variants
  const variants = [];
  if (Array.isArray(item.variant_types) && item.variant_types.length > 0) {
    item.variant_types.forEach((vt, vIdx) => {
      variants.push({
        id: String(vt.id || `${item.id}-${vIdx}`),
        title: vt.name || vt.title || 'Variant',
        price: parseFloat(vt.price || price),
        compare_at_price: regularPrice > price ? regularPrice : null,
        sku: vt.sku || `SKU-${item.id}-${vIdx + 1}`,
        inventory_quantity: vt.quantity !== undefined && vt.quantity !== null ? vt.quantity : (item.quantity !== null ? item.quantity : 99),
        available: item.is_active !== false,
        option1: vt.name || null,
        weight: vt.weight_kg || item.weight_kg || 0,
        barcode: ''
      });
    });
  }

  if (variants.length === 0) {
    variants.push({
      id: String(item.id),
      title: 'Default Title',
      price: price,
      compare_at_price: regularPrice > price ? regularPrice : null,
      sku: item.sku || `SKU-${item.id}`,
      inventory_quantity: item.quantity !== null && item.quantity !== undefined ? item.quantity : 99,
      available: item.is_active !== false,
      option1: null,
      weight: item.weight_kg || 0,
      barcode: ''
    });
  }

  return {
    id: String(item.id),
    title: title,
    handle: handle,
    description: (item.description || item.details || title).trim(),
    vendor: item.shop_name || origin.replace(/^https?:\/\//, ''),
    product_type: productType,
    tags: categories,
    status: item.is_active ? 'active' : 'draft',
    published_at: item.created_at || new Date().toISOString(),
    created_at: item.created_at || new Date().toISOString(),
    price: price,
    regular_price: regularPrice,
    currency: 'BDT',
    variants: variants,
    images: images,
    options: [],
    url: `${origin}/product/${item.id}`,
    source: 'zatiq'
  };
}

/**
 * Scrapes Zatiq Easy store
 */
async function scrapeZatiqStore(url, options = {}, onLog) {
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;
  const maxProducts = options.limit || 100;

  if (onLog) onLog(`Connecting to Zatiq platform at ${origin}...`);

  // 1. Fetch products page or home page HTML to extract shop_uuid and shopDetails
  let html = '';
  try {
    const res = await axios.get(`${origin}/products`, {
      headers: DEFAULT_HEADERS,
      timeout: 8000
    });
    html = res.data;
  } catch (e) {
    const res = await axios.get(url, {
      headers: DEFAULT_HEADERS,
      timeout: 8000
    });
    html = res.data;
  }

  // Extract shop_uuid or shop ID from HTML / RSC
  let shopUuid = null;
  const shopUuidMatch = html.match(/"shop_uuid":"([^"]+)"/) || html.match(/"shopDetails":\{[^}]*"shop_uuid":"([^"]+)"/);
  if (shopUuidMatch) {
    shopUuid = shopUuidMatch[1];
  } else {
    // Look for UUID pattern
    const uuidMatch = html.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (uuidMatch) shopUuid = uuidMatch[1];
  }

  // Extract shop_id
  let shopId = null;
  const shopIdMatch = html.match(/"id":(\d{5,8})/);
  if (shopIdMatch) shopId = shopIdMatch[1];

  if (onLog) onLog(`Found Zatiq Shop Identity (UUID: ${shopUuid || 'auto'}, ID: ${shopId || 'auto'}).`);

  const identifier = shopUuid || shopId;
  if (!identifier) {
    throw new Error('Could not resolve Zatiq shop identifier from page.');
  }

  const payload = encryptZatiq({ identifier });

  // Query live inventories API
  const endpoints = [
    'https://easybill.zatiq.tech/api/v1/live/inventories',
    `${origin}/api/v1/live/inventories`
  ];

  let rawList = [];

  for (const ep of endpoints) {
    try {
      if (onLog) onLog(`Fetching inventories from ${ep}...`);
      const res = await axios.post(ep, { payload }, {
        headers: {
          'Content-Type': 'application/json',
          'Device-Type': 'Web',
          'Application-Type': 'Online_Shop',
          'Referer': `${origin}/products`,
          'User-Agent': DEFAULT_HEADERS['User-Agent']
        },
        timeout: 10000
      });

      let decryptedData = null;
      if (typeof res.data === 'string') {
        decryptedData = decryptZatiq(res.data);
      } else if (res.data && res.data.payload) {
        decryptedData = decryptZatiq(res.data.payload);
      } else if (res.data && res.data.data) {
        decryptedData = res.data;
      }

      if (decryptedData && Array.isArray(decryptedData.data)) {
        rawList = decryptedData.data;
        if (onLog) onLog(`Successfully extracted ${rawList.length} products from Zatiq API!`);
        break;
      }
    } catch (e) {
      if (onLog) onLog(`API ${ep} failed (${e.message}), trying next...`);
    }
  }

  if (rawList.length === 0) {
    throw new Error('Could not retrieve product list from Zatiq inventory API.');
  }

  const products = rawList.slice(0, maxProducts).map(item => normalizeZatiqProduct(item, origin));
  return products;
}

module.exports = {
  scrapeZatiqStore,
  normalizeZatiqProduct
};
