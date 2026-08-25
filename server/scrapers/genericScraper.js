const cheerio = require('cheerio');
const axios = require('axios');
const { fetchWithBrowserFallback } = require('./detector');

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

  for (const sUrl of scriptUrls) {
    try {
      const res = await fetchWithBrowserFallback(sUrl, 8000);
      const code = res.data;
      if (typeof code !== 'string') continue;

      const backendUrls = [...code.matchAll(/https?:\/\/[a-zA-Z0-9_.-]+(?:\.onrender\.com|\.vercel\.app|\.railway\.app|\.cyclic\.app|\.herokuapp\.com|[a-zA-Z0-9_.-]+:\d+)/g)].map(m => m[0]);
      const uniqueBackends = [...new Set(backendUrls)].filter(u => !u.includes('firebase') && !u.includes('google') && !u.includes('facebook'));

      const testPaths = [
        '/services?limit=5000',
        '/products?limit=5000',
        '/items?limit=5000',
        '/api/products?limit=5000',
        '/api/services?limit=5000',
        '/api/items?limit=5000',
        '/packages?limit=5000',
        '/services',
        '/products',
        '/items'
      ];

      for (const backend of uniqueBackends) {
        for (const tp of testPaths) {
          try {
            if (onLog) onLog(`Probing SPA backend API endpoint: ${backend}${tp}...`);
            const apiRes = await axios.get(`${backend}${tp}`, { timeout: 8000 });
            let list = Array.isArray(apiRes.data) ? apiRes.data : (apiRes.data?.data || apiRes.data?.services || apiRes.data?.products || []);

            const totalInBackend = apiRes.data?.total || list.length;
            if (totalInBackend > list.length) {
              const fetchLimit = Math.min(totalInBackend, maxProducts);
              try {
                const fullRes = await axios.get(`${backend}${tp.split('?')[0]}?limit=${fetchLimit}&page=1`, { timeout: 8000 });
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
 * Extracts products from raw Cheerio DOM (supports Star Tech, Ryans, Rokomari, Wafilife, Ghorer Bazar)
 */
function extractProductsFromDom($, origin, currentUrl, maxProducts, onLog) {
  const products = [];

  const cardSelectors = [
    '.p-item', '.book-list-wrapper', '.bookCard', '.home-carousel-item',
    '.product', 'li.product', '.product-card', '.product-item', '.product-box',
    '.grid-product', 'article.product', '.shop-item', '.catalog-item',
    '[itemtype*="Product"]', '.c-product', '.product-thumb',
    '.box-product', '.product-layout', '.product-wrap',
    '[data-mesh-id*="products"]', '[title]'
  ];

  const brandBlacklist = new Set([
    'apple', 'acer', 'asus', 'dell', 'hp', 'lenovo', 'microsoft',
    'msi', 'gigabyte', 'samsung', 'huawei', 'walton', 'sony', 'canon',
    'cart', 'menu', 'search', 'login', 'register', 'home', 'shop', 'inquiry',
    'categories', 'filter', 'sort', 'view all', 'read more', 'search toggle',
    'wafilife', 'rokomari', 'ghorer bazar'
  ]);

  for (const sel of cardSelectors) {
    const cards = $(sel);
    if (cards.length >= 1) {
      cards.each((idx, el) => {
        if (products.length >= maxProducts) return;
        const $card = $(el);

        // Find Image
        const imgEl = $card.find('img').first();
        let imgSrc = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy') || imgEl.attr('srcset')?.split(' ')[0] || '';
        if (imgSrc.startsWith('//')) imgSrc = `https:${imgSrc}`;
        else if (imgSrc.startsWith('/')) imgSrc = `${origin}${imgSrc}`;

        if (imgSrc.includes('/storage/products/small/')) {
          imgSrc = imgSrc.replace('/storage/products/small/', '/storage/products/large/');
        } else if (imgSrc.includes('/small/')) {
          imgSrc = imgSrc.replace('/small/', '/large/');
        }

        // Find Title
        let title = $card.find('.p-item-name a, .book-title, .woocommerce-loop-product__title, .card-title, .product-title, h2, h3, h4, .title, [class*="title"], [class*="name"], p.card-text a, a.card-link').first().text().trim() ||
          $card.attr('title')?.trim() ||
          imgEl.attr('alt') || '';
        
        if (!title && $card.is('a')) {
          title = $card.text().trim();
        }

        if (title) {
          title = title.replace(/\s+/g, ' ').trim();
        }

        if (!title || title.length < 3 || brandBlacklist.has(title.toLowerCase())) {
          return;
        }

        // Find Price
        let priceStr = '0';
        let regularPriceStr = '0';
        const priceElement = $card.find('.price-new, .sp-text, .special-price, .p-item-price, .book-price, .pr-text, .price, .product-price, .amount, .text-primary, [class*="price"]').first();
        let priceText = priceElement.text() || $card.text();

        if ($card.find('.price-old').length > 0) {
          regularPriceStr = $card.find('.price-old').text().replace(/[^0-9.]/g, '');
          priceText = $card.find('.price-new').text() || priceText.replace($card.find('.price-old').text(), '');
        }

        const match = priceText.match(/(?:Tk|৳|TK\.|\$|£|€|₹)?\s*([0-9,]+(?:\.[0-9]{2})?)/i) ||
                      priceText.match(/([0-9,]+)\s*(?:Tk|৳|TK)/i);
        if (match && match[1]) {
          priceStr = match[1].replace(/,/g, '');
        }

        // Find Link
        const linkEl = $card.find('.p-item-name a, a[href*="/book/"], a[href*="/product/"], a[href*="/shop/"], a').first();
        let link = linkEl.attr('href') || ($card.is('a') ? $card.attr('href') : currentUrl);
        if (link && link.startsWith('/')) link = `${origin}${link}`;

        // Find Author / Vendor / Category
        const author = $card.find('.book-author, .author, [class*="author"]').first().text().trim();
        const category = $card.find('.sp-text-link, .category, .badge, [class*="category"]').first().text().trim() || (author ? 'Books' : 'General');
        const vendor = author || origin.replace(/^https?:\/\//, '');

        if (title && (parseFloat(priceStr) > 0 || (imgSrc && (imgSrc.includes('product') || imgSrc.includes('storage') || imgSrc.includes('upload') || imgSrc.includes('image/cache') || imgSrc.includes('rokomari') || imgSrc.includes('wafilife'))))) {
          const handle = title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/(^-|-$)/g, '') || `item-${Date.now()}-${idx}`;

          if (!products.some(p => p.title === title)) {
            const parsedPrice = parseFloat(priceStr) || 0;
            const parsedRegular = parseFloat(regularPriceStr) || parsedPrice;

            products.push({
              id: String(Date.now() + idx),
              title: title,
              handle: handle,
              description: `${title} - Available on ${origin.replace(/^https?:\/\//, '')}.`,
              vendor: vendor,
              product_type: category,
              tags: [category, author].filter(Boolean),
              status: 'active',
              published_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              price: parsedPrice,
              regular_price: parsedRegular >= parsedPrice ? parsedRegular : parsedPrice,
              currency: priceText.includes('Tk') || priceText.includes('৳') || priceText.includes('TK') || currentUrl.includes('.bd') || origin.includes('.bd') ? 'BDT' : 'USD',
              variants: [{
                id: `${Date.now()}-${idx}`,
                title: 'Default Title',
                price: parsedPrice,
                compare_at_price: parsedRegular > parsedPrice ? parsedRegular : null,
                sku: `SKU-${idx + 1}`,
                inventory_quantity: 99,
                available: true,
                weight: 0,
                barcode: ''
              }],
              images: imgSrc ? [{ id: 1, src: imgSrc, alt: title, position: 1 }] : [],
              options: [],
              url: link || currentUrl,
              source: 'generic_html'
            });
          }
        }
      });

      if (products.length >= 10 || (products.length > 0 && products.some(p => p.price > 0))) {
        break;
      }
    }
  }

  return products;
}

/**
 * Scrapes products from any generic e-commerce, Wix, Ryans, Star Tech, Rokomari, Wafilife, Ghorer Bazar, or custom React/Vercel SPA website
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

  // 1. Scan Client-Side SPA Bundles (React / Vite / Vercel apps like style-decor)
  if (html.length < 3000 || $('script[src*="assets/"], script[src*="static/"]').length > 0) {
    if (onLog) onLog('Inspecting SPA JavaScript bundles for connected REST API backend...');
    const spaProducts = await scanSpaBundles(html, origin, maxProducts, onLog);
    if (spaProducts.length > 0) {
      if (onLog) onLog(`Successfully extracted ${spaProducts.length} total products from SPA backend!`);
      return spaProducts.slice(0, maxProducts);
    }
  }

  // 2. Check for JSON-LD scripts
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

  // 3. Extract initial DOM cards (Star Tech, Rokomari, Wafilife, Ghorer Bazar, Ryans)
  const initialDom = extractProductsFromDom($, origin, url, maxProducts, onLog);
  for (const p of initialDom) {
    if (!products.some(x => x.title === p.title)) products.push(p);
  }

  if (onLog) onLog(`Extracted ${products.length} products from initial page.`);

  // 4. Multi-Category & Deep Crawl if user requested more products or on homepage
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

  // 5. Single Product Fallback
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
  scanSpaBundles
};
