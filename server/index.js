const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { scrapeProducts, detectPlatform } = require('./scrapers');
const { catalogCache } = require('./utils/cache');
const { exportShopifyCsv, exportShopifyInventoryCsv } = require('./exporters/shopifyFormatter');
const { exportWooCommerceCsv } = require('./exporters/wooFormatter');
const { exportWixCsv, exportWixSimpleCsv } = require('./exporters/wixFormatter');
const { exportUniversalCsv } = require('./exporters/universalFormatter');
const { exportJson } = require('./exporters/jsonFormatter');

const app = express();
const PORT = process.env.PORT || 4000;

// 1. HTTP Gzip/Brotli Compression (Bypasses SSE real-time stream so chunks aren't buffered)
app.use(compression({
  filter: (req, res) => {
    if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024 // Only compress responses above 1KB
}));

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 2. High-Traffic Rate Limiting (Protects from DDoS, scrapers & server socket exhaustion)
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 180, // 180 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again in a minute.' }
});

const scrapeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 45, // 45 scrapes per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Scraping request limit reached. Please wait a moment before trying again.' }
});

app.use('/api/', generalLimiter);

// 3. Health & Scaling Status Monitor
app.get('/api/health', (req, res) => {
  const memory = process.memoryUsage();
  res.json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: {
      rssMb: (memory.rss / 1024 / 1024).toFixed(2),
      heapUsedMb: (memory.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMb: (memory.heapTotal / 1024 / 1024).toFixed(2)
    },
    cacheStats: catalogCache.getStats(),
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Quick Demo Preset Stores
const PRESET_STORES = [
  { name: 'Daraz BD', url: 'https://www.daraz.com.bd', type: 'daraz', badge: 'Marketplace' },
  { name: 'Bata BD', url: 'https://www.batabd.com', type: 'shopify', badge: 'Shopify Store' },
  { name: 'Ryans Computers', url: 'https://www.ryans.com', type: 'generic', badge: 'Electronics' },
  { name: 'Star Tech', url: 'https://www.startech.com.bd', type: 'generic', badge: 'Tech Store' },
  { name: 'Wafilife', url: 'https://www.wafilife.com/', type: 'generic', badge: 'Online Bookstore' },
  { name: 'Rokomari', url: 'https://www.rokomari.com/book', type: 'generic', badge: 'Mega Bookstore' },
  { name: 'Ghorer Bazar', url: 'https://ghorerbazar.com/', type: 'generic', badge: 'Organic Grocery' }
];

// Presets API
app.get('/api/presets', (req, res) => {
  res.json(PRESET_STORES);
});

// Platform Detection API
app.get('/api/detect', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  try {
    const result = await detectPlatform(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Real-Time Scraping via Server-Sent Events (SSE) with In-Memory Cache
app.get('/api/scrape-stream', scrapeLimiter, async (req, res) => {
  const { url, limit = 50, engine = 'auto' } = req.query;

  if (!url) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('URL is required');
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const sendEvent = (type, payload) => {
    res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);
  };

  const onLog = (msg) => {
    sendEvent('log', { message: msg, timestamp: new Date().toLocaleTimeString() });
  };

  const cacheKey = catalogCache.generateKey(url, engine, limit);

  // Check In-Memory Store Cache for Instant Response
  const cachedData = catalogCache.get(cacheKey);
  if (cachedData && cachedData.products && cachedData.products.length > 0) {
    sendEvent('start', { url, limit: parseInt(limit), cached: true });
    sendEvent('log', { message: `⚡ [FAST CACHE HIT] Delivering instant cached catalog (${cachedData.products.length} products)...` });
    sendEvent('detected', { detection: cachedData.detection });
    sendEvent('complete', {
      products: cachedData.products,
      detection: cachedData.detection,
      total: cachedData.total || cachedData.products.length,
      cached: true
    });
    return res.end();
  }

  try {
    sendEvent('start', { url, limit: parseInt(limit) });
    const result = await scrapeProducts(url, {
      limit: parseInt(limit) || 50,
      engineOverride: engine,
      onLog
    });

    const products = result.products || [];

    // Save successful extraction in memory cache for 5 minutes
    if (products.length > 0) {
      catalogCache.set(cacheKey, {
        products,
        detection: result.detection,
        total: result.total
      }, 300);
    }

    sendEvent('complete', {
      products,
      detection: result.detection,
      total: result.total
    });
  } catch (error) {
    sendEvent('error', { error: error.message || 'Scraping failed.' });
  } finally {
    res.end();
  }
});

// Synchronous Scrape Endpoint (JSON response) with Cache
app.post('/api/scrape', scrapeLimiter, async (req, res) => {
  const { url, limit = 50, engine = 'auto' } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const cacheKey = catalogCache.generateKey(url, engine, limit);
  const cachedData = catalogCache.get(cacheKey);
  if (cachedData && cachedData.products && cachedData.products.length > 0) {
    return res.json({
      ...cachedData,
      logs: [`⚡ [FAST CACHE HIT] Returned ${cachedData.products.length} products in 2ms.`],
      cached: true
    });
  }

  const logs = [];
  const onLog = (msg) => logs.push(msg);

  try {
    const result = await scrapeProducts(url, {
      limit: parseInt(limit) || 50,
      engineOverride: engine,
      onLog
    });

    if (result.products && result.products.length > 0) {
      catalogCache.set(cacheKey, {
        products: result.products,
        detection: result.detection,
        total: result.total
      }, 300);
    }

    res.json({ ...result, logs });
  } catch (err) {
    res.status(500).json({ error: err.message, logs });
  }
});

// ====== IMAGE PROXY ENDPOINT ======
// Bypasses CDN hotlink protection so Shopify/WooCommerce can fetch images from any source
app.get('/api/img', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing url param');

  try {
    const decoded = decodeURIComponent(url);
    const response = await axios.get(decoded, {
      responseType: 'stream',
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': new URL(decoded).origin + '/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    response.data.pipe(res);
  } catch (err) {
    res.status(502).send(`Image proxy error: ${err.message}`);
  }
});

// Multi-Format Export API
app.post('/api/export', (req, res) => {
  const { 
    products, 
    format = 'shopify_csv', 
    filename = 'products', 
    proxyBase: clientProxyBase, 
    defaultStock, 
    customVendor,
    customCategory,
    customType,
    customTemplate,
    maxImages,
    priceMarkup,
    inventoryPolicy,
    inventoryTracker,
    locationName
  } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'No products provided for export' });
  }

  const exportOptions = {
    defaultStock: defaultStock !== undefined ? defaultStock : 99,
    customVendor: customVendor && typeof customVendor === 'string' ? customVendor.trim() : '',
    customCategory: customCategory && typeof customCategory === 'string' ? customCategory.trim() : '',
    customType: customType && typeof customType === 'string' ? customType.trim() : '',
    customTemplate: customTemplate && typeof customTemplate === 'string' ? customTemplate.trim() : '',
    maxImages: Number(maxImages) || 0,
    priceMarkup: priceMarkup || { type: 'none', value: 0 },
    inventoryPolicy: inventoryPolicy || 'continue',
    inventoryTracker: inventoryTracker !== undefined ? inventoryTracker : 'shopify',
    locationName: locationName || 'Location'
  };

  const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
  let output = '';
  let contentType = 'text/csv';
  let fileExt = 'csv';

  // Use client-provided origin (most reliable), fallback to header detection
  const reqProto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const reqHost = req.headers['x-forwarded-host'] || req.get('host') || `localhost:${PORT}`;
  const proxyBase = clientProxyBase || `${reqProto}://${reqHost}`;

  switch (format) {
    case 'shopify':
    case 'shopify_csv':
      output = exportShopifyCsv(products, exportOptions);
      fileExt = 'shopify.csv';
      break;

    case 'shopify_inventory':
    case 'shopify_inventory_csv':
      output = exportShopifyInventoryCsv(products, exportOptions);
      fileExt = 'shopify_inventory.csv';
      break;

    case 'woo':
    case 'woocommerce':
    case 'woo_csv':
    case 'woocommerce_csv':
      output = exportWooCommerceCsv(products, exportOptions);
      fileExt = 'woocommerce.csv';
      break;

    case 'wix':
    case 'wix_csv':
      output = exportWixCsv(products, exportOptions);
      fileExt = 'wix.csv';
      break;

    case 'wix_simple':
    case 'wix_simple_csv':
      output = exportWixSimpleCsv(products, exportOptions);
      fileExt = 'wix_simple.csv';
      break;

    case 'universal':
    case 'universal_csv':
    case 'clean':
    case 'clean_csv':
      output = exportUniversalCsv(products, exportOptions);
      fileExt = 'clean.csv';
      break;

    case 'json':
      output = exportJson(products, 'standard', exportOptions);
      contentType = 'application/json';
      fileExt = 'json';
      break;

    case 'shopify_json':
      output = exportJson(products, 'shopify_native', exportOptions);
      contentType = 'application/json';
      fileExt = 'shopify.json';
      break;

    default:
      output = exportUniversalCsv(products, exportOptions);
      fileExt = 'csv';
      break;
  }

  res.setHeader('Content-Type', `${contentType}; charset=utf-8`);
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}_${fileExt}"`);
  res.send(output);
});

// Explicit robots.txt & llms.txt handlers
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nAllow: /\n');
});

app.get('/llms.txt', (req, res) => {
  res.type('text/plain');
  res.send('# getProducts — Universal E-Commerce Product Catalog Exporter\n\n> getProducts extracts e-commerce product catalogs from Shopify, WooCommerce, Wix, Daraz, Zatiq, and Amazon, exporting them to ready-to-import CSV formats.\n');
});

// Clear cache endpoint (can be called if needed)
app.post('/api/cache/clear', (req, res) => {
  catalogCache.clear();
  res.json({ message: 'Store cache cleared successfully.' });
});

// Serve Client Static Build if in production
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(clientDist, 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Universal Product Scraper Server listening on http://localhost:${PORT}`);
});

// Graceful Shutdown for Zero-Downtime Reloads
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received: closing HTTP server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
