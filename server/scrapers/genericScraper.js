const cheerio = require('cheerio');
const axios = require('axios');
const { fetchWithBrowserFallback } = require('./detector');

/**
 * Universal Image URL Extractor with Hotlink & Lazy-load resolution
 */
function resolveUniversalImage($el, $, origin) {
  let imgEl = $el.find('img').first();
  if (imgEl.length === 0 && $el.is('img')) imgEl = $el;

  const attributes = [
    'data-src', 'data-original', 'data-lazy-src', 'data-lazy',
    'data-hi-res-src', 'data-large_image', 'data-zoom-image',
    'data-img', 'data-url', 'data-srcset', 'srcset', 'src'
  ];

  let bestSrc = '';
  for (const attr of attributes) {
    const val = imgEl.attr(attr);
    if (val && !val.includes('data:image') && !val.includes('placeholder') && !val.includes('blank.gif') && !val.includes('loading') && !val.includes('logo') && !val.includes('icon')) {
      bestSrc = val.split(',')[0].trim().split(' ')[0].trim();
      break;
    }
  }

  // Fallback: check noscript
  if (!bestSrc) {
    const noscript = $el.find('noscript').html() || '';
    if (noscript.includes('<img')) {
      const match = noscript.match(/src=["'](https?:[^"']+)["']/i) || noscript.match(/src=["']([^"']+)["']/i);
      if (match && !match[1].includes('logo') && !match[1].includes('icon')) bestSrc = match[1];
    }
  }

  if (!bestSrc) return '';

  if (bestSrc.startsWith('//')) bestSrc = `https:${bestSrc}`;
  else if (bestSrc.startsWith('/') && origin) bestSrc = `${origin}${bestSrc}`;

  // Clean up size caps & query params (Do not touch Ryans storage paths)
  bestSrc = bestSrc.replace(/_\d+x\d+[^.]*\.jpg/i, '.jpg')
                   .replace(/_\d+x\d+[^.]*\.png/i, '.png')
                   .replace(/_\d+x\d+[^.]*\.webp/i, '.webp')
                   .replace(/-\d+x\d+\.(jpg|jpeg|png|webp)/i, '.$1');

  return bestSrc;
}

