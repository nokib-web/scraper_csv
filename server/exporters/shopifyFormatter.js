const { stringify } = require('csv-stringify/sync');

const SHOPIFY_HEADERS = [
  'Handle',
  'Title',
  'Body (HTML)',
  'Vendor',
  'Product Category',
  'Type',
  'Tags',
  'Published',
  'Option1 Name',
  'Option1 Value',
  'Option2 Name',
  'Option2 Value',
  'Option3 Name',
  'Option3 Value',
  'Variant SKU',
  'Variant Grams',
  'Variant Inventory Tracker',
  'Variant Inventory Qty',
  'Variant Inventory Policy',
  'Variant Fulfillment Service',
  'Variant Price',
  'Variant Compare At Price',
  'Variant Requires Shipping',
  'Variant Taxable',
  'Variant Barcode',
  'Image Src',
  'Image Position',
  'Image Alt Text',
  'Gift Card',
  'SEO Title',
  'SEO Description',
  'Variant Image',
  'Variant Weight Unit',
  'Cost per item',
  'Status'
];

/**
 * Transforms unified product list into official Shopify Product CSV format
 * @param {Array} products 
 * @returns {string} CSV string
 */
function exportShopifyCsv(products) {
  const rows = [];

  for (const p of products) {
    const handle = p.handle || (p.title ? p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'product');
    const tags = Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || '');
    const variants = p.variants && p.variants.length > 0 ? p.variants : [{
      id: '1',
      title: 'Default Title',
      price: p.price || 0,
      compare_at_price: p.regular_price > p.price ? p.regular_price : '',
      sku: `SKU-${handle}`,
      inventory_quantity: 99,
      option1: null
    }];
    const images = p.images && p.images.length > 0 ? p.images : [];

    const maxRows = Math.max(variants.length, images.length, 1);

    for (let i = 0; i < maxRows; i++) {
      const isFirstRow = i === 0;
      const v = variants[i] || null;
      const img = images[i] || null;

      const row = {
        'Handle': handle,
        'Title': isFirstRow ? p.title : '',
        'Body (HTML)': isFirstRow ? p.description : '',
        'Vendor': isFirstRow ? (p.vendor || '') : '',
        'Product Category': isFirstRow ? (p.product_type || '') : '',
        'Type': isFirstRow ? (p.product_type || 'General') : '',
        'Tags': isFirstRow ? tags : '',
        'Published': isFirstRow ? 'TRUE' : '',
        'Option1 Name': isFirstRow ? (v && v.option1 ? 'Size / Title' : 'Title') : '',
        'Option1 Value': v ? (v.option1 || v.title || 'Default Title') : '',
        'Option2 Name': isFirstRow && v && v.option2 ? 'Color' : '',
        'Option2 Value': v ? (v.option2 || '') : '',
        'Option3 Name': isFirstRow && v && v.option3 ? 'Style' : '',
        'Option3 Value': v ? (v.option3 || '') : '',
        'Variant SKU': v ? (v.sku || '') : '',
        'Variant Grams': v ? (Math.round((v.weight || 0) * 1000) || 0) : '',
        'Variant Inventory Tracker': v ? 'shopify' : '',
        'Variant Inventory Qty': v ? (v.inventory_quantity !== undefined ? v.inventory_quantity : 99) : '',
        'Variant Inventory Policy': v ? 'deny' : '',
        'Variant Fulfillment Service': v ? 'manual' : '',
        'Variant Price': v ? (v.price !== undefined ? v.price.toFixed(2) : (p.price || 0).toFixed(2)) : '',
        'Variant Compare At Price': v && v.compare_at_price ? Number(v.compare_at_price).toFixed(2) : '',
        'Variant Requires Shipping': v ? 'TRUE' : '',
        'Variant Taxable': v ? 'TRUE' : '',
        'Variant Barcode': v ? (v.barcode || '') : '',
        'Image Src': img ? img.src : '',
        'Image Position': img ? (img.position || (i + 1)) : '',
        'Image Alt Text': img ? (img.alt || p.title) : '',
        'Gift Card': isFirstRow ? 'FALSE' : '',
        'SEO Title': isFirstRow ? p.title : '',
        'SEO Description': isFirstRow ? (p.description ? p.description.replace(/<[^>]+>/g, '').slice(0, 160) : '') : '',
        'Variant Image': '',
        'Variant Weight Unit': v ? 'kg' : '',
        'Cost per item': '',
        'Status': isFirstRow ? 'active' : ''
      };

      rows.push(row);
    }
  }

  return stringify(rows, {
    header: true,
    columns: SHOPIFY_HEADERS,
    quoted: true
  });
}

module.exports = {
  exportShopifyCsv,
  SHOPIFY_HEADERS
};
