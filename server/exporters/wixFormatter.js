const { stringify } = require('csv-stringify/sync');

/**
 * Official Wix Store Product CSV Headers (Multi-row Variation & Simple Catalog standard)
 */
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
  'cost',
  'productOptionName1',
  'productOptionType1',
  'productOptionDescription1',
  'productOptionName2',
  'productOptionType2',
  'productOptionDescription2',
  'productOptionName3',
  'productOptionType3',
  'productOptionDescription3',
  'additionalInfoTitle1',
  'additionalInfoDescription1',
  'brand'
];

function formatWixDescription(p, customBrand, customCat) {
  if (p.description && p.description.trim() !== '' && p.description.trim() !== p.title?.trim()) {
    return p.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const brand = customBrand || p.vendor || 'Store';
  const cat = customCat || p.product_type || p.category || (Array.isArray(p.tags) && p.tags[0]) || 'General';
  return `${p.title} - High quality ${cat} by ${brand}. Genuine item in stock for fast delivery.`;
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
 * Transforms unified product list into official Wix Store CSV format (supporting multi-row variations and options)
 * @param {Array} products 
 * @param {Object} [options]
 * @param {number|string} [options.defaultStock=99]
 * @param {string} [options.customVendor='']
 * @param {string} [options.customCategory='']
 * @param {number} [options.maxImages=0]
 * @param {Object} [options.priceMarkup]
 * @param {string} [options.inventoryPolicy='continue']
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
  const isUntracked = options.inventoryPolicy === 'untracked';

  const rows = [];

  for (let idx = 0; idx < products.length; idx++) {
    const p = products[idx];
    const handle = p.handle || (p.title ? p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `prod-${Date.now()}-${idx + 1}`);
    
    let rawImages = p.images && p.images.length > 0 ? p.images : (p.image ? [{ src: typeof p.image === 'string' ? p.image : p.image.src }] : []);
    if (maxImagesLimit && rawImages.length > maxImagesLimit) {
      rawImages = rawImages.slice(0, maxImagesLimit);
    }
    const imagesStr = rawImages.map(img => sanitizeImageUrl(typeof img === 'string' ? img : img.src)).filter(Boolean).join(';');
    const collection = customCategory || p.product_type || p.category || (Array.isArray(p.tags) ? p.tags[0] : 'General');
    const effectiveVendor = customVendor || p.vendor || 'Store';

    const markedPrice = applyPriceMarkup(p.price || 0, priceMarkup);
    const markedRegPrice = p.regular_price ? applyPriceMarkup(p.regular_price, priceMarkup) : 0;
    const hasDiscount = markedRegPrice > markedPrice;
    const discountVal = hasDiscount ? Number(markedRegPrice - markedPrice).toFixed(2) : '';

    const cleanOptName = (name, fallback) => {
      if (!name) return fallback;
      const clean = String(name).replace(/[\/\\|]+/g, ' ').replace(/\s+/g, ' ').trim();
      return clean || fallback;
    };

    const hasOptions = p.options && Array.isArray(p.options) && p.options.length > 0;
    const opt1Name = hasOptions ? cleanOptName(p.options[0]?.name || p.options[0], '') : '';
    const opt2Name = hasOptions && p.options[1] ? cleanOptName(p.options[1]?.name || p.options[1], '') : '';
    const opt3Name = hasOptions && p.options[2] ? cleanOptName(p.options[2]?.name || p.options[2], '') : '';

    const rawVariants = p.variants && p.variants.length > 0 ? p.variants : [{
      id: '1',
      title: 'Default Title',
      price: markedPrice,
      compare_at_price: markedRegPrice > markedPrice ? markedRegPrice : '',
      sku: `SKU-${handle}`,
      inventory_quantity: defaultStock,
      option1: null
    }];

    const hasMultipleVariants = rawVariants.length > 1 || (rawVariants[0]?.option1 && rawVariants[0].option1 !== 'Default Title');

    // Extract unique option values for parent definition
    const opt1Values = Array.from(new Set(rawVariants.map(v => v.option1).filter(Boolean))).join(';');
    const opt2Values = Array.from(new Set(rawVariants.map(v => v.option2).filter(Boolean))).join(';');
    const opt3Values = Array.from(new Set(rawVariants.map(v => v.option3).filter(Boolean))).join(';');

    const effectiveOpt1Name = opt1Name || (opt1Values ? 'Size' : '');
    const effectiveOpt2Name = opt2Name || (opt2Values ? 'Color' : '');
    const effectiveOpt3Name = opt3Name || (opt3Values ? 'Style' : '');

    // 1. Parent Product Row
    let totalStock = 0;
    rawVariants.forEach(v => {
      const q = v.inventory_quantity !== undefined && v.inventory_quantity !== null && v.inventory_quantity !== '' && !isNaN(Number(v.inventory_quantity))
        ? Number(v.inventory_quantity)
        : defaultStock;
      totalStock += q;
    });

    const parentRow = {
      'handleId': handle,
      'fieldType': 'Product',
      'name': p.title || '',
      'description': formatWixDescription({ ...p, price: markedPrice }, customVendor, customCategory),
      'productImageUrl': imagesStr,
      'collection': collection,
      'sku': `SKU-${handle}`,
      'ribbon': hasDiscount ? 'SALE' : (Array.isArray(p.tags) && p.tags.includes('Best Seller') ? 'BEST SELLER' : ''),
      'price': markedRegPrice > 0 ? Number(markedRegPrice).toFixed(2) : Number(markedPrice || 0).toFixed(2),
      'surcharges': '',
      'visible': 'true',
      'discountMode': hasDiscount ? 'AMOUNT' : '',
      'discountValue': discountVal,
      'inventory': isUntracked ? 'InStock' : String(totalStock),
      'weight': rawVariants[0]?.weight ? String(rawVariants[0].weight) : '',
      'cost': rawVariants[0]?.cost_per_item ? String(rawVariants[0].cost_per_item) : '',
      'productOptionName1': hasMultipleVariants ? effectiveOpt1Name : '',
      'productOptionType1': hasMultipleVariants && effectiveOpt1Name ? (effectiveOpt1Name.toLowerCase().includes('color') ? 'COLOR' : 'DROP_DOWN') : '',
      'productOptionDescription1': hasMultipleVariants ? opt1Values : '',
      'productOptionName2': hasMultipleVariants ? effectiveOpt2Name : '',
      'productOptionType2': hasMultipleVariants && effectiveOpt2Name ? (effectiveOpt2Name.toLowerCase().includes('color') ? 'COLOR' : 'DROP_DOWN') : '',
      'productOptionDescription2': hasMultipleVariants ? opt2Values : '',
      'productOptionName3': hasMultipleVariants ? effectiveOpt3Name : '',
      'productOptionType3': hasMultipleVariants && effectiveOpt3Name ? 'DROP_DOWN' : '',
      'productOptionDescription3': hasMultipleVariants ? opt3Values : '',
      'additionalInfoTitle1': 'Product Details',
      'additionalInfoDescription1': `${p.title} - Guaranteed 100% genuine & authentic from ${effectiveVendor}.`,
      'brand': effectiveVendor
    };

    rows.push(parentRow);

    // 2. Child Variant Rows (if multiple variants exist)
    if (hasMultipleVariants) {
      for (let vIdx = 0; vIdx < rawVariants.length; vIdx++) {
        const v = rawVariants[vIdx];
        const vPrice = applyPriceMarkup(v.price !== undefined ? v.price : p.price || 0, priceMarkup);
        const vStock = v.inventory_quantity !== undefined && v.inventory_quantity !== null && v.inventory_quantity !== '' && !isNaN(Number(v.inventory_quantity))
          ? Number(v.inventory_quantity)
          : defaultStock;
        
        const priceDiff = vPrice > markedPrice ? Number(vPrice - markedPrice).toFixed(2) : '';

        const variantRow = {
          'handleId': handle,
          'fieldType': 'Variant',
          'name': '',
          'description': '',
          'productImageUrl': v.image ? sanitizeImageUrl(typeof v.image === 'string' ? v.image : v.image.src) : '',
          'collection': '',
          'sku': v.sku || `SKU-${handle}-${vIdx + 1}`,
          'ribbon': '',
          'price': Number(vPrice).toFixed(2),
          'surcharges': priceDiff,
          'visible': 'true',
          'discountMode': '',
          'discountValue': '',
          'inventory': isUntracked ? 'InStock' : String(vStock),
          'weight': v.weight ? String(v.weight) : '',
          'cost': v.cost_per_item ? String(v.cost_per_item) : '',
          'productOptionName1': effectiveOpt1Name || '',
          'productOptionType1': '',
          'productOptionDescription1': v.option1 || '',
          'productOptionName2': effectiveOpt2Name || '',
          'productOptionType2': '',
          'productOptionDescription2': v.option2 || '',
          'productOptionName3': effectiveOpt3Name || '',
          'productOptionType3': '',
          'productOptionDescription3': v.option3 || '',
          'additionalInfoTitle1': '',
          'additionalInfoDescription1': '',
          'brand': ''
        };

        rows.push(variantRow);
      }
    }
  }

  return stringify(rows, {
    header: true,
    columns: WIX_HEADERS,
    quoted: true
  });
}

/**
 * Transforms unified product list into Wix Single-Row Flat CSV format
 */
function exportWixSimpleCsv(products, options = {}) {
  const defaultStock = options.defaultStock !== undefined && options.defaultStock !== '' && !isNaN(Number(options.defaultStock))
    ? Number(options.defaultStock)
    : 99;
  const customVendor = options.customVendor && options.customVendor.trim() ? options.customVendor.trim() : null;
  const customCategory = options.customCategory && options.customCategory.trim() ? options.customCategory.trim() : null;
  const maxImagesLimit = Number(options.maxImages) > 0 ? Number(options.maxImages) : null;
  const priceMarkup = options.priceMarkup || { type: 'none', value: 0 };
  const isUntracked = options.inventoryPolicy === 'untracked';

  const rows = products.map((p, idx) => {
    const handle = p.handle || (p.title ? p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `prod-${Date.now()}-${idx + 1}`);
    let rawImages = p.images && p.images.length > 0 ? p.images : (p.image ? [{ src: typeof p.image === 'string' ? p.image : p.image.src }] : []);
    if (maxImagesLimit && rawImages.length > maxImagesLimit) {
      rawImages = rawImages.slice(0, maxImagesLimit);
    }
    const images = rawImages.map(img => sanitizeImageUrl(typeof img === 'string' ? img : img.src)).filter(Boolean).join(';');
    const collection = customCategory || p.product_type || p.category || (Array.isArray(p.tags) ? p.tags[0] : 'General');
    const mainVariant = p.variants?.[0] || {};
    const effectiveVendor = customVendor || p.vendor || 'Store';
    
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
      'inventory': isUntracked ? 'InStock' : String(stockQty),
      'weight': mainVariant.weight ? String(mainVariant.weight) : '',
      'cost': mainVariant.cost_per_item ? String(mainVariant.cost_per_item) : '',
      'productOptionName1': '',
      'productOptionType1': '',
      'productOptionDescription1': '',
      'productOptionName2': '',
      'productOptionType2': '',
      'productOptionDescription2': '',
      'productOptionName3': '',
      'productOptionType3': '',
      'productOptionDescription3': '',
      'additionalInfoTitle1': 'Product Details',
      'additionalInfoDescription1': `${p.title} - 100% Genuine from ${effectiveVendor}.`,
      'brand': effectiveVendor
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
  exportWixSimpleCsv,
  WIX_HEADERS
};
