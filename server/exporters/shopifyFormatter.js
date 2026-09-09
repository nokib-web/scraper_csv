const { stringify } = require('csv-stringify/sync');
const { resolveShopifyTaxonomy, resolveCustomProductType } = require('./taxonomyHelper');

/**
 * Official Shopify 2024+ Matrix / Standard Product CSV Headers
 * Fully compatible with Shopify Standard Product Taxonomy & Matrix importer.
 */
const SHOPIFY_HEADERS = [
  'Title',
  'URL handle',
  'Description',
  'Vendor',
  'Product category',
  'Type',
  'Tags',
  'Published on online store',
  'Status',
  'SKU',
  'Barcode',
  'Option1 name',
  'Option1 value',
  'Option1 Linked To',
  'Option2 name',
  'Option2 value',
  'Option2 Linked To',
  'Option3 name',
  'Option3 value',
  'Option3 Linked To',
  'Price',
  'Compare-at price',
  'Cost per item',
  'Charge tax',
  'Tax code',
  'Unit price total measure',
  'Unit price total measure unit',
  'Unit price base measure',
  'Unit price base measure unit',
  'Inventory tracker',
  'Inventory quantity',
  'Continue selling when out of stock',
  'Weight value (grams)',
  'Weight unit for display',
  'Requires shipping',
  'Fulfillment service',
  'Product image URL',
  'Image position',
  'Image alt text',
  'Variant image URL',
  'Gift card',
  'SEO title',
  'SEO description',
  'Color (product.metafields.shopify.color-pattern)',
  'Google Shopping / Google product category',
  'Google Shopping / Gender',
  'Google Shopping / Age group',
  'Google Shopping / Manufacturer part number (MPN)',
  'Google Shopping / Ad group name',
  'Google Shopping / Ads labels',
  'Google Shopping / Condition',
  'Google Shopping / Custom product',
  'Google Shopping / Custom label 0',
  'Google Shopping / Custom label 1',
  'Google Shopping / Custom label 2',
  'Google Shopping / Custom label 3',
  'Google Shopping / Custom label 4'
];

const SHOPIFY_INVENTORY_HEADERS = [
  'Handle',
  'Title',
  'Option1 Name',
  'Option1 Value',
  'Option2 Name',
  'Option2 Value',
  'Option3 Name',
  'Option3 Value',
  'SKU',
  'Location',
  'Available'
];

