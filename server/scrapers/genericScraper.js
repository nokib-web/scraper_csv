const cheerio = require('cheerio');
const axios = require('axios');
const { fetchWithBrowserFallback, DEFAULT_HEADERS } = require('./detector');
const { detectStoreCurrency, normalizeCurrencyCode } = require('./currencyHelper');

/**
 * Universal Image URL Extractor with Hotlink, Lazy-load, Picture tag & CSS Background resolution
 */
function resolveUniversalImage($el, $, origin) {
  if (!$el || $el.length === 0) return '';

  const attributes = [
    'data-src', 'data-original', 'data-lazy-src', 'data-lazy', 'data-lazyload',
    'data-hi-res-src', 'data-large_image', 'data-zoom-image', 'data-full-src',
    'data-origin-src', 'data-desktop-src', 'data-zoom', 'data-img', 'data-url',
    'data-image', 'data-src-retina', 'data-echo', 'data-fallback', 'data-thumb',
    'data-srcset', 'srcset', 'src'
  ];

  let bestSrc = '';

  // 1. Check <picture> <source srcset="...">
  const sourceEl = $el.find('picture source').first();
  if (sourceEl.length > 0) {
    const srcset = sourceEl.attr('srcset') || sourceEl.attr('data-srcset');
    if (srcset) {
      // Pick highest resolution or last candidate in srcset
      const candidates = srcset.split(',').map(s => s.trim().split(' ')[0].trim()).filter(Boolean);
      if (candidates.length > 0) {
        bestSrc = candidates[candidates.length - 1];
      }
    }
  }

  // 2. Check all <img> elements inside the card
  if (!bestSrc) {
    const imgEls = $el.is('img') ? $el : $el.find('img');
    imgEls.each((_, el) => {
      if (bestSrc) return;
      const $img = $(el);

      for (const attr of attributes) {
        let val = $img.attr(attr);
        if (val) {
          val = val.trim();
          if (val.includes(',')) {
            const parts = val.split(',').map(s => s.trim().split(' ')[0].trim()).filter(Boolean);
            val = parts[parts.length - 1] || parts[0];
          }
          if (
            val &&
            !val.startsWith('data:image') &&
            !val.includes('placeholder') &&
            !val.includes('no_image') &&
            !val.includes('no-image') &&
            !val.includes('blank.gif') &&
            !val.includes('1x1.png') &&
            !val.includes('loading') &&
            !val.includes('spinner') &&
            !val.includes('logo') &&
            !val.includes('icon')
          ) {
            bestSrc = val;
            break;
          }
        }
      }
    });
  }

  // 3. Fallback: check CSS background-image in inline style or data-bg
  if (!bestSrc) {
    const bgEls = $el.find('[style*="background"], [data-bg], [data-background], [data-bg-src]').addBack('[style*="background"], [data-bg], [data-background], [data-bg-src]');
    bgEls.each((_, el) => {
      if (bestSrc) return;
      const $b = $(el);
      const bgAttr = $b.attr('data-bg') || $b.attr('data-background') || $b.attr('data-bg-src');
      if (bgAttr && !bgAttr.includes('placeholder') && !bgAttr.includes('no_image') && !bgAttr.includes('logo')) {
        bestSrc = bgAttr.trim();
        return;
      }
      const style = $b.attr('style') || '';
      const bgMatch = style.match(/url\(['"]?([^'")]+)['"]?\)/i);
      if (bgMatch && bgMatch[1] && !bgMatch[1].startsWith('data:image') && !bgMatch[1].includes('placeholder') && !bgMatch[1].includes('no_image') && !bgMatch[1].includes('logo')) {
        bestSrc = bgMatch[1].trim();
      }
    });
  }

  // 4. Fallback: check <a> link href pointing directly to an image
  if (!bestSrc) {
    $el.find('a[href*=".jpg"], a[href*=".jpeg"], a[href*=".png"], a[href*=".webp"]').each((_, el) => {
      if (bestSrc) return;
      const href = $(el).attr('href');
      if (href && !href.includes('logo') && !href.includes('icon') && !href.includes('no_image')) {
        bestSrc = href.trim();
      }
    });
  }

  // 5. Fallback: check noscript
  if (!bestSrc) {
    const noscript = $el.find('noscript').html() || '';
    if (noscript.includes('<img')) {
      const match = noscript.match(/src=["'](https?:[^"']+)["']/i) || noscript.match(/src=["']([^"']+)["']/i);
      if (match && !match[1].includes('logo') && !match[1].includes('icon') && !match[1].includes('placeholder') && !match[1].includes('no_image')) {
        bestSrc = match[1].trim();
      }
    }
  }

  if (!bestSrc) return '';

  // Normalize absolute URL
  if (bestSrc.startsWith('//')) {
    bestSrc = `https:${bestSrc}`;
  } else if (bestSrc.startsWith('/') && origin) {
    bestSrc = `${origin}${bestSrc}`;
  } else if (!bestSrc.startsWith('http://') && !bestSrc.startsWith('https://') && origin) {
    bestSrc = `${origin}/${bestSrc.replace(/^\.\//, '')}`;
  }

  // Clean up size caps & query params to upscale to Ultra HD / Original resolution
  if (bestSrc.includes('/image/cache/')) {
    bestSrc = bestSrc.replace(/\/image\/cache\/(catalog|data)\/(.+)-\d+x\d+\.(jpg|jpeg|png|webp)/i, '/image/$1/$2.$3');
  } else {
    bestSrc = bestSrc.replace(/_\d+x\d+[^.]*\.(jpg|jpeg|png|webp)/i, '.$1')
                     .replace(/_(small|medium|large|grande|compact)\.(jpg|jpeg|png|webp)/i, '.$2')
                     .replace(/-\d+x\d+\.(jpg|jpeg|png|webp)/i, '.$1');
  }

  return bestSrc;
}

