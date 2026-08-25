# ⚡ OmniScrape Pro - Universal E-Commerce Product Extractor & Multi-Platform Exporter

A high-performance automated product extractor and converter designed to scrape e-commerce websites and instantly export platform-ready import files for **Shopify**, **WordPress / WooCommerce**, **Wix**, as well as **Universal Clean CSV** and **JSON**.

---

## 🌟 Key Features

1. **Intelligent Store Engine Detection**:
   - **Shopify Stores**: Scrapes full product catalogs with variants, prices, vendor, handles, and high-res images directly via public catalog APIs and sitemaps.
   - **WooCommerce Stores**: Fetches catalog via WooCommerce Store APIs and semantic microdata.
   - **Generic / Custom / Wix Stores**: Extracts Schema.org `Product` JSON-LD microdata, OpenGraph tags, and HTML product card components.
   - **Single Product URLs & Storewide Collections**: Supports individual product links as well as entire store catalogs.

2. **1-Click Multi-Platform Formats**:
   - 🛍️ **Shopify Product CSV**: Official standard template matching Shopify's import requirements with multi-row handle groupings for images and variants.
   - 🌐 **WordPress / WooCommerce CSV**: Official WooCommerce & WP-All-Import CSV schema.
   - ⚡ **Wix eCommerce CSV**: Official Wix store multi-row image & variant schema.
   - 📊 **Universal Clean CSV**: Clean spreadsheet formatted for Google Sheets, Microsoft Excel, and custom databases.
   - ⚙️ **Structured JSON**: Complete nested JSON object for developers, webhooks, and automation pipelines.

3. **Single-Screen High-Tech Dashboard**:
   - Real-time Server-Sent Events (SSE) log terminal with live scraping feedback.
   - Live metrics bar (Total products, variants, price range, image count).
   - Dual view: **Card Gallery Grid** & **Interactive Spreadsheet Table**.
   - Inline search, category filtering, and item deletion before export.
   - Inline editing for Title, Price, Vendor, and Category.
   - Live **Format Inspector & Code Preview Modal** with 1-click clipboard copy.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
npm --prefix client install
```

### 2. Run the Application
```bash
# Start both Backend & Frontend concurrently
npm run dev

# Or start backend server directly (serves production frontend on port 4000)
npm start
```

### 3. Open in Browser
Visit **[http://localhost:4000](http://localhost:4000)** (or `http://localhost:5173` if running Vite dev server).

---

## 📁 Project Structure

```
products-csv-downloader/
├── server/
│   ├── index.js                  # Express server & API routes
│   ├── scrapers/
│   │   ├── detector.js           # Engine detection (Shopify, Woo, Wix, Generic)
│   │   ├── shopifyScraper.js     # Shopify catalog & single product parser
│   │   ├── wooScraper.js         # WooCommerce API & HTML parser
│   │   ├── genericScraper.js     # Schema.org JSON-LD & OpenGraph parser
│   │   └── index.js              # Unified orchestrator
│   └── exporters/
│       ├── shopifyFormatter.js   # Official Shopify CSV transformer
│       ├── wooFormatter.js       # Official WooCommerce CSV transformer
│       ├── wixFormatter.js       # Official Wix CSV transformer
│       ├── universalFormatter.js # Universal CSV transformer
│       └── jsonFormatter.js      # Structured JSON exporter
├── client/
│   ├── index.html
│   ├── src/
│   │   ├── App.jsx               # Single screen dashboard layout
│   │   ├── components/
│   │   │   ├── Header.jsx        # Branding and platform status badges
│   │   │   ├── UrlBar.jsx        # URL input, engine selector & preset chips
│   │   │   ├── ProgressConsole.jsx # Live SSE streaming terminal
│   │   │   ├── StatsBar.jsx      # Metrics counters
│   │   │   ├── ProductGrid.jsx   # Card gallery view
│   │   │   ├── ProductTable.jsx  # Spreadsheet table view with inline edit
│   │   │   ├── ExportDrawer.jsx  # 1-click multi-format download center
│   │   │   └── RawPreviewModal.jsx # Live payload inspector modal
│   │   └── index.css             # Glassmorphism styling tokens
│   ├── package.json
│   └── vite.config.js
├── package.json
└── README.md
```

---

## 📄 License
MIT License. Built for seamless e-commerce automation.
