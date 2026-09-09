const axios = require('axios');
const { DEFAULT_HEADERS } = require('./detector');

const GUARDIAN_API_BASE = 'https://api.guardianpubs.com/api';

/**
 * Calculates selling price and regular price from Guardian Publications data
 */
function calculateGuardianPrice(item) {
  const salePrice = parseFloat(item.salePrice || item.price || 0) || 0;
  let price = salePrice;
  let regularPrice = salePrice;

  // discountType: 1 = percentage (e.g. 20%), 2 = fixed amount (e.g. 50 BDT)
  if (item.discountType === 1 && item.discountAmount) {
    const disc = parseFloat(item.discountAmount) || 0;
    price = Math.round(salePrice - (salePrice * disc / 100));
  } else if (item.discountType === 2 && item.discountAmount) {
    const disc = parseFloat(item.discountAmount) || 0;
    price = Math.max(0, Math.round(salePrice - disc));
  } else if (item.offerDiscountType === 1 && item.offerDiscountAmount) {
    const disc = parseFloat(item.offerDiscountAmount) || 0;
    price = Math.round(salePrice - (salePrice * disc / 100));
  } else if (item.offerDiscountType === 2 && item.offerDiscountAmount) {
    const disc = parseFloat(item.offerDiscountAmount) || 0;
    price = Math.max(0, Math.round(salePrice - disc));
  }

  return {
    price: price > 0 ? price : salePrice,
    regularPrice: regularPrice >= price ? regularPrice : price
  };
}

/**
 * Strips HTML tags and normalizes description
 */
function cleanDescription(item) {
  let desc = item.shortDescription || item.description || item.seoDescription || '';
  desc = desc.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  if (!desc) {
    const author = Array.isArray(item.author) && item.author.length > 0 ? item.author[0].name : '';
    desc = `${item.name || 'বই'} ${author ? '- ' + author : ''} - প্রকাশিত: Guardian Publications (গার্ডিয়ান পাবলিকেশন্স)`;
  }
  return desc;
}

/**
 * Normalizes a Guardian Publications API book object to universal product schema
 */
function normalizeGuardianBook(item) {
  if (!item) return null;
  const title = item.name || item.nameEn || 'Untitled Book';
  const slug = item.slug || title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/(^-|-$)/g, '');
  const { price, regularPrice } = calculateGuardianPrice(item);

  const authorNames = Array.isArray(item.author) && item.author.length > 0 
    ? item.author.map(a => a.name || a.nameEn).filter(Boolean).join(', ')
    : 'Guardian Publications';

  const categoryName = item.category?.name || item.category?.nameEn || 'Books';

  const tags = new Set();
  if (categoryName) tags.add(categoryName);
  if (authorNames && authorNames !== 'Guardian Publications') tags.add(authorNames);
  if (Array.isArray(item.tags)) {
    item.tags.forEach(t => {
      const tName = typeof t === 'string' ? t : (t.name || t.slug);
      if (tName) tags.add(tName);
    });
  }
  if (item.edition) tags.add(`${item.edition} সংস্করণ`);
  if (item.isPreOrder) tags.add('Pre-Order');

  const images = [];
  const rawImgs = [
    ...(Array.isArray(item.images) ? item.images : (item.images ? [item.images] : [])),
    ...(Array.isArray(item.previewImages) ? item.previewImages : [])
  ];

  rawImgs.forEach((img, idx) => {
    let src = typeof img === 'string' ? img : (img.src || img.url || '');
    if (src) {
      if (src.startsWith('//')) src = `https:${src}`;
      // Strip dynamic size caps to get full high-res original
      src = src.replace(/\?resolution=\d+_\d+/i, '');
      if (!images.some(i => i.src === src)) {
        images.push({
          id: idx + 1,
          src: src,
          alt: title,
          position: idx + 1
        });
      }
    }
  });

  const sku = item.sku || `G-${item.priority || item._id?.substring(18) || Date.now()}`;
  const barcode = item.isbn || '';
  const inStock = item.quantity !== 0;
  const qty = item.quantity !== undefined && item.quantity !== null ? item.quantity : 99;

  return {
    id: String(item._id || sku),
    title: title,
    handle: slug,
    description: cleanDescription(item),
    vendor: authorNames,
    product_type: categoryName,
    tags: Array.from(tags),
    status: item.status === 'publish' || item.status === 'active' || item.status === undefined ? 'active' : 'draft',
    published_at: item.publishedDate || item.createdAt || new Date().toISOString(),
    created_at: item.createdAt || new Date().toISOString(),
    price: price,
    regular_price: regularPrice,
    currency: 'BDT',
    variants: [{
      id: `${item._id || sku}-1`,
      title: item.currentVersion || 'Default Title',
      price: price,
      compare_at_price: regularPrice > price ? regularPrice : null,
      sku: sku,
      barcode: barcode,
      inventory_quantity: qty,
      available: inStock,
      weight: 0
    }],
    images: images,
    options: item.currentVersion ? [{ name: 'Format', values: [item.currentVersion] }] : [],
    url: `https://www.guardianpubs.com/product-details/${slug}`,
    source: 'guardianpubs'
  };
}