/**
 * Converts Bengali digits (০-৯) to standard English numerals (0-9)
 */
function convertBengaliNumerals(str) {
  if (!str || typeof str !== 'string') return '';
  const bnToEn = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  return str.replace(/[০-৯]/g, d => bnToEn[d] || d);
}

/**
 * Universal Price Extractor with International & Bengali Currency / Digit Support
 */
function extractUniversalPrice($el) {
  const priceSelectors = [
    '.price-new', '.sp-text', '.special-price', '.p-item-price', '.book-price',
    '.woocommerce-Price-amount', '.pr-text', '.price', '.product-price',
    '.current-price', '.amount', '.offer-price', '[class*="price"]', '[data-price]'
  ];

  let rawPrice = '';
  let regPrice = '';

  const priceEl = $el.find(priceSelectors.join(', ')).first();
  let text = priceEl.length > 0 ? priceEl.text() : $el.text();
  text = convertBengaliNumerals(text);

  if ($el.find('.price-old, del, .old-price, .strike').length > 0) {
    const rawOld = convertBengaliNumerals($el.find('.price-old, del, .old-price, .strike').text());
    regPrice = rawOld.replace(/[^0-9.]/g, '');
  }

  const match = text.match(/(?:Tk|৳|TK\.|\$|£|€|₹|Rs\.?|USD|EUR|BDT)?\s*([0-9,]+(?:\.[0-9]{2})?)/i) ||
                text.match(/([0-9,]+)\s*(?:Tk|৳|TK|টাকা)/i);

  if (match && match[1]) {
    rawPrice = match[1].replace(/,/g, '');
  }

  return {
    price: parseFloat(rawPrice) || 0,
    regularPrice: parseFloat(regPrice) || parseFloat(rawPrice) || 0
  };
}

const GLOBAL_BLACKLIST = new Set([
  'apple', 'acer', 'asus', 'dell', 'hp', 'lenovo', 'microsoft',
  'msi', 'gigabyte', 'samsung', 'huawei', 'walton', 'sony', 'canon',
  'cart', 'menu', 'search', 'login', 'register', 'home', 'shop', 'inquiry',
  'categories', 'filter', 'sort', 'view all', 'read more', 'search toggle',
  'wafilife', 'rokomari', 'ghorer bazar', 'customer care', 'recently searched',
  'offers', 'close', 'logo', 'my account', 'wishlist', 'checkout', 'sign in'
]);

/**
 * Parses Schema.org Product JSON-LD block
 */
