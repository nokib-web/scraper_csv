const { stringify } = require('csv-stringify/sync');

const WIX_HEADERS = [
  'handleId',
  'fieldType',
  'name',
  'description',
  'productImageUrl',
  'collection',
  'sku',
  'ribbon',
  'price',
  'surcharges',
  'visible',
  'discountMode',
  'discountValue',
  'inventory',
  'weight',
  'cost'
];

function formatWixDescription(p) {
  if (p.description && p.description.trim() !== '' && p.description.trim() !== p.title?.trim()) {
    return p.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const brand = p.vendor || 'Store';
  const cat = p.product_type || (Array.isArray(p.tags) && p.tags[0]) || 'General';
  return `${p.title} - High quality ${cat} by ${brand}. Genuine item in stock for fast delivery.`;
}

/**
 * Transforms unified product list into Wix Store CSV format
 * @param {Array} products 
 * @returns {string} CSV string
 */
function exportWixCsv(products) {
  const rows = products.map((p, idx) => {
    const handle = p.handle || (p.title ? p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `prod-${Date.now()}`);
    const rawImages = p.images && p.images.length > 0 ? p.images : (p.image ? [{ src: typeof p.image === 'string' ? p.image : p.image.src }] : []);
    const images = rawImages.map(img => typeof img === 'string' ? img : img.src).filter(Boolean).join(';');
    const collection = p.product_type || (Array.isArray(p.tags) ? p.tags[0] : 'General');
    const mainVariant = p.variants?.[0] || {};
    const hasDiscount = p.regular_price && p.regular_price > p.price;
    const discountVal = hasDiscount ? Number(p.regular_price - p.price).toFixed(2) : '';

    return {
      'handleId': handle,
      'fieldType': 'Product',
      'name': p.title || '',
      'description': formatWixDescription(p),
      'productImageUrl': images,
      'collection': collection,
      'sku': mainVariant.sku || `SKU-${handle}`,
      'ribbon': hasDiscount ? 'SALE' : '',
      'price': p.regular_price !== undefined ? Number(p.regular_price).toFixed(2) : Number(p.price || 0).toFixed(2),
      'surcharges': '',
      'visible': 'true',
      'discountMode': hasDiscount ? 'AMOUNT' : '',
      'discountValue': discountVal,
      'inventory': mainVariant.inventory_quantity !== undefined ? mainVariant.inventory_quantity : 99,
      'weight': mainVariant.weight || '',
      'cost': ''
    };
  });

  return stringify(rows, {
    header: true,
    columns: WIX_HEADERS,
    quoted: true
  });
}

module.exports = {
  exportWixCsv,
  WIX_HEADERS
};
