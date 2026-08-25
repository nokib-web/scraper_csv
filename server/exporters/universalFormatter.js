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

/**
 * Transforms unified product list into clean Universal CSV format
 * @param {Array} products 
 * @returns {string} CSV string
 */
function exportUniversalCsv(products) {
  const rows = products.map((p, idx) => {
    const images = (p.images || []).map(img => img.src).filter(Boolean);
    const mainVariant = p.variants?.[0] || {};
    return {
      'ID': p.id || String(idx + 1),
      'Title': p.title || '',
      'Price': p.price !== undefined ? p.price.toFixed(2) : '0.00',
      'Regular Price': p.regular_price !== undefined ? p.regular_price.toFixed(2) : (p.price || 0).toFixed(2),
      'Currency': p.currency || 'USD',
      'Brand / Vendor': p.vendor || '',
      'Category': p.product_type || (Array.isArray(p.tags) ? p.tags[0] : 'General'),
      'SKU': mainVariant.sku || `SKU-${idx + 1}`,
      'Stock Status': mainVariant.available !== false ? 'In Stock' : 'Out of Stock',
      'Main Image': images[0] || '',
      'All Images': images.join(' | '),
      'Product URL': p.url || '',
      'Description': (p.description || '').replace(/\r?\n|\r/g, ' ')
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
