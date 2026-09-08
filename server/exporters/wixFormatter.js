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

function formatWixDescription(p, customBrand, customCat) {
  if (p.description && p.description.trim() !== '' && p.description.trim() !== p.title?.trim()) {
    return p.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const brand = customBrand || p.vendor || 'Store';
  const cat = customCat || p.product_type || p.category || (Array.isArray(p.tags) && p.tags[0]) || 'General';
  return `${p.title} - High quality ${cat} by ${brand}. Genuine item in stock for fast delivery.`;
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
 * Transforms unified product list into Wix Store CSV format
 * @param {Array} products 
 * @param {Object} [options]
 * @param {number|string} [options.defaultStock=99]
 * @param {string} [options.customVendor='']
 * @param {string} [options.customCategory='']
 * @param {number} [options.maxImages=0]
 * @param {Object} [options.priceMarkup]
 * @returns {string} CSV string
 */
function exportWixCsv(products, options = {}) {
  const defaultStock = options.defaultStock !== undefined && options.defaultStock !== '' && !isNaN(Number(options.defaultStock))
    ? Number(options.defaultStock)
    : 99;
  const customVendor = options.customVendor && options.customVendor.trim() ? options.customVendor.trim() : null;
  const customCategory = options.customCategory && options.customCategory.trim() ? options.customCategory.trim() : null;
  const maxImagesLimit = Number(options.maxImages) > 0 ? Number(options.maxImages) : null;
  const priceMarkup = options.priceMarkup || { type: 'none', value: 0 };

  const rows = products.map((p, idx) => {
    const handle = p.handle || (p.title ? p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `prod-${Date.now()}`);
    let rawImages = p.images && p.images.length > 0 ? p.images : (p.image ? [{ src: typeof p.image === 'string' ? p.image : p.image.src }] : []);
    if (maxImagesLimit && rawImages.length > maxImagesLimit) {
      rawImages = rawImages.slice(0, maxImagesLimit);
    }
    const images = rawImages.map(img => typeof img === 'string' ? img : img.src).filter(Boolean).join(';');
    const collection = customCategory || p.product_type || p.category || (Array.isArray(p.tags) ? p.tags[0] : 'General');
    const mainVariant = p.variants?.[0] || {};
    
    const markedPrice = applyPriceMarkup(p.price || 0, priceMarkup);
    const markedRegPrice = p.regular_price ? applyPriceMarkup(p.regular_price, priceMarkup) : 0;
    const hasDiscount = markedRegPrice > markedPrice;
    const discountVal = hasDiscount ? Number(markedRegPrice - markedPrice).toFixed(2) : '';

    let stockQty = defaultStock;
    if (mainVariant.inventory_quantity !== undefined && mainVariant.inventory_quantity !== null && mainVariant.inventory_quantity !== '' && !isNaN(Number(mainVariant.inventory_quantity))) {
      stockQty = Number(mainVariant.inventory_quantity);
    }

    return {
      'handleId': handle,
      'fieldType': 'Product',
      'name': p.title || '',
      'description': formatWixDescription({ ...p, price: markedPrice }, customVendor, customCategory),
      'productImageUrl': images,
      'collection': collection,
      'sku': mainVariant.sku || `SKU-${handle}`,
      'ribbon': hasDiscount ? 'SALE' : '',
      'price': markedRegPrice > 0 ? Number(markedRegPrice).toFixed(2) : Number(markedPrice || 0).toFixed(2),
      'surcharges': '',
      'visible': 'true',
      'discountMode': hasDiscount ? 'AMOUNT' : '',
      'discountValue': discountVal,
      'inventory': stockQty,
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
