const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { scrapeProducts, detectPlatform } = require('./scrapers');
const { exportShopifyCsv } = require('./exporters/shopifyFormatter');
const { exportWooCommerceCsv } = require('./exporters/wooFormatter');
const { exportWixCsv } = require('./exporters/wixFormatter');
const { exportUniversalCsv } = require('./exporters/universalFormatter');
const { exportJson } = require('./exporters/jsonFormatter');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// Real-Time Scraping via Server-Sent Events (SSE)
app.get('/api/scrape-stream', async (req, res) => {
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

  try {
    sendEvent('start', { url, limit: parseInt(limit) });
    const result = await scrapeProducts(url, {
      limit: parseInt(limit) || 50,
      engineOverride: engine,
      onLog
    });

    sendEvent('complete', {
      products: result.products || [],
      detection: result.detection,
      total: result.total
    });
  } catch (error) {
    sendEvent('error', { error: error.message || 'Scraping failed.' });
  } finally {
    res.end();
  }
});

// Synchronous Scrape Endpoint (JSON response)
app.post('/api/scrape', async (req, res) => {
  const { url, limit = 50, engine = 'auto' } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const logs = [];
  const onLog = (msg) => logs.push(msg);

  try {
    const result = await scrapeProducts(url, {
      limit: parseInt(limit) || 50,
      engineOverride: engine,
      onLog
    });
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
  const { products, format = 'shopify_csv', filename = 'products', proxyBase: clientProxyBase } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'No products provided for export' });
  }

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
      output = exportShopifyCsv(products);
      fileExt = 'shopify.csv';
      break;

    case 'woo':
    case 'woocommerce':
    case 'woo_csv':
    case 'woocommerce_csv':
      output = exportWooCommerceCsv(products);
      fileExt = 'woocommerce.csv';
      break;

    case 'wix':
    case 'wix_csv':
      output = exportWixCsv(products);
      fileExt = 'wix.csv';
      break;

    case 'universal':
    case 'universal_csv':
    case 'clean':
    case 'clean_csv':
      output = exportUniversalCsv(products);
      fileExt = 'clean.csv';
      break;

    case 'json':
      output = exportJson(products, 'standard');
      contentType = 'application/json';
      fileExt = 'json';
      break;

    case 'shopify_json':
      output = exportJson(products, 'shopify_native');
      contentType = 'application/json';
      fileExt = 'shopify.json';
      break;

    default:
      output = exportUniversalCsv(products);
      fileExt = 'csv';
      break;
  }

  res.setHeader('Content-Type', `${contentType}; charset=utf-8`);
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}_${fileExt}"`);
  res.send(output);
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

app.listen(PORT, () => {
  console.log(`🚀 Universal Product Scraper Server listening on http://localhost:${PORT}`);
});
