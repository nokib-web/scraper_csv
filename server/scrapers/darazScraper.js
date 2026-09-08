const axios = require('axios');
const cheerio = require('cheerio');
const { fetchWithBrowserFallback } = require('./detector');
const { detectStoreCurrency } = require('./currencyHelper');

function normalizeDarazItem(it, origin, defaultCurrency = 'BDT') {
  const title = it.name || it.title || 'Daraz Product';
  const handle = title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/(^-|-$)/g, '') || `item-${it.itemId || Date.now()}`;
  const price = parseFloat(it.price || it.priceShow || 0) || 0;
  const regularPrice = parseFloat(it.originalPrice || it.price || price) || price;
  
  let img = it.image ? (it.image.startsWith('//') ? `https:${it.image}` : it.image) : '';
  img = img.replace(/_\d+x\d+[^.]*\.jpg/i, '');

  let link = it.itemUrl ? (it.itemUrl.startsWith('//') ? `https:${it.itemUrl}` : it.itemUrl) : origin;
  if (!link.startsWith('http')) link = `${origin}${link.startsWith('/') ? '' : '/'}${link}`;

  const category = it.category || 'General';

  return {
    id: String(it.itemId || Date.now() + Math.random()),
    title: title,
    handle: handle,
    description: `${title} - Available on ${origin.replace(/^https?:\/\//, '')}.`,
    vendor: it.sellerName || 'Daraz Seller',
    product_type: category,
    tags: [category].filter(Boolean),
    status: 'active',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    price: price,
    regular_price: regularPrice,
    currency: it.currency || defaultCurrency || 'BDT',
    variants: [{
      id: '1',
      title: 'Default Title',
      price: price,
      compare_at_price: regularPrice > price ? regularPrice : null,
      sku: it.skuId || `SKU-${it.itemId || Date.now()}`,
      inventory_quantity: 99,
      available: true
    }],
    images: img ? [{ id: 1, src: img, alt: title, position: 1 }] : [],
    url: link,
    source: 'daraz'
  };
}

/**
 * Scrapes Daraz / Lazada categories, searches, seller stores, or homepage with full pagination
 */
async function scrapeDarazCatalog(url, options = {}, onLog) {
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;
  const maxProducts = options.limit || 50;
  const products = [];
  const detectedCurrency = detectStoreCurrency('', url);

  let targetUrl = url;
  const isHome = parsedUrl.pathname === '/' || parsedUrl.pathname === '';

  let page = 1;
  const maxPages = maxProducts >= 500 ? 50 : Math.ceil(maxProducts / 40) + 1;

  if (isHome) {
    if (onLog) onLog(`Deep Scraping Daraz Marketplace Categories & Flash Deals...`);

    // Popular categories to pull huge catalog from Daraz
    const exploreCategories = [
      'routers', 'smartphones', 'smart-watches', 'audio', 'laptops',
      'mens-fashion', 'womens-fashion', 'groceries', 'health-beauty',
      'home-appliances', 'electronic-accessories', 'motors'
    ];

    for (const cat of exploreCategories) {
      if (products.length >= maxProducts) break;
      if (onLog) onLog(`Fetching Daraz /${cat}/ category items...`);
      
      let catPage = 1;
      while (products.length < maxProducts && catPage <= 3) {
        try {
          const catRes = await fetchWithBrowserFallback(`${origin}/${cat}/?ajax=true&page=${catPage}`, 9000);
          const items = catRes.data?.mods?.listItems;
          if (Array.isArray(items) && items.length > 0) {
            for (const it of items) {
              if (products.length >= maxProducts) break;
              const norm = normalizeDarazItem(it, origin, detectedCurrency);
              if (!products.some(p => p.title === norm.title)) {
                products.push(norm);
              }
            }
            if (onLog) onLog(`Extracted ${products.length} products so far from Daraz...`);
            catPage++;
          } else {
            break;
          }
        } catch (e) {
          break;
        }
      }
    }

    if (products.length > 0) {
      if (onLog) onLog(`Completed Daraz deep extraction with ${products.length} total products!`);
      return products;
    }
  }

  // Category, Search, or Shop URL
  if (onLog) onLog(`Connecting to Daraz Catalog Stream for ${url}...`);

  while (products.length < maxProducts && page <= maxPages) {
    const cleanUrl = targetUrl.replace(/([?&])page=\d+/g, '').replace(/([?&])ajax=true/g, '');
    const pageUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}ajax=true&page=${page}`;

    if (onLog) onLog(`Fetching Daraz page ${page}...`);

    try {
      const res = await fetchWithBrowserFallback(pageUrl, 10000);
      let items = [];

      if (typeof res.data === 'object' && res.data.mods?.listItems) {
        items = res.data.mods.listItems;
      } else if (typeof res.data === 'string') {
        const match = res.data.match(/window\.pageData\s*=\s*(\{.*?\});/s) || res.data.match(/\{.*"listItems":\[.*\]\}/s);
        if (match) {
          try {
            const parsed = JSON.parse(match[1] || match[0]);
            items = parsed.mods?.listItems || [];
          } catch (e) {}
        }
      }

      if (!items || items.length === 0) {
        if (onLog) onLog(`Reached end of Daraz catalog.`);
        break;
      }

      for (const it of items) {
        if (products.length >= maxProducts) break;
        const norm = normalizeDarazItem(it, origin, detectedCurrency);
        if (!products.some(p => p.title === norm.title)) {
          products.push(norm);
        }
      }

      if (onLog) onLog(`Extracted ${products.length} total products so far...`);

      if (items.length < 20) break;
      page++;
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      if (onLog) onLog(`Page ${page} failed: ${e.message}`);
      break;
    }
  }

  return products;
}

module.exports = {
  scrapeDarazCatalog,
  normalizeDarazItem
};