/**
 * Universal Price Extractor
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

  if ($el.find('.price-old, del, .old-price, .strike').length > 0) {
    regPrice = $el.find('.price-old, del, .old-price, .strike').text().replace(/[^0-9.]/g, '');
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
function parseJsonLdProduct(item, origin, fallbackUrl) {
  if (!item) return null;
  const title = item.name || item.headline;
  if (!title) return null;

  let price = 0;
  let regularPrice = 0;
  let currency = 'USD';
  let sku = item.sku || item.productID || item.mpn || `SKU-${Date.now()}`;
  let inStock = true;

  if (item.offers) {
    const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
    price = parseFloat(offer.price || offer.lowPrice || offer.highPrice || 0) || 0;
    regularPrice = parseFloat(offer.highPrice || offer.price || price) || price;
    currency = offer.priceCurrency || (fallbackUrl.includes('.bd') ? 'BDT' : 'USD');
    if (offer.availability) {
      inStock = !offer.availability.includes('OutOfStock');
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

  return {
    id: String(item.sku || Date.now() + Math.random()),
    title: title,
    handle: handle,
    description: (item.description || title).trim(),
    vendor: brand,
    product_type: category,
    tags: [category].filter(Boolean),
    status: 'active',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    price: price,
    regular_price: regularPrice >= price ? regularPrice : price,
    currency: currency,
    variants: [{
      id: '1',
      title: 'Default Title',
      price: price,
      compare_at_price: regularPrice > price ? regularPrice : null,
      sku: String(sku),
      inventory_quantity: inStock ? 99 : 0,
      available: inStock,
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
function extractNextJsProducts(html, origin, maxProducts = 5000) {
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
              description: itemJson.description || `${title} - Available on Wafilife.`,
              vendor: itemJson.author || itemJson.publisher || 'Wafilife',
              product_type: itemJson.category || 'Books',
              tags: [itemJson.category, itemJson.author].filter(Boolean),
              status: 'active',
              published_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              price: price,
              regular_price: regPrice >= price ? regPrice : price,
              currency: 'BDT',
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
async function scanSpaBundles(html, origin, maxProducts = 5000, onLog) {
  const $ = cheerio.load(html);
  const scriptUrls = [];
  $('script[src]').each((_, el) => {
    let src = $(el).attr('src');
    if (src) {
      if (src.startsWith('/')) src = `${origin}${src}`;
      scriptUrls.push(src);
    }
  });

  const products = [];

  for (const sUrl of scriptUrls.slice(0, 5)) {
    try {
      const res = await fetchWithBrowserFallback(sUrl, 6000);
      const code = res.data;
      if (typeof code !== 'string') continue;

      const backendUrls = [...code.matchAll(/https?:\/\/[a-zA-Z0-9_.-]+(?:\.onrender\.com|\.vercel\.app|\.railway\.app|\.cyclic\.app|\.herokuapp\.com)/g)].map(m => m[0]);
      const uniqueBackends = [...new Set(backendUrls)].filter(u => 
        !u.includes('firebase') && !u.includes('google') && !u.includes('facebook') &&
        !u.includes('localhost') && !u.includes('127.0.0.1') && !u.includes('192.168.')
      );

      const testPaths = [
        '/services?limit=5000',
        '/products?limit=5000',
        '/items?limit=5000',
        '/api/products?limit=5000',
        '/api/services?limit=5000',
        '/api/items?limit=5000'
      ];

      for (const backend of uniqueBackends) {
        for (const tp of testPaths) {
          try {
            if (onLog) onLog(`Probing SPA backend API: ${backend}${tp}...`);
            const apiRes = await axios.get(`${backend}${tp}`, { timeout: 6000 });
            let list = Array.isArray(apiRes.data) ? apiRes.data : (apiRes.data?.data || apiRes.data?.services || apiRes.data?.products || []);

            const totalInBackend = apiRes.data?.total || list.length;
            if (totalInBackend > list.length) {
              const fetchLimit = Math.min(totalInBackend, maxProducts);
              try {
                const fullRes = await axios.get(`${backend}${tp.split('?')[0]}?limit=${fetchLimit}&page=1`, { timeout: 6000 });
                const fullList = Array.isArray(fullRes.data) ? fullRes.data : (fullRes.data?.data || fullRes.data?.services || fullRes.data?.products || []);
                if (fullList.length > list.length) list = fullList;
              } catch (e) {}
            }

            if (Array.isArray(list) && list.length > 0 && (list[0].title || list[0].name)) {
              if (onLog) onLog(`Discovered live backend API! Extracted ${list.length} total items from ${backend}`);
              for (const item of list) {
                if (products.length >= maxProducts) break;
                const title = item.title || item.name;
                const price = parseFloat(item.price || item.cost || item.amount || 0) || 0;
                const img = item.image || item.imageUrl || item.img || (Array.isArray(item.images) ? item.images[0] : '');
                const desc = item.description || item.details || title;
                const category = item.category || 'General';

                products.push({
                  id: String(item._id || item.id || Date.now() + Math.random()),
                  title: title,
                  handle: title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-'),
                  description: desc,
                  vendor: item.serviceProvider || origin.replace(/^https?:\/\//, ''),
                  product_type: category,
                  tags: Array.isArray(item.tags) ? item.tags : [category],
                  status: 'active',
                  published_at: item.createdAt || new Date().toISOString(),
                  created_at: item.createdAt || new Date().toISOString(),
                  price: price,
                  regular_price: price,
                  currency: 'USD',
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
              return products;
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  return products;
}

/**
 * Extracts products from raw Cheerio DOM (Universal Cluster Matching)
 */
