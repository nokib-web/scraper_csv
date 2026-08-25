const axios = require('axios');
const cheerio = require('cheerio');
const { fetchWithBrowserFallback } = require('./detector');

function normalizeDarazItem(it, origin) {
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
    description: `${title} - Available on Daraz Bangladesh.`,
    vendor: it.sellerName || 'Daraz Seller',
    product_type: category,
    tags: [category].filter(Boolean),
    status: 'active',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    price: price,
    regular_price: regularPrice,
    currency: 'BDT',
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

  let targetUrl = url;
  // If user passed root domain (https://www.daraz.com.bd or https://www.daraz.com.bd/), target flash sales or popular category
  const isHome = parsedUrl.pathname === '/' || parsedUrl.pathname === '';

  let page = 1;
  const maxPages = maxProducts >= 500 ? 25 : Math.ceil(maxProducts / 40) + 1;

  if (isHome) {
    if (onLog) onLog(`Scraping Daraz Marketplace catalog & Flash Deals...`);
    // First fetch homepage HTML for flash deals
    const res = await fetchWithBrowserFallback(url, 10000);
    const $ = cheerio.load(res.data);

    // Extract flash sales
    $('a[href*="/products/"]').each((idx, el) => {
      if (products.length >= maxProducts) return;
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
      if (!title) title = $a.text().split('৳')[0].trim();
      title = title.replace(/\s+/g, ' ').trim();

      let price = 0;
      const priceMatch = href.match(/price%3A(\d+)/i) || $a.text().match(/৳\s*([0-9,]+)/i);
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(/,/g, ''));
      }

      if (title && title.length > 5 && !products.some(p => p.title === title)) {
        products.push(normalizeDarazItem({
          itemId: String(Date.now() + idx),
          name: title,
          price: price,
          image: imgSrc,
          itemUrl: href
        }, origin));
      }
    });

    if (onLog) onLog(`Extracted ${products.length} featured flash sale products from homepage.`);

    // If user requested more products, fetch from popular categories
    const exploreCategories = ['smartphones', 'routers', 'smart-watches', 'laptops', 'mens-fashion', 'womens-fashion'];
    for (const cat of exploreCategories) {
      if (products.length >= maxProducts) break;
      if (onLog) onLog(`Expanding Daraz catalog: Fetching /${cat}/ category...`);
      try {
        const catRes = await fetchWithBrowserFallback(`${origin}/${cat}/?ajax=true&page=1`, 8000);
        if (catRes.data?.mods?.listItems) {
          for (const it of catRes.data.mods.listItems) {
            if (products.length >= maxProducts) break;
            const norm = normalizeDarazItem(it, origin);
            if (!products.some(p => p.title === norm.title)) {
              products.push(norm);
            }
          }
          if (onLog) onLog(`Catalog count now: ${products.length} products...`);
        }
      } catch (e) {}
    }

    return products;
  }

  // Category, Search, or Shop URL
  if (onLog) onLog(`Connecting to Daraz Catalog Stream for ${url}...`);

  while (products.length < maxProducts && page <= maxPages) {
    const separator = targetUrl.includes('?') ? '&' : '?';
    const cleanUrl = targetUrl.replace(/([?&])page=\d+/g, '').replace(/([?&])ajax=true/g, '');
    const pageUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}ajax=true&page=${page}`;

    if (onLog) onLog(`Fetching Daraz page ${page} from ${pageUrl}...`);

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
        const norm = normalizeDarazItem(it, origin);
        if (!products.some(p => p.title === norm.title)) {
          products.push(norm);
        }
      }

      if (onLog) onLog(`Extracted ${products.length} total products so far...`);

      if (items.length < 20) break; // Last page
      page++;
      await new Promise(r => setTimeout(r, 300));
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
