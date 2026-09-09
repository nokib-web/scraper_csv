const axios = require('axios');
const cheerio = require('cheerio');
const { fetchWithBrowserFallback, DEFAULT_HEADERS } = require('./detector');
const { detectStoreCurrency, normalizeCurrencyCode } = require('./currencyHelper');

/**
 * Converts Bengali numerals (০-৯) to standard English numbers (0-9)
 */
function convertBengaliNumerals(str) {
  if (!str || typeof str !== 'string') return '';
  const bnToEn = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  return str.replace(/[০-৯]/g, d => bnToEn[d] || d);
}

/**
 * Parses complex WooCommerce price strings
 */
function parseWooPriceText(priceText) {
  if (!priceText) return { price: 0, regularPrice: 0 };
  const cleaned = convertBengaliNumerals(priceText).replace(/,/g, '');

  // 1. Check formatted string like "Original price was: 180.00. Current price is: 117.00"
  const currentMatch = cleaned.match(/Current price is:\s*(?:৳|Tk|\$|£|€)?\s*([0-9.]+)/i);
  const origMatch = cleaned.match(/Original price was:\s*(?:৳|Tk|\$|£|€)?\s*([0-9.]+)/i);

  if (currentMatch && currentMatch[1]) {
    const p = parseFloat(currentMatch[1]) || 0;
    const reg = origMatch && origMatch[1] ? parseFloat(origMatch[1]) : p;
    return { price: p, regularPrice: reg >= p ? reg : p };
  }

  // 2. Look for multiple amounts in del / ins tags
  const amounts = [...cleaned.matchAll(/(?:৳|Tk|\$|£|€|₹|Rs\.?|USD|EUR|BDT)?\s*([0-9]+(?:\.[0-9]+)?)/gi)]
    .map(m => parseFloat(m[1]))
    .filter(Boolean);

  if (amounts.length >= 2) {
    const p1 = amounts[0];
    const p2 = amounts[1];
    if (p1 > p2) {
      return { price: p2, regularPrice: p1 };
    }
    return { price: p1, regularPrice: p2 };
  }

  const single = amounts[0] || 0;
  return { price: single, regularPrice: single };
}

/**
 * Cleans WooCommerce image URLs and upscales to original resolution
 */
function cleanWooImage(rawSrc, origin) {
  if (!rawSrc) return '';
  let src = rawSrc.trim();
  if (src.startsWith('//')) src = `https:${src}`;
  else if (src.startsWith('/') && origin) src = `${origin}${src}`;
  
  // Upscale WordPress thumbnail resolutions (e.g. image-300x300.jpg -> image.jpg)
  src = src.replace(/-\d+x\d+\.(jpg|jpeg|png|webp|avif)/i, '.$1');
  return src;
}

/**
 * Normalizes a WooCommerce Store API product into the unified format
 */
