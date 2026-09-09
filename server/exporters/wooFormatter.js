const { stringify } = require('csv-stringify/sync');

/**
 * Official WooCommerce Product CSV Headers
 * Full support for Variable Products, Variations, Attributes, Tax, and Downloads.
 */
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
  'Position',
  'Attribute 1 name',
  'Attribute 1 value(s)',
  'Attribute 1 visible',
  'Attribute 1 global',
  'Attribute 2 name',
  'Attribute 2 value(s)',
  'Attribute 2 visible',
  'Attribute 2 global',
  'Attribute 3 name',
  'Attribute 3 value(s)',
  'Attribute 3 visible',
  'Attribute 3 global'
];

function formatWooDescription(p, customBrand, customCat) {
  if (p.description && p.description.trim() !== '' && p.description.trim() !== p.title?.trim() && p.description.includes('<p>')) {
    return p.description.trim();
  }
  const brand = customBrand || p.vendor || 'Store';
  const cat = customCat || p.product_type || p.category || (Array.isArray(p.tags) && p.tags[0]) || 'General';
  const price = p.price ? `${p.currency || 'USD'} ${p.price}` : '';

  if (p.description && p.description.trim() !== '' && p.description.trim() !== p.title?.trim()) {
    return `<p>${p.description.trim()}</p><ul><li><strong>Category:</strong> ${cat}</li><li><strong>Brand:</strong> ${brand}</li>${price ? `<li><strong>Price:</strong> ${price}</li>` : ''}<li><strong>Condition:</strong> 100% Genuine & Brand New</li><li><strong>In Stock:</strong> Yes</li></ul>`;
  }

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
 * Transforms unified product list into official WooCommerce CSV format (supporting variable products and child variations)
 * @param {Array} products 
 * @param {Object} [options]
 * @param {number|string} [options.defaultStock=99]
 * @param {string} [options.customVendor='']
 * @param {string} [options.customCategory='']
 * @param {number} [options.maxImages=0]
 * @param {Object} [options.priceMarkup]
 * @returns {string} CSV string
 */
function exportWooCommerceCsv(products, options = {}) {
  const defaultStock = options.defaultStock !== undefined && options.defaultStock !== '' && !isNaN(Number(options.defaultStock))
    ? Number(options.defaultStock)
    : 99;
  const customVendor = options.customVendor && options.customVendor.trim() ? options.customVendor.trim() : null;
  const customCategory = options.customCategory && options.customCategory.trim() ? options.customCategory.trim() : null;
  const maxImagesLimit = Number(options.maxImages) > 0 ? Number(options.maxImages) : null;
  const priceMarkup = options.priceMarkup || { type: 'none', value: 0 };

  const rows = [];
  let rowPosition = 0;

  for (let idx = 0; idx < products.length; idx++) {
    const p = products[idx];
    const handle = p.handle || (p.title ? p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `prod-${Date.now()}-${idx + 1}`);
    const parentSku = `SKU-${handle}`;
    
    let rawImages = p.images && p.images.length > 0 ? p.images : (p.image ? [{ src: typeof p.image === 'string' ? p.image : p.image.src }] : []);
    if (maxImagesLimit && rawImages.length > maxImagesLimit) {
      rawImages = rawImages.slice(0, maxImagesLimit);
    }
    const allImagesStr = rawImages.map(img => sanitizeImageUrl(typeof img === 'string' ? img : img.src)).filter(Boolean).join(', ');
    const tags = Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || '');
    const categories = customCategory || p.product_type || p.category || (Array.isArray(p.tags) ? p.tags[0] : 'General');
    const effectiveVendor = customVendor || p.vendor || 'Store';

    const markedPrice = applyPriceMarkup(p.price || 0, priceMarkup);
    const markedRegPrice = p.regular_price ? applyPriceMarkup(p.regular_price, priceMarkup) : 0;
    const hasDiscount = markedRegPrice > markedPrice;

    const rawVariants = p.variants && p.variants.length > 0 ? p.variants : [{
      id: '1',
      title: 'Default Title',
      price: markedPrice,
      compare_at_price: markedRegPrice > markedPrice ? markedRegPrice : '',
      sku: parentSku,
      inventory_quantity: defaultStock,
      option1: null
    }];

    const hasMultipleVariants = rawVariants.length > 1 || (rawVariants[0]?.option1 && rawVariants[0].option1 !== 'Default Title');

    const cleanOptName = (name, fallback) => {
      if (!name) return fallback;
      const clean = String(name).replace(/[\/\\|]+/g, ' ').replace(/\s+/g, ' ').trim();
      return clean || fallback;
    };

    const hasOptions = p.options && Array.isArray(p.options) && p.options.length > 0;
    const opt1Name = hasOptions ? cleanOptName(p.options[0]?.name || p.options[0], '') : '';
    const opt2Name = hasOptions && p.options[1] ? cleanOptName(p.options[1]?.name || p.options[1], '') : '';
    const opt3Name = hasOptions && p.options[2] ? cleanOptName(p.options[2]?.name || p.options[2], '') : '';

    const opt1Values = Array.from(new Set(rawVariants.map(v => v.option1).filter(Boolean))).join(', ');
    const opt2Values = Array.from(new Set(rawVariants.map(v => v.option2).filter(Boolean))).join(', ');
    const opt3Values = Array.from(new Set(rawVariants.map(v => v.option3).filter(Boolean))).join(', ');

    const effectiveOpt1Name = opt1Name || (opt1Values ? 'Size' : '');
    const effectiveOpt2Name = opt2Name || (opt2Values ? 'Color' : '');
    const effectiveOpt3Name = opt3Name || (opt3Values ? 'Style' : '');

    let totalStock = 0;
    rawVariants.forEach(v => {
      const q = v.inventory_quantity !== undefined && v.inventory_quantity !== null && v.inventory_quantity !== '' && !isNaN(Number(v.inventory_quantity))
        ? Number(v.inventory_quantity)
        : defaultStock;
      totalStock += q;
    });

    if (hasMultipleVariants) {
      // 1. Parent Variable Product Row
      const parentRow = {
        'ID': p.id || String(idx + 1),
        'Type': 'variable',
        'SKU': parentSku,
        'Name': p.title || '',
        'Published': '1',
        'Is featured?': '0',
        'Visibility in catalog': 'visible',
        'Short description': `${p.title} by ${effectiveVendor}. 100% genuine product.`,
        'Description': formatWooDescription({ ...p, price: markedPrice }, customVendor, customCategory),
        'Date sale price starts': '',
        'Date sale price ends': '',
        'Tax status': 'taxable',
        'Tax class': '',
        'In stock?': totalStock > 0 ? '1' : '0',
        'Stock': String(totalStock),
        'Low stock amount': '',
        'Backorders allowed?': '0',
        'Sold individually?': '0',
        'Weight (kg)': rawVariants[0]?.weight ? String(rawVariants[0].weight) : '',
        'Length (cm)': '',
        'Width (cm)': '',
        'Height (cm)': '',
        'Allow customer reviews?': '1',
        'Purchase note': '',
        'Sale price': '',
        'Regular price': '',
        'Categories': categories,
        'Tags': tags,
        'Shipping class': '',
        'Images': allImagesStr,
        'Download limit': '',
        'Download expiry days': '',
        'Parent': '',
        'Grouped products': '',
        'Upsells': '',
        'Cross-sells': '',
        'External URL': p.url || '',
        'Button text': '',
        'Position': String(rowPosition++),
        'Attribute 1 name': effectiveOpt1Name,
        'Attribute 1 value(s)': opt1Values,
        'Attribute 1 visible': effectiveOpt1Name ? '1' : '',
        'Attribute 1 global': effectiveOpt1Name ? '1' : '',
        'Attribute 2 name': effectiveOpt2Name,
        'Attribute 2 value(s)': opt2Values,
        'Attribute 2 visible': effectiveOpt2Name ? '1' : '',
        'Attribute 2 global': effectiveOpt2Name ? '1' : '',
        'Attribute 3 name': effectiveOpt3Name,
        'Attribute 3 value(s)': opt3Values,
        'Attribute 3 visible': effectiveOpt3Name ? '1' : '',
        'Attribute 3 global': effectiveOpt3Name ? '1' : ''
      };

      rows.push(parentRow);

      // 2. Child Variation Rows
      for (let vIdx = 0; vIdx < rawVariants.length; vIdx++) {
        const v = rawVariants[vIdx];
        const vPrice = applyPriceMarkup(v.price !== undefined ? v.price : p.price || 0, priceMarkup);
        const vCompare = v.compare_at_price ? applyPriceMarkup(v.compare_at_price, priceMarkup) : (markedRegPrice > vPrice ? markedRegPrice : 0);
        const vHasDiscount = vCompare > vPrice;
        const vStock = v.inventory_quantity !== undefined && v.inventory_quantity !== null && v.inventory_quantity !== '' && !isNaN(Number(v.inventory_quantity))
          ? Number(v.inventory_quantity)
          : defaultStock;
        const vImage = v.image ? sanitizeImageUrl(typeof v.image === 'string' ? v.image : v.image.src) : '';

        const varTitleParts = [v.option1, v.option2, v.option3].filter(Boolean);
        const varTitle = varTitleParts.length > 0 ? `${p.title} - ${varTitleParts.join(', ')}` : (v.title || 'Variation');

        const variationRow = {
          'ID': '',
          'Type': 'variation',
          'SKU': v.sku || `${parentSku}-${vIdx + 1}`,
          'Name': varTitle,
          'Published': '1',
          'Is featured?': '0',
          'Visibility in catalog': 'visible',
          'Short description': '',
          'Description': '',
          'Date sale price starts': '',
          'Date sale price ends': '',
          'Tax status': 'taxable',
          'Tax class': 'parent',
          'In stock?': vStock > 0 ? '1' : '0',
          'Stock': String(vStock),
          'Low stock amount': '',
          'Backorders allowed?': '0',
          'Sold individually?': '0',
          'Weight (kg)': v.weight ? String(v.weight) : '',
          'Length (cm)': '',
          'Width (cm)': '',
          'Height (cm)': '',
          'Allow customer reviews?': '0',
          'Purchase note': '',
          'Sale price': vHasDiscount ? Number(vPrice).toFixed(2) : '',
          'Regular price': vHasDiscount ? Number(vCompare).toFixed(2) : Number(vPrice).toFixed(2),
          'Categories': '',
          'Tags': '',
          'Shipping class': '',
          'Images': vImage,
          'Download limit': '',
          'Download expiry days': '',
          'Parent': `id:${parentSku}`,
          'Grouped products': '',
          'Upsells': '',
          'Cross-sells': '',
          'External URL': '',
          'Button text': '',
          'Position': String(rowPosition++),
          'Attribute 1 name': effectiveOpt1Name,
          'Attribute 1 value(s)': v.option1 || '',
          'Attribute 1 visible': '',
          'Attribute 1 global': effectiveOpt1Name ? '1' : '',
          'Attribute 2 name': effectiveOpt2Name,
          'Attribute 2 value(s)': v.option2 || '',
          'Attribute 2 visible': '',
          'Attribute 2 global': effectiveOpt2Name ? '1' : '',
          'Attribute 3 name': effectiveOpt3Name,
          'Attribute 3 value(s)': v.option3 || '',
          'Attribute 3 visible': '',
          'Attribute 3 global': effectiveOpt3Name ? '1' : ''
        };

        rows.push(variationRow);
      }
    } else {
      // Simple Product Row
      const mainVariant = rawVariants[0] || {};
      const simpleRow = {
        'ID': p.id || String(idx + 1),
        'Type': 'simple',
        'SKU': mainVariant.sku || parentSku,
        'Name': p.title || '',
        'Published': '1',
        'Is featured?': '0',
        'Visibility in catalog': 'visible',
        'Short description': `${p.title} by ${effectiveVendor}. 100% genuine product.`,
        'Description': formatWooDescription({ ...p, price: markedPrice }, customVendor, customCategory),
        'Date sale price starts': '',
        'Date sale price ends': '',
        'Tax status': 'taxable',
        'Tax class': '',
        'In stock?': (mainVariant.available !== false && totalStock > 0) ? '1' : (totalStock > 0 ? '1' : '0'),
        'Stock': String(totalStock),
        'Low stock amount': '',
        'Backorders allowed?': '0',
        'Sold individually?': '0',
        'Weight (kg)': mainVariant.weight ? String(mainVariant.weight) : '',
        'Length (cm)': '',
        'Width (cm)': '',
        'Height (cm)': '',
        'Allow customer reviews?': '1',
        'Purchase note': '',
        'Sale price': hasDiscount ? Number(markedPrice).toFixed(2) : '',
        'Regular price': hasDiscount ? Number(markedRegPrice).toFixed(2) : Number(markedPrice).toFixed(2),
        'Categories': categories,
        'Tags': tags,
        'Shipping class': '',
        'Images': allImagesStr,
        'Download limit': '',
        'Download expiry days': '',
        'Parent': '',
        'Grouped products': '',
        'Upsells': '',
        'Cross-sells': '',
        'External URL': p.url || '',
        'Button text': '',
        'Position': String(rowPosition++),
        'Attribute 1 name': '',
        'Attribute 1 value(s)': '',
        'Attribute 1 visible': '',
        'Attribute 1 global': '',
        'Attribute 2 name': '',
        'Attribute 2 value(s)': '',
        'Attribute 2 visible': '',
        'Attribute 2 global': '',
        'Attribute 3 name': '',
        'Attribute 3 value(s)': '',
        'Attribute 3 visible': '',
        'Attribute 3 global': ''
      };

      rows.push(simpleRow);
    }
  }

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
