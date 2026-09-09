const { stringify } = require('csv-stringify/sync');

const UNIVERSAL_HEADERS = [
  'ID',
  'Handle',
  'Title',
  'Price',
  'Regular Price',
  'Currency',
  'Brand / Vendor',
  'Category',
  'Product Type',
  'Tags',
  'SKU',
  'Barcode',
  'Stock Status',
  'Stock Qty',
  'Option1 Name',
  'Option1 Value',
  'Option2 Name',
  'Option2 Value',
  'Option3 Name',
  'Option3 Value',
  'Main Image',
  'All Images',
  'Weight (kg)',
  'Product URL',
  'Description'
];

function formatPlainDescription(p, customBrand, customCat) {
  if (p.description && p.description.trim() !== '' && p.description.trim() !== p.title?.trim()) {
    return p.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const brand = customBrand || p.vendor || 'Official Store';
  const cat = customCat || p.product_type || p.category || (Array.isArray(p.tags) && p.tags[0]) || 'General';
  const price = p.price ? `${p.currency || 'USD'} ${p.price}` : '';
  return `${p.title} - High quality authentic ${cat} provided by ${brand}. ${price ? `Price: ${price}. ` : ''}100% original product available in stock for immediate order and fast delivery.`;
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
 * Transforms unified product list into clean Universal CSV format
 * @param {Array} products 
 * @param {Object} [options]
 * @param {number|string} [options.defaultStock=99]
 * @param {string} [options.customVendor='']
 * @param {string} [options.customCategory='']
 * @param {string} [options.customType='']
 * @param {number} [options.maxImages=0]
 * @param {Object} [options.priceMarkup]
 * @returns {string} CSV string
 */
function exportUniversalCsv(products, options = {}) {
  const defaultStock = options.defaultStock !== undefined && options.defaultStock !== '' && !isNaN(Number(options.defaultStock))
    ? Number(options.defaultStock)
    : 99;
  const customVendor = options.customVendor && options.customVendor.trim() ? options.customVendor.trim() : null;
  const customCategory = options.customCategory && options.customCategory.trim() ? options.customCategory.trim() : null;
  const customType = options.customType && options.customType.trim() ? options.customType.trim() : null;
  const maxImagesLimit = Number(options.maxImages) > 0 ? Number(options.maxImages) : null;
  const priceMarkup = options.priceMarkup || { type: 'none', value: 0 };

  const rows = products.map((p, idx) => {
    const handle = p.handle || (p.title ? p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `prod-${Date.now()}-${idx + 1}`);
    let rawImages = (p.images || []).map(img => typeof img === 'string' ? img : img.src).filter(Boolean);
    if (maxImagesLimit && rawImages.length > maxImagesLimit) {
      rawImages = rawImages.slice(0, maxImagesLimit);
    }
    const images = rawImages.map(img => sanitizeImageUrl(img)).filter(Boolean);
    const mainVariant = p.variants?.[0] || {};
    const effectiveVendor = customVendor || p.vendor || '';

    const markedPrice = applyPriceMarkup(p.price !== undefined ? p.price : 0, priceMarkup);
    const markedRegPrice = p.regular_price ? applyPriceMarkup(p.regular_price, priceMarkup) : markedPrice;
    
    // Ensure image fallback
    const fallbackRaw = p.image ? (typeof p.image === 'string' ? p.image : p.image.src) : '';
    const mainImg = images[0] || sanitizeImageUrl(fallbackRaw);
    const allImagesStr = images.length > 0 ? images.join(' | ') : mainImg;

    let stockQty = defaultStock;
    if (mainVariant.inventory_quantity !== undefined && mainVariant.inventory_quantity !== null && mainVariant.inventory_quantity !== '' && !isNaN(Number(mainVariant.inventory_quantity))) {
      stockQty = Number(mainVariant.inventory_quantity);
    }

    const tagsStr = Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || '');

    const cleanOptName = (name) => {
      if (!name) return '';
      return String(name).replace(/[\/\\|]+/g, ' ').replace(/\s+/g, ' ').trim();
    };

    const opt1Name = cleanOptName(p.options?.[0]?.name || p.options?.[0] || (mainVariant.option1 ? 'Size' : ''));
    const opt2Name = cleanOptName(p.options?.[1]?.name || p.options?.[1] || (mainVariant.option2 ? 'Color' : ''));
    const opt3Name = cleanOptName(p.options?.[2]?.name || p.options?.[2] || (mainVariant.option3 ? 'Style' : ''));

    return {
      'ID': p.id || String(idx + 1),
      'Handle': handle,
      'Title': p.title || '',
      'Price': Number(markedPrice).toFixed(2),
      'Regular Price': Number(markedRegPrice).toFixed(2),
      'Currency': p.currency || 'USD',
      'Brand / Vendor': effectiveVendor,
      'Category': customCategory || p.category || p.product_type || (Array.isArray(p.tags) ? p.tags[0] : 'General'),
      'Product Type': customType || p.product_type || p.type || p.category || 'General',
      'Tags': tagsStr,
      'SKU': mainVariant.sku || `SKU-${handle}`,
      'Barcode': mainVariant.barcode || '',
      'Stock Status': (mainVariant.available !== false && stockQty > 0) ? 'In Stock' : (stockQty > 0 ? 'In Stock' : 'Out of Stock'),
      'Stock Qty': stockQty,
      'Option1 Name': opt1Name,
      'Option1 Value': mainVariant.option1 || '',
      'Option2 Name': opt2Name,
      'Option2 Value': mainVariant.option2 || '',
      'Option3 Name': opt3Name,
      'Option3 Value': mainVariant.option3 || '',
      'Main Image': mainImg,
      'All Images': allImagesStr,
      'Weight (kg)': mainVariant.weight ? String(mainVariant.weight) : '',
      'Product URL': p.url || '',
      'Description': formatPlainDescription({ ...p, price: markedPrice }, customVendor, customCategory)
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
