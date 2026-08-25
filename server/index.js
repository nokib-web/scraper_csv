const express = require('express');
const cors = require('cors');
const path = require('path');
const { scrapeProducts, detectPlatform } = require('./scrapers');
const { exportShopifyCsv } = require('./exporters/shopifyFormatter');
const { exportWooCsv } = require('./exporters/wooFormatter');
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
  {
    name: 'Helm Boots (Shopify Store)',
    url: 'https://helmboots.com',
    type: 'shopify',
    badge: 'Shopify Footwear',
    description: 'High quality footwear with rich sizes, variants & high-res images'
  },
  {
    name: 'SpaceX Official Store',
    url: 'https://shop.spacex.com',
    type: 'shopify',
    badge: 'Shopify Apparel',
    description: 'Official merch store with diverse apparel, accessories & gear'
  },
  {
    name: 'Allbirds (Shopify Store)',
    url: 'https://www.allbirds.com',
    type: 'shopify',
    badge: 'Shopify Footwear',
    description: 'Eco-friendly shoes with color & size variants'
  },
  {
    name: 'Single Product (SpaceX Jacket)',
    url: 'https://shop.spacex.com/products/unisex-spacex-starship-flight-jacket',
    type: 'shopify',
    badge: 'Single Product Link',
    description: 'Single item URL extraction demo'
  }
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

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
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

    sendEvent('complete', result);
  } catch (error) {
    sendEvent('error', { message: error.message || 'Scraping failed.' });
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

// Multi-Format Export API
app.post('/api/export', (req, res) => {
  const { products, format = 'shopify_csv', filename = 'products' } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'No products provided for export' });
  }

  const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
  let output = '';
  let contentType = 'text/csv';
  let fileExt = 'csv';

  switch (format) {
    case 'shopify_csv':
      output = exportShopifyCsv(products);
      fileExt = 'shopify.csv';
      break;

    case 'woo_csv':
    case 'woocommerce_csv':
      output = exportWooCsv(products);
      fileExt = 'woocommerce.csv';
      break;

    case 'wix_csv':
      output = exportWixCsv(products);
      fileExt = 'wix.csv';
      break;

    case 'universal_csv':
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
