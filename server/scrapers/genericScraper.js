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
 * Extracts Daraz / Lazada marketplace products
 */
function extractDarazProducts(html, origin) {
  const $ = cheerio.load(html);
  const products = [];

  // 1. window.pageData
  $('script').each((_, el) => {
    const text = $(el).html() || '';
    if (text.includes('window.pageData') || text.includes('listItems')) {
      const match = text.match(/window\.pageData\s*=\s*(\{.*?\});/s) || text.match(/\{.*"listItems":\[.*\]\}/s);
      if (match) {
        try {
          const data = JSON.parse(match[1] || match[0]);
          const items = data.mods?.listItems || [];
          for (const it of items) {
            const title = it.name || it.title;
            const price = parseFloat(it.price || it.priceShow || 0) || 0;
            const regularPrice = parseFloat(it.originalPrice || it.price || price) || price;
            let img = it.image ? (it.image.startsWith('//') ? `https:${it.image}` : it.image) : '';
            img = img.replace(/_\d+x\d+[^.]*\.jpg/i, '');
            const link = it.itemUrl ? (it.itemUrl.startsWith('//') ? `https:${it.itemUrl}` : it.itemUrl) : origin;

            if (title && !products.some(p => p.title === title)) {
              products.push({
                id: String(it.itemId || Date.now() + Math.random()),
                title,
                handle: title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-'),
                description: title,
                vendor: it.sellerName || 'Daraz Seller',
                product_type: it.category || 'General',
                tags: [it.category].filter(Boolean),
                status: 'active',
                published_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                price,
                regular_price: regularPrice,
                currency: 'BDT',
                variants: [{
                  id: '1',
                  title: 'Default Title',
                  price,
                  compare_at_price: regularPrice > price ? regularPrice : null,
                  sku: it.skuId || `SKU-${it.itemId || Date.now()}`,
                  inventory_quantity: 99,
                  available: true
                }],
                images: img ? [{ id: 1, src: img, alt: title, position: 1 }] : [],
                url: link,
                source: 'daraz_json'
              });
            }
          }
        } catch (e) {}
      }
    }
  });

  // 2. Extract from product anchors
  $('a[href*="/products/"]').each((idx, el) => {
    const $a = $(el);
    const href = $a.attr('href') || '';
    const imgEl = $a.find('img').first();
    let imgSrc = imgEl.attr('src') || imgEl.attr('data-src') || '';
    if (imgSrc.startsWith('//')) imgSrc = `https:${imgSrc}`;
    imgSrc = imgSrc.replace(/_\d+x\d+[^.]*\.jpg/i, '');

    let title = imgEl.attr('alt') || '';
    if (!title) {
      const match = href.match(/\/products\/([a-zA-Z0-9_-]+)-i\d+/);
      if (match) title = match[1].replace(/-/g, ' ');
    }
    if (!title) {
      title = $a.text().split('৳')[0].trim();
    }
    title = title.replace(/\s+/g, ' ').trim();

    let price = 0;
    const priceMatch = href.match(/price%3A(\d+)/i) || $a.text().match(/৳\s*([0-9,]+)/i);
    if (priceMatch) {
      price = parseFloat(priceMatch[1].replace(/,/g, ''));
    }

    if (title && title.length > 5 && !products.some(p => p.title === title)) {
      products.push({
        id: String(Date.now() + idx),
        title,
        handle: title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-'),
        description: title,
        vendor: 'Daraz',
        product_type: 'General',
        tags: ['Daraz'],
        status: 'active',
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        price: price,
        regular_price: price,
        currency: 'BDT',
        variants: [{
          id: '1',
          title: 'Default Title',
          price: price,
          sku: `SKU-${idx + 1}`,
          inventory_quantity: 99,
          available: true
        }],
        images: imgSrc ? [{ id: 1, src: imgSrc, alt: title, position: 1 }] : [],
        url: href.startsWith('//') ? `https:${href}` : href,
        source: 'daraz_html'
      });
    }
  });

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

  for (const sUrl of scriptUrls) {
    try {
      const res = await fetchWithBrowserFallback(sUrl, 8000);
      const code = res.data;
      if (typeof code !== 'string') continue;

      // Extract backend API base URLs
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

            // If response has total and pagination, fetch all pages if needed
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
 * Extracts products from raw Cheerio DOM
 */
function extractProductsFromDom($, origin, currentUrl, maxProducts, onLog) {
  const products = [];

  const cardSelectors = [
    '.card', '.cus-col-2', '.product-card', '.product-item', '.product-box',
    '.grid-product', 'article.product', '.shop-item', '.catalog-item',
    '[itemtype*="Product"]', '.c-product', '.product-thumb', '.p-item',
    '.box-product', '.product-layout', '.product-wrap', '.product',
    '[data-mesh-id*="products"]', '.wixui-button'
  ];

  const brandBlacklist = new Set([
    'apple', 'acer', 'asus', 'dell', 'hp', 'lenovo', 'microsoft',
    'msi', 'gigabyte', 'samsung', 'huawei', 'walton', 'sony', 'canon',
    'cart', 'menu', 'search', 'login', 'register', 'home', 'shop', 'inquiry'
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

        // Up-scale image if it has /small/ or _small
        if (imgSrc.includes('/storage/products/small/')) {
          imgSrc = imgSrc.replace('/storage/products/small/', '/storage/products/large/');
        } else if (imgSrc.includes('/small/')) {
          imgSrc = imgSrc.replace('/small/', '/large/');
        }

        // Find Title
        let title = imgEl.attr('alt') ||
          $card.find('.card-title, .product-title, h2, h3, h4, .title, [class*="title"], [class*="name"], p.card-text a, a.card-link').first().text().trim();
        
        if (!title && $card.is('a')) {
          title = $card.text().trim();
        }

        if (title) {
          title = title.replace(/\s+/g, ' ').trim();
        }

        // Clean out invalid / short / blacklisted logo names
        if (!title || title.length < 3 || brandBlacklist.has(title.toLowerCase())) {
          return;
        }

        // Find Price
        let priceStr = '0';
        const priceElement = $card.find('.price-new, .sp-text, .special-price, .p-item-price, .pr-text, .price, .product-price, .amount, .text-primary, [class*="price"]').first();
        let priceText = priceElement.text() || $card.text();
        if ($card.find('.price-old').length > 0) {
          priceText = $card.find('.price-new').text() || priceText.replace($card.find('.price-old').text(), '');
        }

        const match = priceText.match(/(?:Tk|৳|\$|£|€|₹)?\s*([0-9,]+(?:\.[0-9]{2})?)/);
        if (match && match[1]) {
          priceStr = match[1].replace(/,/g, '');
        }

        // Find Link
        const linkEl = $card.find('a').first();
        let link = linkEl.attr('href') || ($card.is('a') ? $card.attr('href') : currentUrl);
        if (link && link.startsWith('/')) link = `${origin}${link}`;

        // Find Brand / Category
        const category = $card.find('.sp-text-link, .category, .badge, [class*="category"]').first().text().trim() || 'General';

        if (title && (parseFloat(priceStr) > 0 || (imgSrc && (imgSrc.includes('product') || imgSrc.includes('storage') || imgSrc.includes('upload') || imgSrc.includes('wixstatic'))))) {
          const handle = title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/(^-|-$)/g, '') || `item-${Date.now()}-${idx}`;

          if (!products.some(p => p.title === title)) {
            products.push({
              id: String(Date.now() + idx),
              title: title,
              handle: handle,
              description: `${title} - High quality product available on store.`,
              vendor: origin.replace(/^https?:\/\//, ''),
              product_type: category,
              tags: [category].filter(Boolean),
              status: 'active',
              published_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              price: parseFloat(priceStr) || 0,
              regular_price: parseFloat(priceStr) || 0,
              currency: priceText.includes('Tk') || priceText.includes('৳') || currentUrl.includes('.bd') ? 'BDT' : 'USD',
              variants: [{
                id: `${Date.now()}-${idx}`,
                title: 'Default Title',
                price: parseFloat(priceStr) || 0,
                compare_at_price: null,
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

      if (products.length >= 5 || (products.length > 0 && products.some(p => p.price > 0))) {
        break;
      }
    }
  }

  return products;
}

/**
 * Scrapes products from any generic e-commerce, Wix, Ryans, Daraz, or custom React/Vercel SPA website
 */
async function scrapeGenericSite(url, options = {}, onLog) {
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;
  const maxProducts = options.limit || 50;
  let products = [];

  if (onLog) onLog(`Fetching page HTML from ${url} with anti-bot protection...`);

  const response = await fetchWithBrowserFallback(url, 12000);
  const html = response.data;
  const $ = cheerio.load(html);

  // 1. Check if Daraz / Lazada
  if (url.includes('daraz') || url.includes('lazada') || html.includes('daraz') || html.includes('lazada')) {
    if (onLog) onLog('Executing Daraz Marketplace Extractor...');
    const darazProducts = extractDarazProducts(html, origin);
    if (darazProducts.length > 0) {
      if (onLog) onLog(`Extracted ${darazProducts.length} products from Daraz!`);
      return darazProducts.slice(0, maxProducts);
    }
  }

  // 2. Scan Client-Side SPA Bundles (React / Vite / Vercel apps like style-decor)
  if (html.length < 3000 || $('script[src*="assets/"], script[src*="static/"]').length > 0) {
    if (onLog) onLog('Inspecting SPA JavaScript bundles for connected REST API backend...');
    const spaProducts = await scanSpaBundles(html, origin, maxProducts, onLog);
    if (spaProducts.length > 0) {
      if (onLog) onLog(`Successfully extracted ${spaProducts.length} total products from SPA backend!`);
      return spaProducts.slice(0, maxProducts);
    }
  }

  // 3. Check for JSON-LD scripts
  if (onLog) onLog('Searching for structured JSON-LD Schema.org product data...');
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const jsonText = $(el).html();
      if (!jsonText) return;
      const parsed = JSON.parse(jsonText);

      const candidates = [];
      if (Array.isArray(parsed)) {
        candidates.push(...parsed);
      } else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
        candidates.push(...parsed['@graph']);
      } else {
        candidates.push(parsed);
      }

      for (const item of candidates) {
        if (products.length >= maxProducts) break;
        if (item['@type'] === 'Product' || item['@type']?.includes?.('Product')) {
          const prod = parseJsonLdProduct(item, origin, url);
          if (prod && !products.some(p => p.title === prod.title)) {
            products.push(prod);
          }
        } else if (item['@type'] === 'ItemList' && Array.isArray(item.itemListElement)) {
          for (const elem of item.itemListElement) {
            if (products.length >= maxProducts) break;
            const subItem = elem.item || elem;
            if (subItem['@type'] === 'Product' || subItem.name) {
              const prod = parseJsonLdProduct(subItem, origin, url);
              if (prod && !products.some(p => p.title === prod.title)) {
                products.push(prod);
              }
            }
          }
        }
      }
    } catch (e) {}
  });

  const validJsonLd = products.filter(p => p.title && (p.price > 0 || (p.images && p.images.length > 0)));
  if (validJsonLd.length >= 3) {
    if (onLog) onLog(`Successfully extracted ${validJsonLd.length} products via JSON-LD!`);
    return validJsonLd;
  }

  // 4. Extract from DOM cards
  if (onLog) onLog('Parsing HTML product cards & semantic grid elements...');
  const domProducts = extractProductsFromDom($, origin, url, maxProducts, onLog);
  if (domProducts.length > 0) {
    if (onLog) onLog(`Successfully extracted ${domProducts.length} products from HTML elements!`);
    return domProducts;
  }

  // 5. Deep Discovery: Look for collection or catalog links (e.g. /the-collection, /shop, /products, /catalog)
  const categoryLinks = [];
  $('a[href*="collection"], a[href*="category"], a[href*="products"], a[href*="shop"], a[href*="catalog"], a[href*="services"]').each((_, el) => {
    let href = $(el).attr('href') || '';
    if (href.startsWith('/')) href = `${origin}${href}`;
    if (href.startsWith('http') && !categoryLinks.includes(href) && href !== url && href !== `${origin}/` && !href.includes('apple') && !href.includes('google')) {
      categoryLinks.push(href);
    }
  });

  if (categoryLinks.length > 0) {
    for (const catUrl of categoryLinks.slice(0, 3)) {
      if (onLog) onLog(`Crawling store collection page: ${catUrl}...`);
      try {
        const catRes = await fetchWithBrowserFallback(catUrl, 10000);
        const $cat = cheerio.load(catRes.data);
        const catProducts = extractProductsFromDom($cat, origin, catUrl, maxProducts, onLog);
        if (catProducts.length > 0) {
          if (onLog) onLog(`Extracted ${catProducts.length} products from collection page!`);
          return catProducts;
        }

        // Try scanning SPA bundle on subpage as well
        const subSpa = await scanSpaBundles(catRes.data, origin, maxProducts, onLog);
        if (subSpa.length > 0) {
          return subSpa.slice(0, maxProducts);
        }
      } catch (e) {}
    }
  }

  // 6. Single Product Fallback
  const ogTitle = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim();
  const ogImage = $('meta[property="og:image"]').attr('content');
  const ogDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
  const priceSelectors = ['.sp-text', '.price', '.product-price', '.offer-price', '[itemprop="price"]', '.current-price', '.amount', '[data-price]'];
  let detectedPrice = '0';
  for (const sel of priceSelectors) {
    const txt = $(sel).first().text().replace(/[^0-9.]/g, '');
    if (txt && parseFloat(txt) > 0) {
      detectedPrice = txt;
      break;
    }
  }

  if (ogTitle && ogTitle.length > 3) {
    if (onLog) onLog(`Extracted product "${ogTitle}" from page metadata.`);
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
      currency: 'USD',
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
  extractDarazProducts,
  scanSpaBundles
};