/**
 * Scrapes Guardian Publications catalog, category, author, or single product
 */
async function scrapeGuardianCatalog(url, options = {}, onLog = () => {}) {
  const parsed = new URL(url);
  const pathname = parsed.pathname;
  const searchParams = parsed.searchParams;

  // 1. Single Product Detail Page
  if (pathname.includes('/product-details/')) {
    const slugMatch = pathname.match(/\/product-details\/([^\/?#]+)/i);
    const slug = slugMatch ? decodeURIComponent(slugMatch[1]) : '';
    if (slug) {
      onLog(`Fetching single book details for "${slug}" from Guardian API...`);
      try {
        const res = await axios.get(`${GUARDIAN_API_BASE}/product/get-by-slug/${encodeURIComponent(slug)}`, {
          headers: {
            ...DEFAULT_HEADERS,
            'Accept': 'application/json'
          },
          timeout: 10000
        });
        const bookData = res.data?.data || res.data;
        if (bookData && (bookData.name || bookData._id)) {
          const normalized = normalizeGuardianBook(bookData);
          if (normalized) return [normalized];
        }
      } catch (e) {
        onLog(`Failed to fetch by slug: ${e.message}. Falling back to full catalog search...`);
      }
    }
  }

  // 2. Full Catalog or Category / Author filtered query
  onLog(`Connecting to Guardian Publications High-Speed Catalog API...`);

  const projection = {
    select: {
      _id: 1,
      name: 1,
      nameEn: 1,
      slug: 1,
      images: 1,
      costPrice: 1,
      salePrice: 1,
      discountType: 1,
      discountAmount: 1,
      offerDiscountAmount: 1,
      offerDiscountType: 1,
      resetDiscount: 1,
      ratingCount: 1,
      ratingTotal: 1,
      author: 1,
      category: 1,
      tags: 1,
      priority: 1,
      quantity: 1,
      edition: 1,
      isPreOrder: 1,
      sku: 1,
      isbn: 1,
      shortDescription: 1
    },
    sort: { priority: -1 },
    pagination: { pageSize: options.limit || 500, currentPage: 0 }
  };

  // Check category or pre-order filter
  const categoryIdParam = searchParams.get('categoryId');
  const preOrderParam = searchParams.get('preOrder');

  if (categoryIdParam) {
    projection.filter = { "category._id": categoryIdParam };
  } else if (preOrderParam === '1' || preOrderParam === 'true') {
    projection.filter = { isPreOrder: true };
  }

  try {
    const res = await axios.post(`${GUARDIAN_API_BASE}/product/get-all/`, projection, {
      headers: {
        ...DEFAULT_HEADERS,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    const rawList = res.data?.data || [];
    onLog(`Successfully fetched ${rawList.length} book(s) from Guardian Publications API.`);

    const products = rawList.map(normalizeGuardianBook).filter(Boolean);
    return products;
  } catch (err) {
    onLog(`Guardian API Error: ${err.message}. Running fallback request...`);
    // Fallback simple query
    const resFallback = await axios.post(`${GUARDIAN_API_BASE}/product/get-all/`, {
      paginate: { pageSize: 500, currentPage: 1 }
    }, {
      headers: { ...DEFAULT_HEADERS, 'Content-Type': 'application/json' },
      timeout: 15000
    });

    const rawList = resFallback.data?.data || [];
    return rawList.map(normalizeGuardianBook).filter(Boolean);
  }
}

module.exports = {
  scrapeGuardianCatalog,
  normalizeGuardianBook
};
