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

function formatWooDescription(p, customBrand) {
  if (p.description && p.description.trim() !== '' && p.description.trim() !== p.title?.trim() && p.description.includes('<p>')) {
    return p.description.trim();
  }
  const brand = customBrand || p.vendor || 'Store';
  const cat = p.product_type || (Array.isArray(p.tags) && p.tags[0]) || 'General';
  const price = p.price ? `${p.currency || 'USD'} ${p.price}` : '';

  return `<p><strong>${p.title}</strong> is a high-grade ${cat} provided by <strong>${brand}</strong>.</p><ul><li><strong>Category:</strong> ${cat}</li><li><strong>Brand:</strong> ${brand}</li>${price ? `<li><strong>Price:</strong> ${price}</li>` : ''}<li><strong>Condition:</strong> 100% Genuine & Brand New</li><li><strong>In Stock:</strong> Yes</li></ul>`;
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
 * Transforms unified product list into WooCommerce CSV format
 * @param {Array} products 
 * @param {Object} [options]
 * @param {number|string} [options.defaultStock=99]
 * @param {string} [options.customVendor='']
 * @returns {string} CSV string
 */
function exportWooCommerceCsv(products, options = {}) {
  const defaultStock = options.defaultStock !== undefined && options.defaultStock !== '' && !isNaN(Number(options.defaultStock))
    ? Number(options.defaultStock)
    : 99;
  const customVendor = options.customVendor && options.customVendor.trim() ? options.customVendor.trim() : null;

  const rows = products.map((p, idx) => {
    const handle = p.handle || (p.title ? p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `prod-${Date.now()}`);
    const rawImages = p.images && p.images.length > 0 ? p.images : (p.image ? [{ src: typeof p.image === 'string' ? p.image : p.image.src }] : []);
    const images = rawImages.map(img => sanitizeImageUrl(typeof img === 'string' ? img : img.src)).filter(Boolean).join(', ');
    const tags = Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || '');
    const categories = p.product_type || (Array.isArray(p.tags) ? p.tags[0] : 'General');
    const mainVariant = p.variants?.[0] || {};
    const hasDiscount = p.regular_price && p.regular_price > p.price;
    const effectiveVendor = customVendor || p.vendor || 'Store';

    let stockQty = defaultStock;
    if (mainVariant.inventory_quantity !== undefined && mainVariant.inventory_quantity !== null && mainVariant.inventory_quantity !== 99 && mainVariant.inventory_quantity !== '99') {
      stockQty = mainVariant.inventory_quantity;
    }

    return {
      'ID': p.id || String(idx + 1),
      'Type': (p.variants && p.variants.length > 1) ? 'variable' : 'simple',
      'SKU': mainVariant.sku || `SKU-${handle}`,
      'Name': p.title || '',
      'Published': '1',
      'Is featured?': '0',
      'Visibility in catalog': 'visible',
      'Short description': `${p.title} by ${effectiveVendor}. 100% genuine product.`,
      'Description': formatWooDescription(p, customVendor),
      'Date sale price starts': '',
      'Date sale price ends': '',
      'Tax status': 'taxable',
      'Tax class': '',
      'In stock?': mainVariant.available !== false ? '1' : '0',
      'Stock': String(stockQty),
      'Backorders allowed?': '0',
      'Sold individually?': '0',
      'Weight (kg)': mainVariant.weight || '',
      'Length (cm)': '',
      'Width (cm)': '',
      'Height (cm)': '',
      'Allow customer reviews?': '1',
      'Purchase note': '',
      'Sale price': hasDiscount ? Number(p.price).toFixed(2) : '',
      'Regular price': hasDiscount ? Number(p.regular_price).toFixed(2) : Number(p.price || 0).toFixed(2),
      'Categories': categories,
      'Tags': tags,
      'Shipping class': '',
      'Images': images,
      'Download limit': '',
      'Download expiry days': '',
      'Parent': '',
      'Grouped products': '',
      'Upsells': '',
      'Cross-sells': '',
      'External URL': p.url || '',
      'Button text': '',
      'Position': idx
    };
  });

  return stringify(rows, {
    header: true,
    columns: WOO_HEADERS,
    quoted: true
  });
}

module.exports = {
  exportWooCommerceCsv,
  WOO_HEADERS
};
