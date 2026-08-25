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
  'surcharge',
  'visible',
  'discountMode',
  'discountValue',
  'inventory',
  'weight',
  'cost'
];

/**
 * Transforms unified product list into official Wix Product Import CSV format
 * @param {Array} products 
 * @returns {string} CSV string
 */
function exportWixCsv(products) {
  const rows = [];

  for (let idx = 0; idx < products.length; idx++) {
    const p = products[idx];
    const handleId = p.handle || `item-${idx + 1}`;
    const mainVariant = p.variants?.[0] || {};
    const images = p.images || [];
    const mainImage = images[0]?.src || '';
    const cleanDesc = (p.description || '').replace(/\r?\n|\r/g, ' ');

    // Primary Product Row
    rows.push({
      'handleId': handleId,
      'fieldType': 'Product',
      'name': p.title || 'Product',
      'description': cleanDesc,
      'productImageUrl': mainImage,
      'collection': p.product_type || 'Products',
      'sku': mainVariant.sku || `WIX-${idx + 100}`,
      'ribbon': '',
      'price': p.price ? p.price.toFixed(2) : '0.00',
      'surcharge': '',
      'visible': 'true',
      'discountMode': (p.regular_price && p.regular_price > p.price) ? 'AMOUNT' : 'NONE',
      'discountValue': (p.regular_price && p.regular_price > p.price) ? (p.regular_price - p.price).toFixed(2) : '',
      'inventory': mainVariant.inventory_quantity !== undefined ? String(mainVariant.inventory_quantity) : 'InStock',
      'weight': mainVariant.weight ? String(mainVariant.weight) : '',
      'cost': ''
    });

    // Additional image rows
    for (let j = 1; j < images.length; j++) {
      if (images[j]?.src) {
        rows.push({
          'handleId': handleId,
          'fieldType': 'Additional Info',
          'name': '',
          'description': '',
          'productImageUrl': images[j].src,
          'collection': '',
          'sku': '',
          'ribbon': '',
          'price': '',
          'surcharge': '',
          'visible': '',
          'discountMode': '',
          'discountValue': '',
          'inventory': '',
          'weight': '',
          'cost': ''
        });
      }
    }
  }

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
