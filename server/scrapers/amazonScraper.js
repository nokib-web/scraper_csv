const axios = require('axios');
const cheerio = require('cheerio');

const AMAZON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"'
};

/**
 * Amazon Dedicated Scraper (Supports root amazon.com, search results, category nodes, and single product pages)
 */
async function scrapeAmazon(url, options = {}, onLog) {
  let targetUrl = url;
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;
  const maxProducts = options.limit || 50;
  const products = [];

  // If root homepage is provided, redirect to Amazon Deals / Best Sellers catalog
  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '') {
    targetUrl = `${origin}/s?k=trending+deals+electronics+best+sellers`;
    if (onLog) onLog('Amazon homepage detected. Routing to Amazon Trending Catalog...');
  }

  if (onLog) onLog(`Connecting to Amazon catalog at ${targetUrl}...`);

  let res;
  try {
    res = await axios.get(targetUrl, { headers: AMAZON_HEADERS, timeout: 12000 });
  } catch (e) {
    if (onLog) onLog(`Amazon standard fetch warning: ${e.message}. Retrying with mobile gateway...`);
    const mobileHeaders = {
      ...AMAZON_HEADERS,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    };
    res = await axios.get(targetUrl, { headers: mobileHeaders, timeout: 12000 });
  }

  const html = res.data;
  const $ = cheerio.load(html);

  // 1. Single Product Page (/dp/ or /gp/product/ or product title present)
  const asinMatch = targetUrl.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  const hasProductTitle = $('#productTitle').length > 0 || asinMatch;

  if (hasProductTitle) {
    let title = $('#productTitle').text().trim() ||
                $('meta[property="og:title"]').attr('content') ||
                $('h1').first().text().trim();
    
    // Clean Amazon suffix from title
    title = title.replace(/\s*:\s*Amazon\.[a-z.]+/i, '').replace(/\|\s*Amazon\.[a-z.]+/i, '').trim();

    if (title) {
      if (onLog) onLog(`Parsing Amazon Single Product: "${title.slice(0, 40)}..."`);
      
      const priceText = $('.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice, #corePriceDisplay_desktop_feature_div .a-price-whole, .priceToPay, span[class*="price"]').first().text().trim();
      const match = priceText.match(/([0-9,]+(?:\.[0-9]{2})?)/);
      const price = match ? parseFloat(match[1].replace(/,/g, '')) : 0;
      
      let img = $('#landingImage, #imgBlkFront, #main-image').attr('data-old-hires') ||
                $('#landingImage, #imgBlkFront, #main-image').attr('src') ||
                $('meta[property="og:image"]').attr('content') || '';
      
      const asin = asinMatch ? asinMatch[1] : ('AMZ-' + Date.now());
      const brand = $('#bylineInfo').text().trim().replace(/^Visit the\s+/i, '').replace(/\s+Store$/i, '').trim() || 'Amazon';
      const desc = $('#feature-bullets').text().trim() || $('meta[property="og:description"]').attr('content') || title;

      // Extract additional gallery images if present
      const imageList = [];
      if (img) imageList.push({ id: 1, src: img, alt: title, position: 1 });
      
      $('#altImages ul li img, .imageThumbnail img').each((idx, el) => {
        let thumbSrc = $(el).attr('src') || '';
        if (thumbSrc && !thumbSrc.includes('play-button') && !thumbSrc.includes('icon')) {
          // Convert thumbnail to high-res if possible
          const highRes = thumbSrc.replace(/\._[A-Z0-9_]+_\./i, '._UL1500_.');
          if (!imageList.some(i => i.src === highRes || i.src === thumbSrc)) {
            imageList.push({ id: imageList.length + 1, src: highRes, alt: title, position: imageList.length + 1 });
          }
        }
      });

      products.push({
        id: asin,
        title,
        handle: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: desc,
        vendor: brand,
        product_type: 'Amazon Product',
        tags: ['Amazon', brand],
        status: 'active',
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        price,
        regular_price: price,
        currency: 'USD',
        variants: [{
          id: asin,
          title: 'Default Title',
          price,
          sku: asin,
          inventory_quantity: 99,
          available: true
        }],
        images: imageList.length > 0 ? imageList : (img ? [{ id: 1, src: img, alt: title, position: 1 }] : []),
        url: targetUrl,
        source: 'amazon'
      });

      return products;
    }
  }

  // 2. Search / Catalog Results
  const items = $('div[data-asin]:not([data-asin=""]), [data-component-type="s-search-result"], .s-result-item');
  if (onLog) onLog(`Found ${items.length} Amazon search items in catalog...`);

  items.each((idx, el) => {
    if (products.length >= maxProducts) return;
    const $item = $(el);
    const asin = $item.attr('data-asin');
    if (!asin || asin.length < 5) return;

    let title = $item.find('h2 a span, h2, span.a-size-medium, span.a-size-base-plus, [class*="title"]').first().text().trim();
    if (!title) return;

    // Clean sponsored text
    title = title.replace(/^SponsoredSponsored.*?Leave ad feedback\s*/i, '')
                 .replace(/^Sponsored\s*/i, '')
                 .replace(/\s+/g, ' ')
                 .trim();

    if (!title || title.length < 3) return;

    const priceText = $item.find('.a-price .a-offscreen, .a-price-whole, [data-a-color="base"] .a-price').first().text().trim();
    const match = priceText.match(/([0-9,]+(?:\.[0-9]{2})?)/);
    const price = match ? parseFloat(match[1].replace(/,/g, '')) : 0;

    const imgEl = $item.find('img.s-image, img').first();
    let img = imgEl.attr('src') || imgEl.attr('data-src') || '';
    // High-res upscaling for Amazon Media
    if (img && img.includes('._AC_')) {
      img = img.replace(/\._AC_[^.]*\./, '._AC_SL1500_.');
    }

    let link = $item.find('h2 a, a.a-link-normal').first().attr('href') || `/dp/${asin}`;
    if (link && link.startsWith('/')) link = `${origin}${link}`;

    const brand = $item.find('.a-size-small.a-color-base, .a-row.a-size-base.a-color-secondary').first().text().trim() || 'Amazon';

    if (!products.some(p => p.id === asin || p.title === title)) {
      products.push({
        id: asin,
        title,
        handle: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: `${title} - Available on Amazon.`,
        vendor: brand,
        product_type: 'Amazon Product',
        tags: ['Amazon', brand],
        status: 'active',
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        price,
        regular_price: price,
        currency: 'USD',
        variants: [{
          id: asin,
          title: 'Default Title',
          price,
          sku: asin,
          inventory_quantity: 99,
          available: true
        }],
        images: img ? [{ id: 1, src: img, alt: title, position: 1 }] : [],
        url: link,
        source: 'amazon'
      });
    }
  });

  if (onLog) onLog(`Successfully extracted ${products.length} products from Amazon!`);
  return products;
}

module.exports = {
  scrapeAmazon
};
