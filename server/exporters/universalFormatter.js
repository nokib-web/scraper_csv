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

function formatPlainDescription(p) {
  if (p.description && p.description.trim() !== '' && p.description.trim() !== p.title?.trim()) {
    return p.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const brand = p.vendor || 'Official Store';
  const cat = p.product_type || (Array.isArray(p.tags) && p.tags[0]) || 'General';
  const price = p.price ? `${p.currency || 'USD'} ${p.price}` : '';
  return `${p.title} - High quality authentic ${cat} provided by ${brand}. ${price ? `Price: ${price}. ` : ''}100% original product available in stock for immediate order and fast delivery.`;
}

/**
 * Transforms unified product list into clean Universal CSV format
 * @param {Array} products 
 * @returns {string} CSV string
 */
function exportUniversalCsv(products) {
  const rows = products.map((p, idx) => {
    const images = (p.images || []).map(img => typeof img === 'string' ? img : img.src).filter(Boolean);
    const mainVariant = p.variants?.[0] || {};
    
    // Ensure image fallback
    const mainImg = images[0] || (p.image ? (typeof p.image === 'string' ? p.image : p.image.src) : '');
    const allImagesStr = images.length > 0 ? images.join(' | ') : mainImg;

    return {
      'ID': p.id || String(idx + 1),
      'Title': p.title || '',
      'Price': p.price !== undefined ? Number(p.price).toFixed(2) : '0.00',
      'Regular Price': p.regular_price !== undefined ? Number(p.regular_price).toFixed(2) : (p.price || 0).toFixed(2),
      'Currency': p.currency || 'USD',
      'Brand / Vendor': p.vendor || '',
      'Category': p.product_type || (Array.isArray(p.tags) ? p.tags[0] : 'General'),
      'SKU': mainVariant.sku || `SKU-${p.id || idx + 1}`,
      'Stock Status': mainVariant.available !== false ? 'In Stock' : 'Out of Stock',
      'Main Image': mainImg,
      'All Images': allImagesStr,
      'Product URL': p.url || '',
      'Description': formatPlainDescription(p)
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
