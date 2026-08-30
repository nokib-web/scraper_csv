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

/**
 * Transforms unified product list into clean Universal CSV format
 * @param {Array} products 
 * @param {Object} [options]
 * @param {string} [options.customVendor='']
 * @returns {string} CSV string
 */
function exportUniversalCsv(products, options = {}) {
  const customVendor = options.customVendor && options.customVendor.trim() ? options.customVendor.trim() : null;

  const rows = products.map((p, idx) => {
    const rawImages = (p.images || []).map(img => typeof img === 'string' ? img : img.src).filter(Boolean);
    const images = rawImages.map(img => sanitizeImageUrl(img)).filter(Boolean);
    const mainVariant = p.variants?.[0] || {};
    const effectiveVendor = customVendor || p.vendor || '';
    
    // Ensure image fallback
    const fallbackRaw = p.image ? (typeof p.image === 'string' ? p.image : p.image.src) : '';
    const mainImg = images[0] || sanitizeImageUrl(fallbackRaw);
    const allImagesStr = images.length > 0 ? images.join(' | ') : mainImg;

    return {
      'ID': p.id || String(idx + 1),
      'Title': p.title || '',
      'Price': p.price !== undefined ? Number(p.price).toFixed(2) : '0.00',
      'Regular Price': p.regular_price !== undefined ? Number(p.regular_price).toFixed(2) : (p.price || 0).toFixed(2),
      'Currency': p.currency || 'USD',
      'Brand / Vendor': effectiveVendor,
      'Category': p.product_type || (Array.isArray(p.tags) ? p.tags[0] : 'General'),
      'SKU': mainVariant.sku || `SKU-${p.id || idx + 1}`,
      'Stock Status': mainVariant.available !== false ? 'In Stock' : 'Out of Stock',
      'Main Image': mainImg,
      'All Images': allImagesStr,
      'Product URL': p.url || '',
      'Description': formatPlainDescription(p, customVendor)
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