function normalizeWooProduct(item, origin, defaultCurrency = 'USD') {
  const images = (item.images || []).map((img, idx) => {
    let rawSrc = typeof img === 'string' ? img : (img.src || img.thumbnail || img.url || '');
    let src = cleanWooImage(rawSrc, origin);
    return {
      id: img.id || (idx + 1),
      src: src,
      alt: img.alt || item.name || '',
      position: idx + 1,
      width: 800,
      height: 800
    };
  }).filter(i => Boolean(i.src));

  // Parse prices
  let price = 0;
  let regularPrice = 0;
  if (item.prices) {
    const rawPrice = item.prices.price || item.prices.regular_price || 0;
    const decimals = item.prices.currency_minor_unit !== undefined ? item.prices.currency_minor_unit : 2;
    price = parseFloat(rawPrice) / Math.pow(10, decimals);
    const rawReg = item.prices.regular_price || rawPrice;
    regularPrice = parseFloat(rawReg) / Math.pow(10, decimals);
  } else {
    price = parseFloat(item.price || item.sale_price || item.regular_price || 0);
    regularPrice = parseFloat(item.regular_price || item.price || 0);
  }

  const variations = (item.variations || []).map((v, idx) => ({
    id: String(v.id || `${item.id}-${idx}`),
    title: v.attributes?.map(a => `${a.name}: ${a.value}`).join(', ') || 'Variant',
    price: v.price ? parseFloat(v.price) : price,
    compare_at_price: v.regular_price ? parseFloat(v.regular_price) : regularPrice,
    sku: v.sku || `${item.sku || 'SKU'}-${idx + 1}`,
    inventory_quantity: 99,
    available: item.is_in_stock !== false,
    option1: v.attributes?.[0]?.value || null,
    option2: v.attributes?.[1]?.value || null,
    option3: v.attributes?.[2]?.value || null,
    weight: 0,
    barcode: ''
  }));

  if (variations.length === 0) {
    variations.push({
      id: `${item.id}-1`,
      title: 'Default Title',
      price: price,
      compare_at_price: regularPrice > price ? regularPrice : null,
      sku: item.sku || `SKU-${item.id}`,
      inventory_quantity: 99,
      available: item.is_in_stock !== false,
      option1: null,
      option2: null,
      option3: null,
      weight: 0,
      barcode: ''
    });
  }

  const cleanDescription = (item.description || item.short_description || '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();

  const categories = (item.categories || []).map(c => c.name || c).filter(Boolean);
  const tags = (item.tags || []).map(t => t.name || t).filter(Boolean);
  const permalink = item.permalink || (item.slug ? `${origin}/product/${item.slug}` : `${origin}/?p=${item.id}`);

  return {
    id: String(item.id || Date.now() + Math.random()),
    title: item.name || item.title || 'WooCommerce Product',
    handle: item.slug || (item.name ? item.name.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/(^-|-$)/g, '') : `woo-${item.id}`),
    description: cleanDescription,
    vendor: origin.replace(/^https?:\/\//, ''),
    product_type: categories[0] || 'General',
    tags: [...tags, ...categories],
    status: 'active',
    published_at: item.date_created || new Date().toISOString(),
    created_at: item.date_created || new Date().toISOString(),
    price: price,
    regular_price: regularPrice,
    currency: normalizeCurrencyCode(item.prices?.currency_code) || normalizeCurrencyCode(item.prices?.currency_symbol) || defaultCurrency || 'USD',
    variants: variations,
    images: images,
    options: item.attributes || [],
    url: permalink,
    source: 'woocommerce'
  };
}

/**
 * Scrapes WooCommerce store using Store API, WP REST API, or Multi-page HTML crawling
 */
async function scrapeWooCommerce(url, options = {}, onLog) {
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;
  const maxProducts = options.limit || 500;
  const products = [];

  // Check if single product page
  const pathname = parsedUrl.pathname.toLowerCase();
  const isSingleProduct = pathname.includes('/product/') || pathname.includes('/item/');

  if (isSingleProduct) {
    if (onLog) onLog(`Scraping WooCommerce single product from ${url}...`);
    return scrapeWooSingleProduct(url, options, onLog);
  }

  // 1. Try WooCommerce Store API
  const storeApiUrl = `${origin}/wp-json/wc/store/v1/products`;
  let page = 1;
  const maxPages = Math.ceil(maxProducts / 10) + 2;

  if (onLog) onLog(`Probing WooCommerce Store API at ${storeApiUrl}...`);

  let apiSuccess = false;
  try {
    while (products.length < maxProducts && page <= maxPages) {
      const fetchUrl = `${storeApiUrl}?page=${page}&per_page=50`;
      const res = await axios.get(fetchUrl, {
        headers: DEFAULT_HEADERS,
        timeout: 8000,
        validateStatus: (s) => s === 200
      });

      if (Array.isArray(res.data) && res.data.length > 0) {
        apiSuccess = true;
        for (const item of res.data) {
          products.push(normalizeWooProduct(item, origin));
          if (products.length >= maxProducts) break;
        }

        if (onLog) onLog(`Extracted ${products.length} WooCommerce products so far...`);
        const totalPages = parseInt(res.headers['x-wp-totalpages'] || res.headers['total-pages'] || '999');
        if (page >= totalPages || res.data.length === 0) break;
        page++;
        await new Promise(r => setTimeout(r, 150));
      } else {
        break;
      }
    }
  } catch (err) {
    if (products.length === 0) {
      if (onLog) onLog(`WooCommerce Store API unavailable (${err.message}). Switching to HTML & Theme Catalog Crawler...`);
    }
  }

  if (apiSuccess && products.length > 0) {
    return products;
  }

  // 2. Fallback: Multi-Page HTML Catalog Crawler (Woodmart, Elementor, Flatsome, Storefront)
  return scrapeWooFromHtml(url, options, onLog);
}

/**
 * Scrapes a single WooCommerce product page
 */
async function scrapeWooSingleProduct(url, options = {}, onLog) {
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;

  try {
    const res = await fetchWithBrowserFallback(url, 10000);
    const $ = cheerio.load(res.data);
    const detectedCurrency = detectStoreCurrency(res.data, url, $);

    // 1. Check Schema.org Product block
    let ldProduct = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      if (ldProduct) return;
      try {
        const json = JSON.parse($(el).html());
        const graph = json['@graph'] || [json];
        for (const node of graph) {
          if (node['@type'] === 'Product' || (Array.isArray(node['@type']) && node['@type'].includes('Product'))) {
            ldProduct = node;
            break;
          }
        }
      } catch (e) {}
    });

    if (ldProduct && ldProduct.name) {
      const title = ldProduct.name.replace(/\s*\|\s*.*$/, '').trim();
      const offer = Array.isArray(ldProduct.offers) ? ldProduct.offers[0] : (ldProduct.offers || {});
      const price = parseFloat(offer.price || 0) || 0;
      const images = [];

      const rawImgs = Array.isArray(ldProduct.image) ? ldProduct.image : (ldProduct.image ? [ldProduct.image] : []);
      rawImgs.forEach((img, idx) => {
        let src = typeof img === 'string' ? img : (img.url || img.contentUrl || '');
        src = cleanWooImage(src, origin);
        if (src && !images.some(i => i.src === src)) {
          images.push({ id: idx + 1, src, alt: title, position: idx + 1 });
        }
      });

      return [{
        id: String(ldProduct.sku || Date.now()),
        title: title,
        handle: title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-'),
        description: (ldProduct.description || title).trim(),
        vendor: origin.replace(/^https?:\/\//, ''),
        product_type: ldProduct.category || 'General',
        tags: [ldProduct.category].filter(Boolean),
        status: 'active',
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        price: price,
        regular_price: price,
        currency: normalizeCurrencyCode(offer.priceCurrency) || detectedCurrency || 'USD',
        variants: [{
          id: '1',
          title: 'Default Title',
          price: price,
          compare_at_price: null,
          sku: ldProduct.sku || `SKU-${Date.now()}`,
          inventory_quantity: 99,
          available: offer.availability ? !offer.availability.includes('OutOfStock') : true,
          weight: 0,
          barcode: ''
        }],
        images: images,
        options: [],
        url: url,
        source: 'woocommerce_single'
      }];
    }

    // 2. DOM Parsing Fallback
    const title = $('h1.product_title, h1.wd-entities-title, h1').first().text().trim();
    const priceText = $('.summary .price, .product-image-summary .price, .entry-summary .price').first().text().trim();
    const { price, regularPrice } = parseWooPriceText(priceText);
    const description = $('.woocommerce-product-details__short-description, #tab-description, .entry-content').html() || '';
    const sku = $('.sku').first().text().trim() || `SKU-${Date.now()}`;
    const category = $('.posted_in a, .product_meta a').first().text().trim() || 'General';

    const images = [];
    $('.woocommerce-product-gallery img, .product-images img, .wd-gallery-thumb img').each((idx, el) => {
      const src = $(el).attr('data-large_image') || $(el).attr('data-wood-src') || $(el).attr('data-lazy-src') || $(el).attr('data-src') || $(el).attr('src');
      const cleanSrc = cleanWooImage(src, origin);
      if (cleanSrc && !images.some(i => i.src === cleanSrc)) {
        images.push({ id: idx + 1, src: cleanSrc, alt: title, position: idx + 1 });
      }
    });

    return [{
      id: String(Date.now()),
      title: title || 'WooCommerce Product',
      handle: title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-'),
      description: description.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim(),
      vendor: origin.replace(/^https?:\/\//, ''),
      product_type: category,
      tags: [category],
      status: 'active',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      price: price,
      regular_price: regularPrice,
      currency: detectedCurrency,
      variants: [{
        id: '1',
        title: 'Default Title',
        price: price,
        compare_at_price: regularPrice > price ? regularPrice : null,
        sku: sku,
        inventory_quantity: 99,
        available: true,
        weight: 0,
        barcode: ''
      }],
      images: images,
      options: [],
      url: url,
      source: 'woocommerce_single'
    }];
  } catch (e) {
    return [];
  }
}

/**
 * Scrapes products from WooCommerce multi-page catalog HTML (Woodmart, Elementor, Divi, Storefront)
 */
async function scrapeWooFromHtml(url, options = {}, onLog) {
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;
  const maxProducts = options.limit || 500;
  const products = [];
  const seenUrls = new Set();

  // Potential catalog entry points
  const isRoot = parsedUrl.pathname === '/' || parsedUrl.pathname === '';
  const candidateUrls = isRoot ? [
    `${origin}/books/`,
    `${origin}/shop/`,
    `${origin}/products/`,
    `${origin}/?s=&post_type=product`,
    `${origin}/?post_type=product`,
    url
  ] : [
    url,
    `${origin}/books/`,
    `${origin}/shop/`,
    `${origin}/products/`,
    `${origin}/?s=&post_type=product`,
    `${origin}/?post_type=product`
  ];

  let activeCatalogUrl = null;

  for (const cUrl of candidateUrls) {
    try {
      const res = await fetchWithBrowserFallback(cUrl, 8000);
      const $ = cheerio.load(res.data);
      const cards = $('.product.type-product, .wd-product-wrapper, .product-grid-item, ul.products > li.product, .wc-block-grid__product');
      if (cards.length > 0) {
        activeCatalogUrl = cUrl;
        break;
      }
    } catch (e) {}
  }

  if (!activeCatalogUrl) {
    activeCatalogUrl = `${origin}/shop/`;
  }

  if (onLog) onLog(`Catalog entry point established at ${activeCatalogUrl}. Starting multi-page crawl...`);

  let detectedCurrency = 'USD';
  let page = 1;
  const maxPages = 20;

  while (products.length < maxProducts && page <= maxPages) {
    let pageUrl = activeCatalogUrl;
    if (page > 1) {
      if (activeCatalogUrl.includes('?')) {
        pageUrl = `${activeCatalogUrl}&paged=${page}`;
      } else {
        pageUrl = activeCatalogUrl.endsWith('/') ? `${activeCatalogUrl}page/${page}/` : `${activeCatalogUrl}/page/${page}/`;
      }
    }

    try {
      const res = await fetchWithBrowserFallback(pageUrl, 10000);
      const $ = cheerio.load(res.data);
      if (page === 1) {
        detectedCurrency = detectStoreCurrency(res.data, pageUrl, $);
        if (onLog) onLog(`Detected WooCommerce store currency: ${detectedCurrency}`);
      }

      const cards = $('.product.type-product, .wd-product-wrapper, .product-grid-item, ul.products > li.product, .wc-block-grid__product');
      if (cards.length === 0) {
        break;
      }

      let addedThisPage = 0;

      cards.each((idx, el) => {
        if (products.length >= maxProducts) return;
        const $card = $(el);

        const title = $card.find('.woocommerce-loop-product__title, .wd-entities-title, h3, h2, a.product-title').first().text().trim();
        const link = $card.find('a.wd-product-img-link, a.woocommerce-LoopProduct-link, a[href*="/product/"]').first().attr('href');
        
        if (!title || title.length < 2) return;
        const productUrl = link ? (link.startsWith('http') ? link : `${origin}${link}`) : `${origin}/product/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        
        if (seenUrls.has(productUrl)) return;
        seenUrls.add(productUrl);

        const rawPriceText = $card.find('.price').text().trim().replace(/\s+/g, ' ');
        const { price, regularPrice } = parseWooPriceText(rawPriceText);

        const imgEl = $card.find('img').first();
        let imgSrc = imgEl.attr('data-large_image') || imgEl.attr('data-wood-src') || imgEl.attr('data-lazy-src') || imgEl.attr('data-src') || imgEl.attr('src') || '';
        imgSrc = cleanWooImage(imgSrc, origin);

        const category = $card.find('.wd-product-cats a, .posted_in a').first().text().trim() || 'General';

        products.push({
          id: String(Date.now() + products.length),
          title: title,
          handle: title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/(^-|-$)/g, ''),
          description: `${title} - Published by ${origin.replace(/^https?:\/\//, '')}.`,
          vendor: origin.replace(/^https?:\/\//, ''),
          product_type: category,
          tags: [category, 'WooCommerce'].filter(Boolean),
          status: 'active',
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          price: price,
          regular_price: regularPrice,
          currency: detectedCurrency,
          variants: [{
            id: `${Date.now()}-${products.length + 1}`,
            title: 'Default Title',
            price: price,
            compare_at_price: regularPrice > price ? regularPrice : null,
            sku: `SKU-${products.length + 1}`,
            inventory_quantity: 99,
            available: true,
            weight: 0,
            barcode: ''
          }],
          images: imgSrc ? [{ id: 1, src: imgSrc, alt: title, position: 1 }] : [],
          options: [],
          url: productUrl,
          source: 'woocommerce_html'
        });
        addedThisPage++;
      });

      if (onLog) onLog(`Extracted ${products.length} products so far (Page ${page})...`);
      if (addedThisPage === 0) break;

      page++;
    } catch (e) {
      break;
    }
  }

  return products;
}

module.exports = {
  scrapeWooCommerce,
  normalizeWooProduct
};
