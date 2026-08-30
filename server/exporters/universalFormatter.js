const { stringify } = require('csv-stringify/sync');

const UNIVERSAL_HEADERS = [
  'ID',
  'Title',
  'Price',
  'Regular Price',
  'Currency',
  'Brand / Vendor',
  'Category',
  'SKU',
  'Stock Status',
  'Main Image',
  'All Images',
  'Product URL',
  'Description'
];

function formatPlainDescription(p, customBrand) {
  if (p.description && p.description.trim() !== '' && p.description.trim() !== p.title?.trim()) {
    return p.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const brand = customBrand || p.vendor || 'Official Store';
  const cat = p.product_type || (Array.isArray(p.tags) && p.tags[0]) || 'General';
  const price = p.price ? `${p.currency || 'USD'} ${p.price}` : '';
  return `${p.title} - High quality authentic ${cat} provided by ${brand}. ${price ? `Price: ${price}. ` : ''}100% original product available in stock for immediate order and fast delivery.`;
}

function sanitizeImageUrl(src) {
  if (!src || typeof src !== 'string') return '';
  let s = src.trim();
  if (s.startsWith('//')) s = `https:${s}`;
  if (!s.startsWith('http://') && !s.startsWith('https://')) return '';
  try {
    return encodeURI(decodeURI(s));
  } catch (e) {
    return encodeURI(s);
  }
}

function applyPriceMarkup(price, markup) {
  if (price === undefined || price === null || price === '' || isNaN(Number(price))) return price;
  const num = Number(price);
  if (!markup || markup.type === 'none' || !markup.value) return num;
  if (markup.type === 'percent') {
    return Number((num * (1 + Number(markup.value) / 100)).toFixed(2));
  }
  if (markup.type === 'fixed') {
    return Number((num + Number(markup.value)).toFixed(2));
  }
  return num;
}

/**
 * Transforms unified product list into clean Universal CSV format
 * @param {Array} products 
 * @param {Object} [options]
 * @param {string} [options.customVendor='']
 * @param {number} [options.maxImages=0]
 * @param {Object} [options.priceMarkup]
 * @returns {string} CSV string
 */
function exportUniversalCsv(products, options = {}) {
  const customVendor = options.customVendor && options.customVendor.trim() ? options.customVendor.trim() : null;
  const maxImagesLimit = Number(options.maxImages) > 0 ? Number(options.maxImages) : null;
  const priceMarkup = options.priceMarkup || { type: 'none', value: 0 };

  const rows = products.map((p, idx) => {
    let rawImages = (p.images || []).map(img => typeof img === 'string' ? img : img.src).filter(Boolean);
    if (maxImagesLimit && rawImages.length > maxImagesLimit) {
      rawImages = rawImages.slice(0, maxImagesLimit);
    }
    const images = rawImages.map(img => sanitizeImageUrl(img)).filter(Boolean);
    const mainVariant = p.variants?.[0] || {};
    const effectiveVendor = customVendor || p.vendor || '';

    const markedPrice = applyPriceMarkup(p.price !== undefined ? p.price : 0, priceMarkup);
    const markedRegPrice = p.regular_price ? applyPriceMarkup(p.regular_price, priceMarkup) : markedPrice;
    
    // Ensure image fallback
    const fallbackRaw = p.image ? (typeof p.image === 'string' ? p.image : p.image.src) : '';
    const mainImg = images[0] || sanitizeImageUrl(fallbackRaw);
    const allImagesStr = images.length > 0 ? images.join(' | ') : mainImg;

    return {
      'ID': p.id || String(idx + 1),
      'Title': p.title || '',
      'Price': Number(markedPrice).toFixed(2),
      'Regular Price': Number(markedRegPrice).toFixed(2),
      'Currency': p.currency || 'USD',
      'Brand / Vendor': effectiveVendor,
      'Category': p.product_type || (Array.isArray(p.tags) ? p.tags[0] : 'General'),
      'SKU': mainVariant.sku || `SKU-${p.id || idx + 1}`,
      'Stock Status': mainVariant.available !== false ? 'In Stock' : 'Out of Stock',
      'Main Image': mainImg,
      'All Images': allImagesStr,
      'Product URL': p.url || '',
      'Description': formatPlainDescription({ ...p, price: markedPrice }, customVendor)
    };
  });

  return stringify(rows, {
    header: true,
    columns: UNIVERSAL_HEADERS,
    quoted: true
  });
}

module.exports = {
  exportUniversalCsv,
  UNIVERSAL_HEADERS
};