function formatHtmlDescription(p, customBrand, customCat) {
  if (p.description && p.description.trim() !== '' && p.description.trim() !== p.title?.trim() && p.description.includes('<p>')) {
    return p.description.trim();
  }
  const brand = customBrand || p.vendor || 'Store';
  const cat = customCat || p.product_type || p.category || (Array.isArray(p.tags) && p.tags[0]) || 'General';
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
    const parsed = new URL(s);
    if (!parsed.protocol.startsWith('http')) return '';
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
 * @param {string} [options.customCategory='']
 * @param {string} [options.customType='']
 * @param {string} [options.customTemplate='']
 * @param {number} [options.maxImages=0]
 * @param {Object} [options.priceMarkup]
 * @param {string} [options.inventoryPolicy='continue'] - 'continue' | 'deny'
 * @param {string} [options.inventoryTracker='shopify'] - 'shopify' | 'none'
 * @returns {string} CSV string
 */
function exportShopifyCsv(products, options = {}) {
  const defaultStock = options.defaultStock !== undefined && options.defaultStock !== '' && !isNaN(Number(options.defaultStock))
    ? Number(options.defaultStock)
    : 99;
  const customVendor = options.customVendor && options.customVendor.trim() ? options.customVendor.trim() : null;
  const customCategory = options.customCategory && options.customCategory.trim() ? options.customCategory.trim() : null;
  const customType = options.customType && options.customType.trim() ? options.customType.trim() : null;
  const maxImagesLimit = Number(options.maxImages) > 0 ? Number(options.maxImages) : null;
  const priceMarkup = options.priceMarkup || { type: 'none', value: 0 };
  
  // Inventory Policy: 'continue' (default, prevents 0 stock purchase block on new Shopify stores) or 'deny'
  const isUntracked = options.inventoryPolicy === 'untracked' || options.inventoryTracker === 'none' || options.inventoryTracker === '';
  const effectiveTracker = isUntracked ? '' : 'shopify';
  const effectivePolicy = options.inventoryPolicy === 'deny' ? 'DENY' : 'CONTINUE';

  const rows = [];

  for (const p of products) {
    const handle = p.handle || (p.title ? p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `prod-${Date.now()}`);
    const tags = Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || '');
    const effectiveVendor = customVendor || p.vendor || '';

    // Smart Shopify Taxonomy Resolution:
    // Only outputs valid Shopify Standard Product Taxonomy paths (or '' if unmapped to prevent import error)
    const standardizedTaxonomy = resolveShopifyTaxonomy(
      customCategory || p.product_category || p.category || '',
      customType || p.product_type || p.type || '',
      p.title || '',
      p.tags || []
    );

    // Custom Product Type (merchant-defined)
    const effectiveType = resolveCustomProductType(
      customType,
      p.product_type || p.type || '',
      customCategory || p.category || '',
      ''
    );

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
      const vQty = v.inventory_quantity !== undefined && v.inventory_quantity !== null && v.inventory_quantity !== '' && !isNaN(Number(v.inventory_quantity))
        ? Number(v.inventory_quantity)
        : defaultStock;

      return {
        ...v,
        price: vPrice,
        compare_at_price: vCompare,
        inventory_quantity: vQty
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
    const bodyHtml = formatHtmlDescription({ ...p, price: markedPrice }, customVendor, customCategory);

    const cleanOptName = (name, fallback) => {
      if (!name) return fallback;
      const clean = String(name).replace(/[\/\\|]+/g, ' ').replace(/\s+/g, ' ').trim();
      return clean || fallback;
    };

    const hasOptions = p.options && Array.isArray(p.options) && p.options.length > 0;
    const opt1Name = hasOptions ? cleanOptName(p.options[0]?.name || p.options[0], 'Title') : (variants.some(v => v && v.option1 && v.option1 !== 'Default Title') ? 'Size' : 'Title');
    const opt2Name = hasOptions && p.options[1] ? cleanOptName(p.options[1]?.name || p.options[1], 'Color') : (variants.some(v => v && v.option2) ? 'Color' : '');
    const opt3Name = hasOptions && p.options[2] ? cleanOptName(p.options[2]?.name || p.options[2], 'Style') : (variants.some(v => v && v.option3) ? 'Style' : '');

    // Extract color patterns for metafield
    const colorsList = variants
      .map(v => {
        if (opt2Name.toLowerCase().includes('color') && v.option2) return v.option2;
        if (opt1Name.toLowerCase().includes('color') && v.option1) return v.option1;
        return null;
      })
      .filter(Boolean);
    const uniqueColors = Array.from(new Set(colorsList)).join('; ');

    // Normalize product status
    let normalizedStatus = 'Active';
    if (p.status) {
      const st = String(p.status).toLowerCase();
      if (st === 'draft') normalizedStatus = 'Draft';
      else if (st === 'archived') normalizedStatus = 'Archived';
      else normalizedStatus = 'Active';
    }

    const isDigital = Boolean(p.is_digital || p.type === 'Digital book' || effectiveType.toLowerCase().includes('digital') || p.requires_shipping === false);

    for (let i = 0; i < maxRows; i++) {
      const isFirstRow = i === 0;
      const v = variants[i] || null;
      const img = images[i] || null;

      let variantQty = '';
      if (v) {
        if (isUntracked) {
          variantQty = '';
        } else {
          variantQty = v.inventory_quantity !== undefined && v.inventory_quantity !== null && v.inventory_quantity !== '' && !isNaN(Number(v.inventory_quantity))
            ? String(v.inventory_quantity)
            : String(defaultStock);
        }
      }

      const variantGrams = v 
        ? (v.weight ? Math.round(Number(v.weight) * 1000) : (v.grams ? Math.round(Number(v.grams)) : 0))
        : '';

      const row = {
        'Title': isFirstRow ? p.title : '',
        'URL handle': handle,
        'Description': isFirstRow ? bodyHtml : '',
        'Vendor': isFirstRow ? effectiveVendor : '',
        'Product category': isFirstRow ? standardizedTaxonomy : '',
        'Type': isFirstRow ? effectiveType : '',
        'Tags': isFirstRow ? tags : '',
        'Published on online store': isFirstRow ? 'TRUE' : '',
        'Status': isFirstRow ? normalizedStatus : '',
        'SKU': v ? (v.sku || `SKU-${handle}`) : '',
        'Barcode': v ? (v.barcode || '') : '',
        'Option1 name': isFirstRow ? opt1Name : '',
        'Option1 value': v ? (v.option1 || v.title || 'Default Title') : '',
        'Option1 Linked To': isFirstRow && opt1Name.toLowerCase().includes('color') ? 'product.metafields.shopify.color-pattern' : '',
        'Option2 name': isFirstRow && (opt2Name || (v && v.option2)) ? (opt2Name || 'Color') : '',
        'Option2 value': v ? (v.option2 || '') : '',
        'Option2 Linked To': isFirstRow && opt2Name.toLowerCase().includes('color') ? 'product.metafields.shopify.color-pattern' : '',
        'Option3 name': isFirstRow && (opt3Name || (v && v.option3)) ? (opt3Name || 'Style') : '',
        'Option3 value': v ? (v.option3 || '') : '',
        'Option3 Linked To': '',
        'Price': v ? (v.price !== undefined ? Number(v.price).toFixed(2) : Number(markedPrice).toFixed(2)) : '',
        'Compare-at price': v && v.compare_at_price ? Number(v.compare_at_price).toFixed(2) : '',
        'Cost per item': v && v.cost_per_item ? Number(v.cost_per_item).toFixed(2) : '',
        'Charge tax': v ? 'TRUE' : '',
        'Tax code': '',
        'Unit price total measure': '',
        'Unit price total measure unit': '',
        'Unit price base measure': '',
        'Unit price base measure unit': '',
        'Inventory tracker': v ? effectiveTracker : '',
        'Inventory quantity': variantQty,
        'Continue selling when out of stock': v ? effectivePolicy : '',
        'Weight value (grams)': variantGrams !== '' ? variantGrams : '',
        'Weight unit for display': v ? 'g' : '',
        'Requires shipping': v ? (isDigital ? 'FALSE' : 'TRUE') : '',
        'Fulfillment service': v ? (isDigital ? 'manual' : 'manual') : '',
        'Product image URL': img ? img.src : '',
        'Image position': img ? img.position : '',
        'Image alt text': img ? (img.alt || p.title) : '',
        'Variant image URL': v && isFirstRow && img ? img.src : (v && v.image ? v.image : ''),
        'Gift card': isFirstRow ? 'FALSE' : '',
        'SEO title': isFirstRow ? (p.seo_title || p.title || '') : '',
        'SEO description': isFirstRow ? (p.seo_description || bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 160)) : '',
        'Color (product.metafields.shopify.color-pattern)': isFirstRow ? uniqueColors : '',
        'Google Shopping / Google product category': isFirstRow ? standardizedTaxonomy : '',
        'Google Shopping / Gender': isFirstRow ? (p.gender || (tags.toLowerCase().includes('women') ? 'Female' : (tags.toLowerCase().includes('men') ? 'Male' : (tags.toLowerCase().includes('unisex') ? 'Unisex' : '')))) : '',
        'Google Shopping / Age group': isFirstRow ? (p.age_group || (tags.toLowerCase().includes('baby') || tags.toLowerCase().includes('infant') ? 'Infant' : (tags.toLowerCase().includes('kids') ? 'Kids' : 'Adult (13+ years old)'))) : '',
        'Google Shopping / Manufacturer part number (MPN)': v ? (v.mpn || v.sku || '') : '',
        'Google Shopping / Ad group name': '',
        'Google Shopping / Ads labels': isFirstRow && tags ? tags.split(',')[0]?.trim() : '',
        'Google Shopping / Condition': isFirstRow ? 'New' : '',
        'Google Shopping / Custom product': isFirstRow ? 'FALSE' : '',
        'Google Shopping / Custom label 0': isFirstRow && tags.toLowerCase().includes('best-seller') ? 'Top Seller' : '',
        'Google Shopping / Custom label 1': '',
        'Google Shopping / Custom label 2': '',
        'Google Shopping / Custom label 3': '',
        'Google Shopping / Custom label 4': ''
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

/**
 * Transforms unified product list into official Shopify Inventory CSV format
 * Used in Shopify Admin > Products > Inventory > Import to set exact stock quantities per location.
 * @param {Array} products 
 * @param {Object} [options]
 * @param {number|string} [options.defaultStock=99]
 * @param {string} [options.locationName='Location']
 * @returns {string} CSV string
 */
function exportShopifyInventoryCsv(products, options = {}) {
  const defaultStock = options.defaultStock !== undefined && options.defaultStock !== '' && !isNaN(Number(options.defaultStock))
    ? Number(options.defaultStock)
    : 99;
  const locationName = (options.locationName && options.locationName.trim()) || 'Location';
  const rows = [];

  for (const p of products) {
    const handle = p.handle || (p.title ? p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `prod-${Date.now()}`);
    const rawVariants = p.variants && p.variants.length > 0 ? p.variants : [{
      id: '1',
      title: 'Default Title',
      sku: `SKU-${handle}`,
      inventory_quantity: defaultStock,
      option1: null
    }];

    const cleanOptName = (name, fallback) => {
      if (!name) return fallback;
      const clean = String(name).replace(/[\/\\|]+/g, ' ').replace(/\s+/g, ' ').trim();
      return clean || fallback;
    };

    const hasOptions = p.options && Array.isArray(p.options) && p.options.length > 0;
    const opt1Name = hasOptions ? cleanOptName(p.options[0]?.name || p.options[0], 'Title') : 'Title';
    const opt2Name = hasOptions && p.options[1] ? cleanOptName(p.options[1]?.name || p.options[1], 'Color') : (rawVariants.some(v => v && v.option2) ? 'Color' : '');
    const opt3Name = hasOptions && p.options[2] ? cleanOptName(p.options[2]?.name || p.options[2], 'Style') : (rawVariants.some(v => v && v.option3) ? 'Style' : '');

    for (let i = 0; i < rawVariants.length; i++) {
      const v = rawVariants[i];
      const stockQty = v.inventory_quantity !== undefined && v.inventory_quantity !== null && v.inventory_quantity !== '' && !isNaN(Number(v.inventory_quantity))
        ? Number(v.inventory_quantity)
        : defaultStock;

      const row = {
        'Handle': handle,
        'Title': p.title || '',
        'Option1 Name': opt1Name,
        'Option1 Value': v.option1 || v.title || 'Default Title',
        'Option2 Name': opt2Name || (v.option2 ? 'Color' : ''),
        'Option2 Value': v.option2 || '',
        'Option3 Name': opt3Name || (v.option3 ? 'Style' : ''),
        'Option3 Value': v.option3 || '',
        'SKU': v.sku || `SKU-${handle}`,
        'Location': locationName,
        'Available': stockQty
      };

      rows.push(row);
    }
  }

  return stringify(rows, {
    header: true,
    columns: SHOPIFY_INVENTORY_HEADERS,
    quoted: true
  });
}

module.exports = {
  exportShopifyCsv,
  exportShopifyInventoryCsv,
  SHOPIFY_HEADERS,
  SHOPIFY_INVENTORY_HEADERS
};
