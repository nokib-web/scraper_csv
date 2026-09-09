const { detectPlatform } = require('./detector');
const { scrapeShopifyCatalog, scrapeShopifySingleProduct } = require('./shopifyScraper');
const { scrapeWooCommerce } = require('./wooScraper');
const { scrapeZatiqStore } = require('./zatiqScraper');
const { scrapeDarazCatalog } = require('./darazScraper');
const { scrapeAmazon } = require('./amazonScraper');
const { scrapeGuardianCatalog } = require('./guardianScraper');
const { scrapeGenericSite } = require('./genericScraper');

/**
 * Universal Scraper Entry Point
 * @param {string} url - Target URL to scrape
 * @param {object} options - { limit, engineOverride, onLog }
 */
async function scrapeProducts(url, options = {}) {
  const onLog = options.onLog || (() => {});
  
  if (!url || typeof url !== 'string') {
    throw new Error('Please provide a valid URL.');
  }

  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }

  onLog(`Analyzing target URL: ${formattedUrl}...`);

  // Detect platform
  let detection = null;
  if (options.engineOverride && options.engineOverride !== 'auto') {
    detection = {
      platform: options.engineOverride,
      confidence: 1.0,
      details: `Manual override: ${options.engineOverride}`,
      isSingleProduct: formattedUrl.includes('/products/') || formattedUrl.includes('/product/')
    };
  } else {
    detection = await detectPlatform(formattedUrl);
  }

  onLog(`Detected platform: ${detection.platform.toUpperCase()} (${detection.details || 'Confidence: ' + Math.round(detection.confidence * 100) + '%'})`);

  let rawProducts = [];

  switch (detection.platform) {
    case 'shopify':
      if (detection.isSingleProduct) {
        onLog('Executing Shopify Single Product Extractor...');
        rawProducts = await scrapeShopifySingleProduct(formattedUrl, onLog);
      } else {
        onLog('Executing Shopify Full Catalog Extractor...');
        rawProducts = await scrapeShopifyCatalog(formattedUrl, options, onLog);
      }
      break;

    case 'woocommerce':
      onLog('Executing WooCommerce Extractor...');
      rawProducts = await scrapeWooCommerce(formattedUrl, options, onLog);
      break;

    case 'zatiq':
      onLog('Executing Zatiq Inventory Extractor...');
      rawProducts = await scrapeZatiqStore(formattedUrl, options, onLog);
      break;

    case 'daraz':
      onLog('Executing Daraz Marketplace Multi-Page Extractor...');
      rawProducts = await scrapeDarazCatalog(formattedUrl, options, onLog);
      break;

    case 'amazon':
      onLog('Executing Amazon Marketplace & Catalog Extractor...');
      rawProducts = await scrapeAmazon(formattedUrl, options, onLog);
      break;

    case 'guardianpubs':
      onLog('Executing Guardian Publications High-Speed Catalog Extractor...');
      rawProducts = await scrapeGuardianCatalog(formattedUrl, options, onLog);
      break;

    case 'wix':
    case 'generic':
    default:
      onLog('Executing Universal Generic / Schema.org Extractor...');
      rawProducts = await scrapeGenericSite(formattedUrl, options, onLog);
      break;
  }

  // Fallback: If platform-specific scraper returned 0 items, try generic scraper as backup
  if ((!rawProducts || rawProducts.length === 0) && detection.platform !== 'generic') {
    onLog(`Primary scraper returned 0 items. Running fallback generic HTML & JSON-LD parser...`);
    rawProducts = await scrapeGenericSite(formattedUrl, options, onLog);
  }

  // Final normalization & deduplication
  const seenHandles = new Set();
  const cleanedProducts = [];

  for (const p of rawProducts) {
    if (!p.title || p.title.trim() === '') continue;
    const key = p.handle || p.title;
    if (seenHandles.has(key)) continue;
    seenHandles.add(key);

    cleanedProducts.push({
      ...p,
      price: typeof p.price === 'number' ? p.price : (parseFloat(p.price) || 0),
      regular_price: typeof p.regular_price === 'number' ? p.regular_price : (parseFloat(p.regular_price) || p.price || 0),
      images: Array.isArray(p.images) ? p.images : [],
      variants: Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : [{
        id: '1',
        title: 'Default Title',
        price: p.price || 0,
        sku: `SKU-${Date.now()}`,
        inventory_quantity: 99,
        available: true
      }]
    });
  }

  onLog(`Completed! Extracted ${cleanedProducts.length} total products ready for export.`);

  return {
    success: true,
    platform: detection.platform,
    detectionDetails: detection.details,
    total: cleanedProducts.length,
    products: cleanedProducts
  };
}

module.exports = {
  scrapeProducts,
  detectPlatform
};
