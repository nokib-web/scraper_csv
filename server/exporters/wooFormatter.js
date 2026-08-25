const { stringify } = require('csv-stringify/sync');

const WOO_HEADERS = [
  'ID',
  'Type',
  'SKU',
  'Name',
  'Published',
  'Is featured?',
  'Visibility in catalog',
  'Short description',
  'Description',
  'Date sale price starts',
  'Date sale price ends',
  'Tax status',
  'Tax class',
  'In stock?',
  'Stock',
  'Low stock amount',
  'Backorders allowed?',
  'Sold individually?',
  'Weight (kg)',
  'Length (cm)',
  'Width (cm)',
  'Height (cm)',
  'Allow customer reviews?',
  'Purchase note',
  'Sale price',
  'Regular price',
  'Categories',
  'Tags',
  'Shipping class',
  'Images',
  'Download limit',
  'Download expiry days',
  'Parent',
  'Grouped products',
  'Upsells',
  'Cross-sells',
  'External URL',
  'Button text',
  'Position'
];

/**
 * Transforms unified product list into official WooCommerce Product Import CSV format
 * @param {Array} products 
 * @returns {string} CSV string
 */
function exportWooCsv(products) {
  const rows = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const imageList = (p.images || []).map(img => img.src).filter(Boolean).join(', ');
    const categories = Array.isArray(p.tags) ? p.tags.join(', ') : (p.product_type || 'General');
    const tags = Array.isArray(p.tags) ? p.tags.join(', ') : '';
    const mainVariant = p.variants?.[0] || {};
    const salePrice = p.price ? p.price.toFixed(2) : '';
    const regularPrice = (p.regular_price && p.regular_price > p.price) ? p.regular_price.toFixed(2) : salePrice;

    const row = {
      'ID': '',
      'Type': (p.variants && p.variants.length > 1) ? 'variable' : 'simple',
      'SKU': mainVariant.sku || `SKU-${i + 1001}`,
      'Name': p.title || 'Product',
      'Published': '1',
      'Is featured?': '0',
      'Visibility in catalog': 'visible',
      'Short description': p.title,
      'Description': p.description || '',
      'Date sale price starts': '',
      'Date sale price ends': '',
      'Tax status': 'taxable',
      'Tax class': '',
      'In stock?': mainVariant.available !== false ? '1' : '0',
      'Stock': mainVariant.inventory_quantity !== undefined ? mainVariant.inventory_quantity : '99',
      'Low stock amount': '2',
      'Backorders allowed?': '0',
      'Sold individually?': '0',
      'Weight (kg)': mainVariant.weight || '',
      'Length (cm)': '',
      'Width (cm)': '',
      'Height (cm)': '',
      'Allow customer reviews?': '1',
      'Purchase note': '',
      'Sale price': (p.regular_price && p.regular_price > p.price) ? salePrice : '',
      'Regular price': regularPrice,
      'Categories': categories,
      'Tags': tags,
      'Shipping class': '',
      'Images': imageList,
      'Download limit': '',
      'Download expiry days': '',
      'Parent': '',
      'Grouped products': '',
      'Upsells': '',
      'Cross-sells': '',
      'External URL': p.url || '',
      'Button text': '',
      'Position': String(i)
    };

    rows.push(row);
  }

  return stringify(rows, {
    header: true,
    columns: WOO_HEADERS,
    quoted: true
  });
}

module.exports = {
  exportWooCsv,
  WOO_HEADERS
};
