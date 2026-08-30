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

function formatHtmlDescription(p, customBrand) {
  if (p.description && p.description.trim() !== '' && p.description.trim() !== p.title?.trim() && p.description.includes('<p>')) {
    return p.description.trim();
  }
  const brand = customBrand || p.vendor || 'Store';
  const cat = p.product_type || (Array.isArray(p.tags) && p.tags[0]) || 'General';
  const price = p.price ? `${p.currency || 'USD'} ${p.price}` : '';

  if (p.description && p.description.trim() !== '' && p.description.trim() !== p.title?.trim()) {
    return `<p>${p.description.trim()}</p><ul><li><strong>Category:</strong> ${cat}</li><li><strong>Brand:</strong> ${brand}</li>${price ? `<li><strong>Price:</strong> ${price}</li>` : ''}<li><strong>Condition:</strong> Brand New & Original</li><li><strong>Availability:</strong> In Stock</li></ul>`;
  }

  return `<p><strong>${p.title}</strong> is a premium quality ${cat} item from <strong>${brand}</strong>.</p><ul><li><strong>Category:</strong> ${cat}</li><li><strong>Brand:</strong> ${brand}</li>${price ? `<li><strong>Price:</strong> ${price}</li>` : ''}<li><strong>Condition:</strong> 100% Authentic & Original</li><li><strong>Availability:</strong> In Stock & Ready for Shipping</li></ul><p>Buy online with confidence for fast doorstep delivery and top-tier support.</p>`;
}

