const axios = require('axios');
const cheerio = require('cheerio');
const { fetchWithBrowserFallback, DEFAULT_HEADERS } = require('./detector');

/**
 * Normalizes a WooCommerce Store API product into the unified format
 */
function normalizeWooProduct(item, origin) {
  const images = (item.images || []).map((img, idx) => {
    let src = typeof img === 'string' ? img : (img.src || img.thumbnail || img.url || '');
    if (src.startsWith('//')) src = `https:${src}`;
    return {
      id: img.id || (idx + 1),
      src: src,
      alt: img.alt || item.name || '',
      position: idx + 1,
      width: 800,
      height: 800
    };
  }).filter(i => Boolean(i.src));

  // Parse prices (WooCommerce Store API returns prices in minor units or string)
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
    currency: item.prices?.currency_code || 'USD',
    variants: variations,
    images: images,
    options: item.attributes || [],
    url: permalink,
    source: 'woocommerce'
  };
}

/**
 * Scrapes WooCommerce store using Store API or HTML crawling with complete pagination
 */
async function scrapeWooCommerce(url, options = {}, onLog) {
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;
  const maxProducts = options.limit || 50;
  const products = [];

  const storeApiUrl = `${origin}/wp-json/wc/store/v1/products`;
  let page = 1;
  const maxPages = maxProducts >= 500 ? 50 : Math.ceil(maxProducts / 10) + 2;

  if (onLog) onLog(`Probing WooCommerce Store API at ${storeApiUrl}...`);

  let apiSuccess = false;
  try {
    while (products.length < maxProducts && page <= maxPages) {
      const fetchUrl = `${storeApiUrl}?page=${page}`;
      if (onLog) onLog(`Fetching Woo API page ${page}...`);

      const res = await axios.get(fetchUrl, {
        headers: DEFAULT_HEADERS,
        timeout: 10000,
        validateStatus: (s) => s === 200
      });

      if (Array.isArray(res.data) && res.data.length > 0) {
        apiSuccess = true;
        for (const item of res.data) {
          products.push(normalizeWooProduct(item, origin));
          if (products.length >= maxProducts) break;
        }

        if (onLog) onLog(`Extracted ${products.length} WooCommerce products so far...`);

        // Check if there are no more items on next page
        const totalPages = parseInt(res.headers['x-wp-totalpages'] || res.headers['total-pages'] || '999');
        if (page >= totalPages || res.data.length === 0) {
          if (onLog) onLog(`Completed all ${page} pages of WooCommerce catalog.`);
          break;
        }

        page++;
        await new Promise(r => setTimeout(r, 200));
      } else {
        if (onLog) onLog(`Reached end of WooCommerce catalog at page ${page}.`);
        break;
      }
    }
  } catch (err) {
    if (products.length === 0) {
      if (onLog) onLog(`WooCommerce Store API returned: ${err.message}. Switching to HTML / Microdata crawler...`);
    }
  }

  if (apiSuccess && products.length > 0) {
    return products;
  }

  // Fallback: Crawl WooCommerce HTML pages / Shop page / Sitemaps
  return scrapeWooFromHtml(url, options, onLog);
}

/**
 * Scrapes products from WooCommerce HTML shop/category/product pages
 */