function parseJsonLdProduct(item, origin, fallbackUrl, defaultCurrency = 'USD') {
  if (!item) return null;
  const title = item.name || item.headline;
  if (!title) return null;

  let price = 0;
  let regularPrice = 0;
  let currency = defaultCurrency || 'USD';
  let sku = item.sku || item.productID || item.mpn || `SKU-${Date.now()}`;
  let inStock = true;
  let parsedQty = null;

  if (item.offers) {
    const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
    price = parseFloat(offer.price || offer.lowPrice || offer.highPrice || 0) || 0;
    regularPrice = parseFloat(offer.highPrice || offer.price || price) || price;
    currency = normalizeCurrencyCode(offer.priceCurrency) || defaultCurrency || 'USD';
    if (offer.availability) {
      inStock = !offer.availability.includes('OutOfStock');
    }
    if (offer.inventoryLevel?.value !== undefined && !isNaN(Number(offer.inventoryLevel.value))) {
      parsedQty = Number(offer.inventoryLevel.value);
    } else if (offer.eligibleQuantity?.value !== undefined && !isNaN(Number(offer.eligibleQuantity.value))) {
      parsedQty = Number(offer.eligibleQuantity.value);
    }
  }

  const images = [];
  const rawImages = Array.isArray(item.image) ? item.image : (item.image ? [item.image] : []);
  rawImages.forEach((img, idx) => {
    let src = typeof img === 'string' ? img : (img.url || img.contentUrl || '');
    if (src.startsWith('//')) src = `https:${src}`;
    else if (src.startsWith('/') && origin) src = `${origin}${src}`;
    if (src && !images.some(i => i.src === src)) {
      images.push({ id: idx + 1, src, alt: title, position: idx + 1 });
    }
  });

  const handle = title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/(^-|-$)/g, '') || `prod-${Date.now()}`;
  const brand = typeof item.brand === 'string' ? item.brand : (item.brand?.name || origin.replace(/^https?:\/\//, ''));
  const category = item.category || 'General';
  const effectiveStock = parsedQty !== null ? parsedQty : (inStock ? 99 : 0);

  return {
    id: String(item.sku || Date.now() + Math.random()),
    title: title,
    handle: handle,
    description: (item.description || title).trim(),
    vendor: brand,
    product_type: category,
    tags: [category].filter(Boolean),
    status: inStock ? 'active' : 'draft',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    price: price,
    regular_price: regularPrice >= price ? regularPrice : price,
    currency: currency,
    inventory_quantity: effectiveStock,
    variants: [{
      id: '1',
      title: 'Default Title',
      price: price,
      compare_at_price: regularPrice > price ? regularPrice : null,
      sku: String(sku),
      inventory_quantity: effectiveStock,
      available: inStock && effectiveStock > 0,
      weight: 0,
      barcode: item.gtin || item.gtin13 || item.isbn || ''
    }],
    images: images,
    options: [],
    url: item.url ? (item.url.startsWith('http') ? item.url : `${origin}${item.url}`) : fallbackUrl,
    source: 'generic_jsonld'
  };
}

/**
 * Universal Next.js RSC (__next_f) Extractor (for Wafilife and Next.js Apps)
 */
function extractNextJsProducts(html, origin, maxProducts = 5000, defaultCurrency = 'BDT') {
  const products = [];
  const jsonChunks = [...html.matchAll(/self\.__next_f\.push\(\[1,"(.*)"\]\)/g)];

  for (const chunk of jsonChunks) {
    const raw = chunk[1];
    if (raw.includes('price') && (raw.includes('title') || raw.includes('name') || raw.includes('slug') || raw.includes('image'))) {
      const unescaped = raw.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      
      const matches = [...unescaped.matchAll(/\{[^{}]*"title":"([^"]+)"[^{}]*"price":([0-9.]+)[^{}]*\}/g)];
      for (const m of matches) {
        if (products.length >= maxProducts) break;
        try {
          const itemJson = JSON.parse(m[0]);
          const title = itemJson.title || itemJson.name;
          const price = parseFloat(itemJson.price || itemJson.regular_price || 0) || 0;
          const regPrice = parseFloat(itemJson.regular_price || itemJson.original_price || price) || price;
          let img = itemJson.image || itemJson.thumbnail || itemJson.cover || (Array.isArray(itemJson.images) ? itemJson.images[0] : '');
          if (img && img.startsWith('//')) img = `https:${img}`;
          const slug = itemJson.slug || (title ? title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-') : `book-${Date.now()}`);

          if (title && title.length > 2 && !products.some(p => p.title === title)) {
            products.push({
              id: String(itemJson.id || itemJson._id || Date.now() + Math.random()),
              title: title,
              handle: slug,
              description: itemJson.description || `${title} - Available on store.`,
              vendor: itemJson.author || itemJson.publisher || 'Store',
              product_type: itemJson.category || 'General',
              tags: [itemJson.category, itemJson.author].filter(Boolean),
              status: 'active',
              published_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              price: price,
              regular_price: regPrice >= price ? regPrice : price,
              currency: defaultCurrency || 'BDT',
              variants: [{
                id: '1',
                title: 'Default Title',
                price: price,
                compare_at_price: regPrice > price ? regPrice : null,
                sku: `SKU-${Date.now()}`,
                inventory_quantity: 99,
                available: true
              }],
              images: img ? [{ id: 1, src: img.startsWith('//') ? `https:${img}` : img, alt: title, position: 1 }] : [],
              url: itemJson.url ? (itemJson.url.startsWith('http') ? itemJson.url : `${origin}${itemJson.url}`) : origin,
              source: 'wafilife_nextjs'
            });
          }
        } catch (e) {}
      }
    }
  }

  return products;
}

/**
 * Universal SPA Bundle Scanner for React / Vite / Vercel applications with full pagination
 */
async function scanSpaBundles(html, origin, maxProducts = 5000, onLog, defaultCurrency = 'USD') {
  const $ = cheerio.load(html);
  const scriptUrls = [];
  $('script[src]').each((_, el) => {
    let src = $(el).attr('src');
    if (src) {
      if (src.startsWith('/')) src = `${origin}${src}`;
      scriptUrls.push(src);
    }
  });

  const apiEndpoints = [];
  for (const sUrl of scriptUrls.slice(0, 8)) {
    try {
      const res = await axios.get(sUrl, { timeout: 6000 });
      const js = res.data;
      if (typeof js === 'string') {
        const matches = js.match(/\/api\/[a-zA-Z0-9_\-\/]+/g) || [];
        for (const m of matches) {
          if (!apiEndpoints.includes(m) && (m.includes('product') || m.includes('item') || m.includes('catalog') || m.includes('decor'))) {
            apiEndpoints.push(m);
          }
        }
      }
    } catch (e) {}
  }

  for (const ep of apiEndpoints) {
    try {
      const apiUrl = `${origin}${ep}`;
      const res = await axios.get(apiUrl, { timeout: 6000 });
      const data = res.data;
      const list = Array.isArray(data) ? data : (data.products || data.items || data.data || []);
      if (Array.isArray(list) && list.length > 0) {
        const products = [];
        for (const item of list) {
          if (products.length >= maxProducts) break;
          const title = item.title || item.name || item.productName;
          const price = parseFloat(item.price || item.currentPrice || 0) || 0;
          let img = item.image || item.imageUrl || (Array.isArray(item.images) ? item.images[0] : '');
          if (img && img.startsWith('//')) img = `https:${img}`;

          if (title) {
            products.push({
              id: String(item.id || item._id || Date.now() + Math.random()),
              title: title,
              handle: item.slug || title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-'),
              description: item.description || title,
              vendor: origin.replace(/^https?:\/\//, ''),
              product_type: item.category || 'General',
              tags: [item.category].filter(Boolean),
              status: 'active',
              published_at: item.createdAt || new Date().toISOString(),
              created_at: item.createdAt || new Date().toISOString(),
              price: price,
              regular_price: price,
              currency: defaultCurrency || 'USD',
              variants: [{
                id: '1',
                title: 'Default Title',
                price: price,
                compare_at_price: null,
                sku: `SKU-${Date.now()}`,
                inventory_quantity: 99,
                available: true,
                weight: 0,
                barcode: ''
              }],
              images: img ? [{ id: 1, src: img, alt: title, position: 1 }] : [],
              options: [],
              url: origin,
              source: 'spa_backend'
            });
          }
        }
        return products;
      }
    } catch (e) {}
  }

  return [];
}

/**
 * Extracts products from raw Cheerio DOM (Universal Cluster Matching) with enhanced category, SKU, stock & multi-image support
 */
function extractProductsFromDom($, origin, currentUrl, maxProducts, onLog, defaultCurrency = 'USD', fallbackCategory = '', breadcrumbTags = []) {
  const products = [];

  const cardSelectors = [
    '.book-list-wrapper', '.p-item', '.product', 'li.product', '.product-card',
    '.product-item', '.product-box', '.grid-product', 'article.product',
    '.shop-item', '.catalog-item', '[itemtype*="Product"]', '.c-product',
    '.product-thumb', '.box-product', '.product-layout', '.product-wrap',
    '[data-mesh-id*="products"]', '.bookCard', '.home-carousel-item',
    'div[class*="product"]', 'div[class*="item"]', 'div[class*="card"]'
  ];

  for (const sel of cardSelectors) {
    const cards = $(sel);
    if (cards.length >= 1) {
      cards.each((idx, el) => {
        if (products.length >= maxProducts) return;
        const $card = $(el);
        if ($card.children().length > 25 || $card.is('body') || $card.is('main') || $card.is('html') || $card.is('header') || $card.is('footer')) return;

        const img = resolveUniversalImage($card, $, origin);
        const { price, regularPrice } = extractUniversalPrice($card);

        let title = $card.find('.p-item-name a, .book-title, .woocommerce-loop-product__title, .card-title, .product-title, h2, h3, h4, .title, [class*="title"], [class*="name"], p.card-text a, a.card-link').first().text().trim() ||
          $card.attr('title')?.trim() ||
          $card.find('a[title]').attr('title')?.trim() ||
          $card.find('img').first().attr('alt')?.trim();

        if (!title && $card.is('a')) title = $card.text().trim();
        if (title) title = title.replace(/\s+/g, ' ').trim();

        if (!title || title.length < 3 || GLOBAL_BLACKLIST.has(title.toLowerCase())) return;

        const linkEl = $card.find('a[href*="/product/"], a[href*="/book/"], a[href*="/shop/"], a[href*="/item/"], a').first();
        let link = linkEl.attr('href') || ($card.is('a') ? $card.attr('href') : currentUrl);
        if (link && link.startsWith('/')) link = `${origin}${link}`;

        const author = $card.find('.book-author, .author, [class*="author"]').first().text().trim();
        const cardCategory = $card.find('.sp-text-link, .category, .badge, [class*="category"]').first().text().trim();
        const category = cardCategory || fallbackCategory || (author ? 'Books' : 'General');
        const vendor = author || origin.replace(/^https?:\/\//, '');

        if (title && (price > 0 || img)) {
          const handle = title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/(^-|-$)/g, '') || `item-${Date.now()}-${idx}`;

          const isOutOfStock = $card.find('.out-of-stock, .stock.out-of-stock, .sold-out, [class*="soldout"], [class*="out-of-stock"], .disabled').length > 0;
          const stockText = $card.find('.stock, .inventory, .in-stock').text().trim();
          const qtyMatch = stockText.match(/(\d+)\s*(?:in\s*stock|left\s*in\s*stock|items?\s*left|pieces?|pcs|টি\s*স্টকে|স্টকে\s*আছে)/i);
          const cardStock = qtyMatch ? parseInt(qtyMatch[1], 10) : (isOutOfStock ? 0 : 99);

          // Extract real SKU / ID from card onclick or attributes
          const onclickAttr = $card.find('[onclick*="cart.add"]').attr('onclick') || '';
          const onclickMatch = onclickAttr.match(/cart\.add\('(\d+)'/);
          const domSku = onclickMatch ? onclickMatch[1] : (
            $card.attr('data-product-id') ||
            $card.attr('data-id') ||
            $card.attr('data-sku') ||
            $card.find('.sku, [itemprop="sku"]').text().trim() ||
            `SKU-${idx + 1}`
          );

          // Extract rich short description from card
          const shortDescEl = $card.find('.short-description, .product-short-description, .features, .summary, .p-item-details ul');
          const description = shortDescEl.length > 0
            ? shortDescEl.html().trim()
            : `${title} - Available on ${origin.replace(/^https?:\/\//, '')}.`;

          // Collect all images from card (including hover and data-src)
          const cardImages = [];
          if (img) {
            let crispImg = img.replace(/-\d+x\d+\.(webp|jpg|jpeg|png)/i, '-500x500.$1');
            cardImages.push({ id: 1, src: crispImg, alt: title, position: 1 });
          }

          $card.find('img').each((_, el) => {
            let altSrc = $(el).attr('data-hover-image') || $(el).attr('data-hover') || $(el).attr('data-secondary') || $(el).attr('data-alt-image');
            if (altSrc) {
              if (altSrc.startsWith('//')) altSrc = `https:${altSrc}`;
              else if (altSrc.startsWith('/') && origin) altSrc = `${origin}${altSrc}`;
              altSrc = altSrc.replace(/\/image\/cache\/(catalog|data)\/(.+)-\d+x\d+\.(jpg|jpeg|png|webp)/i, '/image/$1/$2.$3');
              if (altSrc.startsWith('http') && !cardImages.some(x => x.src === altSrc)) {
                cardImages.push({ id: cardImages.length + 1, src: altSrc, alt: title, position: cardImages.length + 1 });
              }
            }
          });

          const tags = Array.from(new Set([category, author, ...(breadcrumbTags || [])].filter(Boolean)));

          if (!products.some(p => p.title === title || p.handle === handle) && title.length < 150) {
            products.push({
              id: String(domSku),
              title,
              handle,
              description,
              vendor,
              product_type: category,
              tags,
              status: isOutOfStock ? 'draft' : 'active',
              published_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              price,
              regular_price: regularPrice >= price ? regularPrice : price,
              currency: defaultCurrency || 'USD',
              inventory_quantity: cardStock,
              variants: [{
                id: String(domSku),
                title: 'Default Title',
                price,
                compare_at_price: regularPrice > price ? regularPrice : null,
                sku: String(domSku),
                inventory_quantity: cardStock,
                available: !isOutOfStock && cardStock > 0,
                weight: 0,
                barcode: ''
              }],
              images: cardImages,
              options: [],
              url: link || currentUrl,
              source: 'universal'
            });
          }
        }
      });

      if (products.length >= 10) break;
    }
  }

  return products;
}

/**
 * Hydrates full gallery images, specifications table, and variants from single product detail HTML
 */
async function hydrateGenericProductDetails(product, origin, headers) {
  if (!product || !product.url || !product.url.startsWith('http')) return product;
  try {
    const res = await axios.get(product.url, { headers, timeout: 7000 });
    const $ = cheerio.load(res.data);

    // 1. Full Gallery Images
    const gallery = [];
    $('a.thumbnail, .product-thumbnails a, .product-image-slider img, .product-media img, a[data-fancybox="gallery"], .thumbnails a, .image-additional a, .gallery img, .product-gallery img').each((_, el) => {
      let src = $(el).attr('href') || $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-zoom-image');
      if (src && (src.includes('/image/') || src.includes('/upload/') || src.includes('/media/') || src.includes('/product/'))) {
        if (src.startsWith('//')) src = `https:${src}`;
        else if (src.startsWith('/') && origin) src = `${origin}${src}`;
        src = src.replace(/\/image\/cache\/(catalog|data)\/(.+)-\d+x\d+\.(jpg|jpeg|png|webp)/i, '/image/$1/$2.$3')
                 .replace(/-\d+x\d+\.(webp|jpg|jpeg|png)/i, '-500x500.$1');
        if (src.startsWith('http') && !gallery.some(g => g.src === src)) {
          gallery.push({ id: gallery.length + 1, src, alt: product.title, position: gallery.length + 1 });
        }
      }
    });
    if (gallery.length > (product.images?.length || 0)) {
      product.images = gallery;
    }

    // 2. Specifications Table & Full Description
    const specTable = $('.data-table, .specification-table, #tab-specification, .specs-table');
    if (specTable.length > 0) {
      const specHtml = '<div class="product-specifications"><table class="data-table">' + specTable.html() + '</table></div>';
      if (!product.description.includes('product-specifications')) {
        product.description = `${product.description || ''}\n${specHtml}`.trim();
      }
    }

    // 3. Exact SKU / Model
    const codeText = $('.p-meta, .product-meta, .product-info, .product-short-info, .product-price-sku, ul.list-unstyled').text();
    const codeMatch = codeText.match(/(?:Product Code|SKU|Item Code|Model)[:\s]+([a-zA-Z0-9_\-]+)/i);
    if (codeMatch && codeMatch[1]) {
      product.id = codeMatch[1];
      if (product.variants && product.variants.length > 0) {
        product.variants[0].sku = codeMatch[1];
      }
    }

    // 4. Exact Stock Status
    const stockText = $('.product-status, .stock, .in-stock, .stock-status, .stock-availability').text().trim();
    if (stockText) {
      const isOutOfStock = /out\s*of\s*stock|unavailable|sold\s*out|স্টকে\s*নেই/i.test(stockText);
      if (isOutOfStock) {
        product.inventory_quantity = 0;
        product.status = 'draft';
        if (product.variants) product.variants.forEach(v => { v.inventory_quantity = 0; v.available = false; });
      }
    }

    // 5. Options & Variants
    const options = [];
    $('.product-options .form-group, #product .form-group, .product-options .option, [id^="input-option"]').each((_, el) => {
      const optLabel = $(el).find('label').first().text().replace(/[*:]/g, '').trim();
      const optVals = [];
      $(el).find('select option, input[type="radio"], input[type="checkbox"]').each((_, vel) => {
        let t = $(vel).text().trim() || $(vel).val();
        if (!t && $(vel).parent().text()) t = $(vel).parent().text().trim();
        if (t && !t.includes('Select') && !optVals.includes(t)) optVals.push(t);
      });
      if (optLabel && optVals.length > 0) {
        options.push({ name: optLabel, values: optVals });
      }
    });

    if (options.length > 0) {
      product.options = options;
      const newVariants = [];
      const primaryOpt = options[0];
      primaryOpt.values.forEach((val, vIdx) => {
        newVariants.push({
          id: `${product.id || Date.now()}-${vIdx + 1}`,
          title: val,
          price: product.price,
          compare_at_price: product.regular_price > product.price ? product.regular_price : null,
          sku: `${product.id || 'SKU'}-${vIdx + 1}`,
          inventory_quantity: product.inventory_quantity,
          available: product.status === 'active' && product.inventory_quantity > 0,
          weight: 0,
          barcode: ''
        });
      });
      if (newVariants.length > 0) {
        product.variants = newVariants;
      }
    }
  } catch (err) {}
  return product;
}

/**
 * Scrapes products from ANY website worldwide (100% Universal AI-grade Engine)
 * Automatically discovers all subcategories, handles deep pagination, and extracts full multi-image galleries & variants.
 */
async function scrapeGenericSite(url, options = {}, onLog) {
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;
  const maxProducts = options.limit || 50;
  let products = [];
  const seenHandles = new Set();

  let customCookie = options.cookie || options.sessionCookie || '';
  if (!customCookie && options.password) {
    const rawPwd = options.password.trim();
    customCookie = rawPwd.includes('=') ? rawPwd : `cf_clearance=${rawPwd}`;
  }
  const extraHeaders = customCookie ? { Cookie: customCookie } : {};

  if (onLog) {
    if (customCookie) onLog(`Using custom session/clearance cookie authentication...`);
    onLog(`Fetching initial page from ${url} with anti-bot protection...`);
  }

  const response = await fetchWithBrowserFallback(url, 12000, extraHeaders);
  const html = response.data;
  const $ = cheerio.load(html);

  const finalUrl = response.request?.res?.responseUrl || response.config?.url || url;
  const isPasswordProtected = response.status === 401 ||
    /action=["']\/password["']/i.test(html) ||
    /name=["']form_type["']\s+value=["']storefront_password["']/i.test(html) ||
    (typeof finalUrl === 'string' && finalUrl.includes('/password') && /password/i.test(html)) ||
    (parsedUrl.pathname.endsWith('/password') && /password/i.test(html));

  if (isPasswordProtected) {
    const err = new Error(options.password ? 'Incorrect storefront password. Please verify and try again.' : 'This store is password protected. Please enter the storefront password.');
    err.isPasswordProtected = true;
    err.invalidPassword = Boolean(options.password);
    err.platform = 'generic';
    throw err;
  }

  const detectedCurrency = detectStoreCurrency(html, url, $);
  if (onLog) onLog(`Detected store currency: ${detectedCurrency}`);

  // 1. Next.js RSC Stream / Wafilife
  if (html.includes('self.__next_f.push')) {
    if (onLog) onLog('Inspecting Next.js React Server Component catalog stream...');
    const nextProds = extractNextJsProducts(html, origin, maxProducts, detectedCurrency);
    if (nextProds.length > 0) {
      if (onLog) onLog(`Extracted ${nextProds.length} products from Next.js catalog stream!`);
      return nextProds.slice(0, maxProducts);
    }
  }

  // 2. Client-Side SPA Bundles (Only for empty skeleton SPAs like style-decor)
  if (html.length < 3500 && ($('#root').length > 0 || $('#app').length > 0 || $('div#root, div#__next, div#app').length > 0)) {
    if (onLog) onLog('Inspecting SPA JavaScript bundles for connected REST API backend...');
    const spaProducts = await scanSpaBundles(html, origin, maxProducts, onLog, detectedCurrency);
    if (spaProducts.length > 0) {
      if (onLog) onLog(`Successfully extracted ${spaProducts.length} total products from SPA backend!`);
      return spaProducts.slice(0, maxProducts);
    }
  }

  // 3. Schema.org JSON-LD scripts
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const jsonText = $(el).html();
      if (!jsonText) return;
      const parsed = JSON.parse(jsonText);

      const candidates = [];
      if (Array.isArray(parsed)) candidates.push(...parsed);
      else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) candidates.push(...parsed['@graph']);
      else candidates.push(parsed);

      for (const item of candidates) {
        if (products.length >= maxProducts) break;
        if (item['@type'] === 'Product' || item['@type']?.includes?.('Product')) {
          const prod = parseJsonLdProduct(item, origin, url, detectedCurrency);
          if (prod && !seenHandles.has(prod.handle) && !products.some(p => p.title === prod.title)) {
            seenHandles.add(prod.handle);
            products.push(prod);
          }
        }
      }
    } catch (e) {}
  });

  // 4. Universal DOM Cards from initial page
  const initialDom = extractProductsFromDom($, origin, url, maxProducts, onLog, detectedCurrency);
  for (const p of initialDom) {
    if (!seenHandles.has(p.handle) && !products.some(x => x.title === p.title)) {
      seenHandles.add(p.handle);
      products.push(p);
    }
  }

  if (onLog) onLog(`Extracted ${products.length} products from initial page.`);

  // 4B. Quick Return for Dedicated Single Product Page URL
  const isDirectProductUrl = Boolean(
    parsedUrl.pathname.includes('/product/') ||
    parsedUrl.pathname.includes('/item/') ||
    parsedUrl.pathname.includes('/book/') ||
    (initialDom.length === 1 && maxProducts === 1)
  );

  if (isDirectProductUrl && products.length > 0) {
    if (onLog) onLog(`Hydrating full single product gallery & specifications...`);
    await hydrateGenericProductDetails(products[0], origin, { ...DEFAULT_HEADERS, ...extraHeaders });
    return products.slice(0, maxProducts);
  }

  // 5. Multi-Category, Subcategory & Deep Crawl with Full Pagination
  if (products.length < maxProducts) {
    const categoryQueue = [];
    const seenCategoryUrls = new Set();

    function enqueueCategory(rawUrl) {
      if (!rawUrl) return;
      let clean = rawUrl.split('#')[0].split('?')[0].trim();
      if (clean.startsWith('//')) clean = `https:${clean}`;
      else if (clean.startsWith('/')) clean = `${origin}${clean}`;

      if (
        clean.startsWith(origin) &&
        !seenCategoryUrls.has(clean) &&
        clean !== origin &&
        clean !== `${origin}/` &&
        !clean.includes('/cart') &&
        !clean.includes('/checkout') &&
        !clean.includes('/account') &&
        !clean.includes('/login') &&
        !clean.includes('/register') &&
        !clean.includes('/information') &&
        !clean.includes('/terms') &&
        !clean.includes('/privacy') &&
        !clean.includes('/contact') &&
        !clean.includes('/about') &&
        !clean.includes('/help') &&
        !clean.includes('/faq') &&
        !clean.includes('/blog') &&
        !clean.includes('/news') &&
        !clean.includes('/wishlist') &&
        !clean.match(/\.(jpg|jpeg|png|webp|gif|svg|pdf|zip|css|js)$/i)
      ) {
        seenCategoryUrls.add(clean);
        categoryQueue.push(clean);
      }
    }

    // Prioritize the user's specific target category URL first if provided
    if (parsedUrl.pathname && parsedUrl.pathname !== '/' && parsedUrl.pathname !== '') {
      enqueueCategory(url);
    }

    // 5A. Scan all Navigation Containers for Categories & Subcategories
    $('nav a[href], .navbar a[href], .responsive-menu a[href], .main-menu a[href], .nav a[href], .menu a[href], #menu a[href], .categories a[href], .categories-menu a[href], .site-nav a[href], .sidebar a[href], .cat-menu a[href], header a[href], .megamenu a[href], .menu-item a[href], .sub-cat a[href], .child-list a[href], .ws-box a[href], a.category-card[href], a.cat-item[href]').each((_, el) => {
      enqueueCategory($(el).attr('href'));
    });

    // 5B. Scan for any links containing catalog/category keywords
    $('a[href*="/category/"], a[href*="/categories/"], a[href*="/collection/"], a[href*="/collections/"], a[href*="/shop/"], a[href*="/catalog/"], a[href*="/product-category/"], a[href*="/c/"], a[href*="/department/"]').each((_, el) => {
      enqueueCategory($(el).attr('href'));
    });

    // 5C. XML Sitemap Accelerated Discovery (For large limits or when navigation yields few paths)
    if (maxProducts > 50 || categoryQueue.length < 10) {
      try {
        const sitemapUrl = `${origin}/sitemap.xml`;
        const smRes = await axios.get(sitemapUrl, { headers: DEFAULT_HEADERS, timeout: 6000, validateStatus: (s) => s === 200 });
        if (smRes.data && typeof smRes.data === 'string') {
          const locMatches = smRes.data.match(/<loc>([^<]+)<\/loc>/g) || [];
          for (const locTag of locMatches.slice(0, 1000)) {
            const locUrl = locTag.replace(/<\/?loc>/g, '').trim();
            if (locUrl && !locUrl.includes('.xml')) {
              enqueueCategory(locUrl);
            }
          }
        }
      } catch (smErr) {}
    }

    if (categoryQueue.length > 0) {
      if (onLog) onLog(`Discovered ${categoryQueue.length} category & subcategory catalog paths. Deep-crawling store catalog with full pagination...`);

      for (let cIdx = 0; cIdx < categoryQueue.length && products.length < maxProducts; cIdx++) {
        const catUrl = categoryQueue[cIdx];
        let page = 1;
        let hasMorePages = true;

        while (hasMorePages && products.length < maxProducts && page <= 30) {
          let pageUrl = catUrl;
          // Apply high-speed batch limit parameter if supported
          if (!pageUrl.includes('limit=')) {
            pageUrl += (pageUrl.includes('?') ? '&' : '?') + 'limit=90';
          }
          pageUrl += `&page=${page}`;

          try {
            const catRes = await fetchWithBrowserFallback(pageUrl, 9000, extraHeaders);
            const $cat = cheerio.load(catRes.data);

            // Discover and enqueue nested subcategories found on this category page
            $cat('.child-list a[href], .sub-cat a[href], .ws-box a[href], .category-card a[href], .subcategories a[href], .filter-group a[href], .subcat a[href]').each((_, el) => {
              enqueueCategory($cat(el).attr('href'));
            });

            // Extract breadcrumbs and active category name
            const breadcrumbs = [];
            $cat('.breadcrumb li, .breadcrumbs li, nav[aria-label="breadcrumb"] li').each((_, el) => {
              const t = $cat(el).text().trim();
              if (t && !/home/i.test(t) && !breadcrumbs.includes(t)) breadcrumbs.push(t);
            });
            const activeCategory = breadcrumbs.join(' > ') || $cat('h1.page-title, h1.title, .category-name, h1').first().text().trim() || 'General';

            const catProducts = extractProductsFromDom($cat, origin, pageUrl, maxProducts, onLog, detectedCurrency, activeCategory, breadcrumbs);
            let addedCount = 0;

            for (const cp of catProducts) {
              if (products.length >= maxProducts) break;
              if (!seenHandles.has(cp.handle) && !products.some(p => p.title === cp.title)) {
                seenHandles.add(cp.handle);
                products.push(cp);
                addedCount++;
              }
            }

            if (onLog && addedCount > 0) {
              onLog(`[CATALOG EXPANSION] Category ${cIdx + 1}/${categoryQueue.length} (${activeCategory}, Page ${page}) | +${addedCount} items | Total: ${products.length}/${maxProducts}`);
            }

            // Check if category has a next page
            const hasNext = $cat('.pagination a[href], .page-numbers a[href], a.next, link[rel="next"]').toArray().some(a => {
              const href = $cat(a).attr('href') || '';
              return href.includes(`page=${page + 1}`) || href.includes(`p=${page + 1}`) || $cat(a).hasClass('next');
            });

            if (!hasNext || catProducts.length === 0) {
              hasMorePages = false;
            } else {
              page++;
            }
          } catch (e) {
            hasMorePages = false;
          }
        }
      }
    }
  }

  // 6. Deep Gallery & Variant Hydration Stage (Hydrate multi-image galleries & specifications table)
  if (products.length > 0) {
    const hydrateCount = maxProducts <= 100 ? Math.min(products.length, maxProducts) : Math.min(products.length, 60);
    if (onLog) onLog(`Hydrating multi-image galleries, specifications & variant options for ${hydrateCount} products...`);

    const concurrency = 6;
    for (let i = 0; i < hydrateCount; i += concurrency) {
      const batch = products.slice(i, i + concurrency);
      await Promise.all(batch.map(p => hydrateGenericProductDetails(p, origin, { ...DEFAULT_HEADERS, ...extraHeaders })));
      if (onLog && (i + concurrency) % 24 === 0) {
        onLog(`Hydrated ${Math.min(i + concurrency, hydrateCount)}/${hydrateCount} products with full multi-image galleries & specs...`);
      }
    }

    if (onLog) onLog(`Completed catalog extraction with ${products.length} total products!`);
    return products.slice(0, maxProducts);
  }

  // 7. Single Product Fallback
  const ogTitle = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim();
  const ogImage = $('meta[property="og:image"]').attr('content');
  const ogDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
  const priceSelectors = ['.price-new', '.sp-text', '.price', '.product-price', '.offer-price', '[itemprop="price"]', '.current-price', '.amount', '[data-price]'];
  let detectedPrice = '0';
  for (const sel of priceSelectors) {
    const txt = $(sel).first().text().replace(/[^0-9.]/g, '');
    if (txt && parseFloat(txt) > 0) {
      detectedPrice = txt;
      break;
    }
  }

  if (ogTitle && ogTitle.length > 3) {
    const images = [];
    if (ogImage) {
      let src = ogImage.startsWith('//') ? `https:${ogImage}` : (ogImage.startsWith('/') ? `${origin}${ogImage}` : ogImage);
      images.push({ id: 1, src, alt: ogTitle, position: 1 });
    }

    const isOutOfStock = $('[name="add"][disabled], .sold-out, .out-of-stock, [data-sold-out="true"], .product-form__submit[disabled]').length > 0 ||
      /sold\s*out|out\s*of\s*stock|স্টকে\s*নেই/i.test($('.product-form, .product-single, .entry-summary').text());
    const maxQtyAttr = $('input[name="quantity"], input.qty').attr('max');
    const stockText = $('.stock, .inventory, .in-stock').text().trim();
    const qtyMatch = stockText.match(/(\d+)\s*(?:in\s*stock|left\s*in\s*stock|items?\s*left|pieces?|pcs|টি\s*স্টকে|স্টকে\s*আছে)/i);
    let detectedStock = 99;
    if (isOutOfStock) detectedStock = 0;
    else if (qtyMatch) detectedStock = parseInt(qtyMatch[1], 10);
    else if (maxQtyAttr && !isNaN(Number(maxQtyAttr)) && Number(maxQtyAttr) > 0 && Number(maxQtyAttr) < 100000) detectedStock = Number(maxQtyAttr);

    const singleProd = {
      id: String(Date.now()),
      title: ogTitle,
      handle: ogTitle.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-'),
      description: ogDesc || ogTitle,
      vendor: origin.replace(/^https?:\/\//, ''),
      product_type: 'General',
      tags: ['Single Product'],
      status: isOutOfStock ? 'draft' : 'active',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      price: parseFloat(detectedPrice) || 0,
      regular_price: parseFloat(detectedPrice) || 0,
      currency: detectedCurrency || 'BDT',
      inventory_quantity: detectedStock,
      variants: [{
        id: '1',
        title: 'Default Title',
        price: parseFloat(detectedPrice) || 0,
        compare_at_price: null,
        sku: `SKU-${Date.now()}`,
        inventory_quantity: detectedStock,
        available: !isOutOfStock && detectedStock > 0,
        weight: 0,
        barcode: ''
      }],
      images: images,
      options: [],
      url: url,
      source: 'generic_single'
    };

    await hydrateGenericProductDetails(singleProd, origin, DEFAULT_HEADERS);
    products.push(singleProd);
  }

  return products;
}

module.exports = {
  scrapeGenericSite,
  parseJsonLdProduct,
  scanSpaBundles,
  resolveUniversalImage,
  extractUniversalPrice
};