function sanitizeImageUrl(src) {
  if (!src || typeof src !== 'string') return '';
  let s = src.trim();
  if (s.startsWith('//')) s = `https:${s}`;
  if (!s.startsWith('http://') && !s.startsWith('https://')) return '';
  
  try {
    // Encode Unicode/Bangla characters so Shopify image downloader can fetch them properly
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
 * Transforms unified product list into official Shopify Product CSV format
 * @param {Array} products 
 * @param {Object} [options]
 * @param {number|string} [options.defaultStock=99]
 * @param {string} [options.customVendor='']
 * @param {number} [options.maxImages=0]
 * @param {Object} [options.priceMarkup]
 * @returns {string} CSV string
 */
function exportShopifyCsv(products, options = {}) {
  const defaultStock = options.defaultStock !== undefined && options.defaultStock !== '' && !isNaN(Number(options.defaultStock))
    ? Number(options.defaultStock)
    : 99;
  const customVendor = options.customVendor && options.customVendor.trim() ? options.customVendor.trim() : null;
  const maxImagesLimit = Number(options.maxImages) > 0 ? Number(options.maxImages) : null;
  const priceMarkup = options.priceMarkup || { type: 'none', value: 0 };
  const rows = [];

  for (const p of products) {
    const handle = p.handle || (p.title ? p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `prod-${Date.now()}`);
    const tags = Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || '');
    const effectiveVendor = customVendor || p.vendor || '';
    const markedPrice = applyPriceMarkup(p.price || 0, priceMarkup);
    const markedRegPrice = p.regular_price ? applyPriceMarkup(p.regular_price, priceMarkup) : '';

    const rawVariants = p.variants && p.variants.length > 0 ? p.variants : [{
      id: '1',
      title: 'Default Title',
      price: markedPrice,
      compare_at_price: markedRegPrice > markedPrice ? markedRegPrice : '',
      sku: `SKU-${handle}`,
      inventory_quantity: defaultStock,
      option1: null
    }];

    const variants = rawVariants.map(v => {
      const vPrice = applyPriceMarkup(v.price !== undefined ? v.price : p.price || 0, priceMarkup);
      const vCompare = v.compare_at_price ? applyPriceMarkup(v.compare_at_price, priceMarkup) : (markedRegPrice > vPrice ? markedRegPrice : '');
      return {
        ...v,
        price: vPrice,
        compare_at_price: vCompare
      };
    });
    
    let rawImages = p.images && p.images.length > 0 ? p.images : (p.image ? [{ src: typeof p.image === 'string' ? p.image : p.image.src, alt: p.title }] : []);
    if (maxImagesLimit && rawImages.length > maxImagesLimit) {
      rawImages = rawImages.slice(0, maxImagesLimit);
    }

    const images = rawImages.map((img, idx) => {
      const srcUrl = sanitizeImageUrl(typeof img === 'string' ? img : img.src);
      return {
        src: srcUrl,
        alt: (typeof img === 'object' && img.alt) || p.title,
        position: idx + 1
      };
    }).filter(i => Boolean(i.src));

    const maxRows = Math.max(variants.length, images.length, 1);
    const bodyHtml = formatHtmlDescription({ ...p, price: markedPrice }, customVendor);

    const cleanOptName = (name, fallback) => {
      if (!name) return fallback;
      const clean = String(name).replace(/[\/\\|]+/g, ' ').replace(/\s+/g, ' ').trim();
      return clean || fallback;
    };

    const hasOptions = p.options && Array.isArray(p.options) && p.options.length > 0;
    const opt1Name = hasOptions ? cleanOptName(p.options[0]?.name || p.options[0], 'Title') : 'Title';
    const opt2Name = hasOptions && p.options[1] ? cleanOptName(p.options[1]?.name || p.options[1], 'Color') : (variants.some(v => v && v.option2) ? 'Color' : '');
    const opt3Name = hasOptions && p.options[2] ? cleanOptName(p.options[2]?.name || p.options[2], 'Style') : (variants.some(v => v && v.option3) ? 'Style' : '');

    for (let i = 0; i < maxRows; i++) {
      const isFirstRow = i === 0;
      const v = variants[i] || null;
      const img = images[i] || null;

      let variantQty = '';
      if (v) {
        if (v.inventory_quantity !== undefined && v.inventory_quantity !== null && v.inventory_quantity !== 99) {
          variantQty = v.inventory_quantity;
        } else {
          variantQty = defaultStock;
        }
      }

      const row = {
        'Handle': handle,
        'Title': isFirstRow ? p.title : '',
        'Body (HTML)': isFirstRow ? bodyHtml : '',
        'Vendor': isFirstRow ? effectiveVendor : '',
        'Product Category': '',
        'Type': isFirstRow ? (p.product_type || '') : '',
        'Tags': isFirstRow ? tags : '',
        'Published': isFirstRow ? 'TRUE' : '',
        'Option1 Name': isFirstRow ? opt1Name : '',
        'Option1 Value': v ? (v.option1 || v.title || 'Default Title') : '',
        'Option2 Name': isFirstRow && (opt2Name || (v && v.option2)) ? (opt2Name || 'Color') : '',
        'Option2 Value': v ? (v.option2 || '') : '',
        'Option3 Name': isFirstRow && (opt3Name || (v && v.option3)) ? (opt3Name || 'Style') : '',
        'Option3 Value': v ? (v.option3 || '') : '',
        'Variant SKU': v ? (v.sku || `SKU-${handle}`) : '',
        'Variant Grams': v ? (Math.round((v.weight || 0) * 1000) || 0) : '',
        'Variant Inventory Tracker': v ? 'shopify' : '',
        'Variant Inventory Qty': variantQty,
        'Variant Inventory Policy': v ? 'deny' : '',
        'Variant Fulfillment Service': v ? 'manual' : '',
        'Variant Price': v ? (v.price !== undefined ? Number(v.price).toFixed(2) : Number(markedPrice).toFixed(2)) : '',
        'Variant Compare At Price': v && v.compare_at_price ? Number(v.compare_at_price).toFixed(2) : '',
        'Variant Requires Shipping': v ? 'TRUE' : '',
        'Variant Taxable': v ? 'TRUE' : '',
        'Variant Barcode': v ? (v.barcode || '') : '',
        'Image Src': img ? img.src : '',
        'Image Position': img ? img.position : '',
        'Image Alt Text': img ? (img.alt || p.title) : '',
        'Gift Card': isFirstRow ? 'FALSE' : '',
        'SEO Title': isFirstRow ? p.title : '',
        'SEO Description': isFirstRow ? bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 160) : '',
        'Variant Image': v && isFirstRow && img ? img.src : '',
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