async function scrapeWooFromHtml(url, options = {}, onLog) {
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;
  const maxProducts = options.limit || 50;
  const products = [];

  let shopUrl = url.includes('/product') ? url : `${origin}/shop/`;
  if (onLog) onLog(`Parsing WooCommerce HTML from ${shopUrl}...`);

  try {
    const res = await fetchWithBrowserFallback(shopUrl, 10000);
    const $ = cheerio.load(res.data);

    // Single product page
    if ($('.single-product').length > 0 || $('.product.type-product').length === 1) {
      const title = $('h1.product_title').text().trim() || $('h1').first().text().trim();
      const priceText = $('.summary .price .amount, .price .woocommerce-Price-amount').first().text().replace(/[^0-9.]/g, '') || '0';
      const regPriceText = $('.summary .price del .amount').first().text().replace(/[^0-9.]/g, '') || priceText;
      const description = $('.woocommerce-product-details__short-description, #tab-description, .woocommerce-Tabs-panel--description').html() || '';
      const sku = $('.sku').text().trim() || `SKU-${Date.now()}`;
      const category = $('.posted_in a').first().text().trim() || 'General';

      const images = [];
      $('.woocommerce-product-gallery__image img, .woocommerce-product-gallery img').each((idx, el) => {
        const src = $(el).attr('data-large_image') || $(el).attr('data-src') || $(el).attr('src');
        if (src && !images.some(i => i.src === src)) {
          images.push({ id: idx + 1, src, alt: title, position: idx + 1 });
        }
      });

      products.push({
        id: String(Date.now()),
        title: title || 'WooCommerce Product',
        handle: title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-'),
        description: description.trim(),
        vendor: origin.replace(/^https?:\/\//, ''),
        product_type: category,
        tags: [category],
        status: 'active',
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        price: parseFloat(priceText) || 0,
        regular_price: parseFloat(regPriceText) || parseFloat(priceText) || 0,
        currency: 'USD',
        variants: [{
          id: '1',
          title: 'Default Title',
          price: parseFloat(priceText) || 0,
          compare_at_price: parseFloat(regPriceText) > parseFloat(priceText) ? parseFloat(regPriceText) : null,
          sku: sku,
          inventory_quantity: 99,
          available: true,
          weight: 0,
          barcode: ''
        }],
        images: images,
        options: [],
        url: url,
        source: 'woocommerce'
      });
      return products;
    }

    // Shop / Catalog listing page: Find all product cards
    const productCards = $('.products .product, ul.products li.product, .wc-block-grid__product');
    if (onLog) onLog(`Found ${productCards.length} product items on WooCommerce catalog page.`);

    productCards.each((idx, el) => {
      if (products.length >= maxProducts) return;
      const $card = $(el);
      const title = $card.find('.woocommerce-loop-product__title, h2, h3, .wc-block-grid__product-title').text().trim();
      const link = $card.find('a.woocommerce-LoopProduct-link, a').first().attr('href');
      const priceText = $card.find('.price ins .amount, .price .amount').last().text().replace(/[^0-9.]/g, '') || '0';
      const regPriceText = $card.find('.price del .amount').first().text().replace(/[^0-9.]/g, '') || priceText;
      const imgEl = $card.find('img').first();
      let imgSrc = imgEl.attr('data-src') || imgEl.attr('src') || '';
      if (imgSrc.startsWith('//')) imgSrc = `https:${imgSrc}`;

      if (title && (priceText || imgSrc)) {
        products.push({
          id: String(Date.now() + idx),
          title: title,
          handle: title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-'),
          description: `${title} - High quality product available on store.`,
          vendor: origin.replace(/^https?:\/\//, ''),
          product_type: 'General',
          tags: ['WooCommerce'],
          status: 'active',
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          price: parseFloat(priceText) || 0,
          regular_price: parseFloat(regPriceText) || parseFloat(priceText) || 0,
          currency: 'USD',
          variants: [{
            id: `${Date.now()}-${idx}`,
            title: 'Default Title',
            price: parseFloat(priceText) || 0,
            compare_at_price: parseFloat(regPriceText) > parseFloat(priceText) ? parseFloat(regPriceText) : null,
            sku: `SKU-${idx + 1}`,
            inventory_quantity: 99,
            available: true,
            weight: 0,
            barcode: ''
          }],
          images: imgSrc ? [{ id: 1, src: imgSrc, alt: title, position: 1 }] : [],
          options: [],
          url: link ? (link.startsWith('http') ? link : `${origin}${link}`) : url,
          source: 'woocommerce'
        });
      }
    });
  } catch (e) {}

  return products;
}

module.exports = {
  scrapeWooCommerce,
  normalizeWooProduct
};