function extractProductsFromDom($, origin, currentUrl, maxProducts, onLog) {
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
        const category = $card.find('.sp-text-link, .category, .badge, [class*="category"]').first().text().trim() || (author ? 'Books' : 'General');
        const vendor = author || origin.replace(/^https?:\/\//, '');

        if (title && (price > 0 || img)) {
          const handle = title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/(^-|-$)/g, '') || `item-${Date.now()}-${idx}`;

          if (!products.some(p => p.title === title) && title.length < 150) {
            products.push({
              id: String(Date.now() + idx),
              title,
              handle,
              description: `${title} - Available on ${origin.replace(/^https?:\/\//, '')}.`,
              vendor,
              product_type: category,
              tags: [category, author].filter(Boolean),
              status: 'active',
              published_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              price,
              regular_price: regularPrice >= price ? regularPrice : price,
              currency: (currentUrl.includes('.bd') || origin.includes('.bd') || origin.includes('ryans.com') || origin.includes('wafilife') || origin.includes('rokomari') || origin.includes('ghorerbazar') || origin.includes('startech') || origin.includes('batabd')) ? 'BDT' : 'USD',
              variants: [{
                id: `${Date.now()}-${idx}`,
                title: 'Default Title',
                price,
                compare_at_price: regularPrice > price ? regularPrice : null,
                sku: `SKU-${idx + 1}`,
                inventory_quantity: 99,
                available: true,
                weight: 0,
                barcode: ''
              }],
              images: img ? [{ id: 1, src: img, alt: title, position: 1 }] : [],
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
 * Scrapes products from ANY website worldwide (100% Universal AI-grade Engine)
 */
async function scrapeGenericSite(url, options = {}, onLog) {
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;
  const maxProducts = options.limit || 50;
  let products = [];

  if (onLog) onLog(`Fetching initial page from ${url} with anti-bot protection...`);

  const response = await fetchWithBrowserFallback(url, 12000);
  const html = response.data;
  const $ = cheerio.load(html);

  // 1. Next.js RSC Stream / Wafilife
  if (html.includes('self.__next_f.push')) {
    if (onLog) onLog('Inspecting Next.js React Server Component catalog stream...');
    const nextProds = extractNextJsProducts(html, origin, maxProducts);
    if (nextProds.length > 0) {
      if (onLog) onLog(`Extracted ${nextProds.length} products from Next.js catalog stream!`);
      return nextProds.slice(0, maxProducts);
    }
  }

  // 2. Client-Side SPA Bundles (Only for empty skeleton SPAs like style-decor)
  if (html.length < 3500 && ($('#root').length > 0 || $('#app').length > 0 || $('div#root, div#__next, div#app').length > 0)) {
    if (onLog) onLog('Inspecting SPA JavaScript bundles for connected REST API backend...');
    const spaProducts = await scanSpaBundles(html, origin, maxProducts, onLog);
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
          const prod = parseJsonLdProduct(item, origin, url);
          if (prod && !products.some(p => p.title === prod.title)) {
            products.push(prod);
          }
        }
      }
    } catch (e) {}
  });

  // 4. Universal DOM Cards
  const initialDom = extractProductsFromDom($, origin, url, maxProducts, onLog);
  for (const p of initialDom) {
    if (!products.some(x => x.title === p.title)) products.push(p);
  }

  if (onLog) onLog(`Extracted ${products.length} products from initial page.`);

  // 5. Multi-Category & Deep Crawl if user requested more products or on homepage
  if (products.length < maxProducts) {
    const categoryLinks = [];
    $('a[href]').each((_, el) => {
      let href = $(el).attr('href') || '';
      if (href.startsWith('/')) href = `${origin}${href}`;
      
      const isCat = (
        href.includes('/category') || href.includes('/collection') || href.includes('/shop') ||
        href.includes('/product') || href.includes('/book') || href.includes('/grocery') ||
        href.includes('/laptop') || href.includes('/component') ||
        href.includes('/desktop') || href.includes('/monitor') || href.includes('/accessories') ||
        href.includes('/gadget') || href.includes('/tv') || href.includes('/camera') ||
        href.includes('/shoes') || href.includes('/men') || href.includes('/women')
      );

      if (
        isCat &&
        href.startsWith('http') &&
        href.includes(parsedUrl.hostname) &&
        !categoryLinks.includes(href) &&
        href !== url &&
        href !== `${origin}/` &&
        !href.includes('#') &&
        !href.includes('cart') &&
        !href.includes('login') &&
        !href.includes('checkout')
      ) {
        categoryLinks.push(href);
      }
    });

    if (categoryLinks.length > 0) {
      if (onLog) onLog(`Discovered ${categoryLinks.length} category catalog paths. Deep-crawling store catalog...`);
      for (const catUrl of categoryLinks.slice(0, 15)) {
        if (products.length >= maxProducts) break;
        try {
          if (onLog) onLog(`Crawling category: ${catUrl}...`);
          const catRes = await fetchWithBrowserFallback(catUrl, 9000);
          const $cat = cheerio.load(catRes.data);
          const catProducts = extractProductsFromDom($cat, origin, catUrl, maxProducts, onLog);
          
          for (const cp of catProducts) {
            if (products.length >= maxProducts) break;
            if (!products.some(p => p.title === cp.title)) {
              products.push(cp);
            }
          }
          if (onLog) onLog(`Total catalog size now: ${products.length} products...`);
        } catch (e) {}
      }
    }
  }

  if (products.length > 0) {
    if (onLog) onLog(`Completed catalog extraction with ${products.length} total products!`);
    return products.slice(0, maxProducts);
  }

  // 6. Single Product Fallback
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

    products.push({
      id: String(Date.now()),
      title: ogTitle,
      handle: ogTitle.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-'),
      description: ogDesc || ogTitle,
      vendor: origin.replace(/^https?:\/\//, ''),
      product_type: 'General',
      tags: ['Single Product'],
      status: 'active',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      price: parseFloat(detectedPrice) || 0,
      regular_price: parseFloat(detectedPrice) || 0,
      currency: 'BDT',
      variants: [{
        id: '1',
        title: 'Default Title',
        price: parseFloat(detectedPrice) || 0,
        compare_at_price: null,
        sku: `SKU-${Date.now()}`,
        inventory_quantity: 99,
        available: true,
        weight: 0,
        barcode: ''
      }],
      images: images,
      options: [],
      url: url,
      source: 'generic_single'
    });
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
