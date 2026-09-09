import Papa from 'papaparse';
import { getCurrencySymbol } from './currency.js';

/**
 * Universal CSV Importer & Auto-Detection Engine
 * Supports official Shopify Product CSVs, WooCommerce Product CSVs, Wix CSVs, and Generic/Supplier CSVs.
 * Correctly groups multi-row variants and images under unified product objects.
 */

/**
 * Detects the source platform/format of the CSV based on headers
 */
export function detectCsvFormat(headers = []) {
  const lowerHeaders = headers.map(h => (h || '').trim().toLowerCase());

  // 1. Shopify Product CSV
  if ((lowerHeaders.includes('handle') || lowerHeaders.includes('url handle')) && 
      (lowerHeaders.includes('title') || lowerHeaders.includes('description') || lowerHeaders.includes('body (html)') || lowerHeaders.includes('variant price') || lowerHeaders.includes('price') || lowerHeaders.includes('product category') || lowerHeaders.includes('published on online store'))) {
    return {
      type: 'shopify',
      name: 'Shopify Product Catalog',
      confidence: 0.98,
      badgeColor: 'bg-[#95BF47]/15 text-[#95BF47] border-[#95BF47]/30'
    };
  }

  // 2. WooCommerce Product CSV
  if ((lowerHeaders.includes('id') || lowerHeaders.includes('sku')) && (lowerHeaders.includes('name') || lowerHeaders.includes('regular price') || lowerHeaders.includes('categories'))) {
    return {
      type: 'woocommerce',
      name: 'WooCommerce Product CSV',
      confidence: 0.95,
      badgeColor: 'bg-[#96588A]/15 text-[#96588A] border-[#96588A]/30'
    };
  }

  // 3. Wix Product CSV
  if (lowerHeaders.includes('handleid') || (lowerHeaders.includes('fieldtype') && lowerHeaders.includes('name'))) {
    return {
      type: 'wix',
      name: 'Wix Store Product CSV',
      confidence: 0.92,
      badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    };
  }

  // 4. Generic / Universal Supplier CSV
  return {
    type: 'generic',
    name: 'Universal E-Commerce CSV',
    confidence: 0.85,
    badgeColor: 'bg-[#F1FF0A]/15 text-[#F1FF0A] border-[#F1FF0A]/30'
  };
}

/**
 * Helper to safely extract field by case-insensitive key candidates
 */
function getField(row, candidates = []) {
  for (const c of candidates) {
    const direct = row[c];
    if (direct !== undefined && direct !== null && String(direct).trim() !== '') {
      return String(direct).trim();
    }
    // Case insensitive match
    const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === c.toLowerCase());
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
      return String(row[foundKey]).trim();
    }
  }
  return '';
}

/**
 * Parses Shopify Product CSV format with multi-row variant and image grouping
 */
export function parseShopifyCsv(rows = []) {
  const productsMap = new Map();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const handle = getField(row, ['URL handle', 'URL Handle', 'Handle', 'handle', 'HandleID']) || `prod-${i + 1}`;
    const title = getField(row, ['Title', 'title', 'Name', 'name']);
    const bodyHtml = getField(row, ['Description', 'description', 'Body (HTML)', 'body_html', 'Body']);
    const vendor = getField(row, ['Vendor', 'vendor', 'Brand', 'brand']);
    const productCategory = getField(row, ['Product category', 'Product Category', 'Category', 'category', 'Google Shopping / Google product category']);
    const type = getField(row, ['Type', 'Product Type', 'type', 'product_type']);
    const tagsStr = getField(row, ['Tags', 'tags']);
    const status = (getField(row, ['Status', 'status']) || 'active').toLowerCase();
    const templateSuffix = getField(row, ['Template Suffix', 'template_suffix', 'Template', 'template']).replace(/^product\./i, '');

    // Variant fields
    const opt1Name = getField(row, ['Option1 name', 'Option1 Name', 'Option 1 Name']);
    const opt1Val = getField(row, ['Option1 value', 'Option1 Value', 'Option 1 Value']);
    const opt2Name = getField(row, ['Option2 name', 'Option2 Name', 'Option 2 Name']);
    const opt2Val = getField(row, ['Option2 value', 'Option2 Value', 'Option 2 Value']);
    const opt3Name = getField(row, ['Option3 name', 'Option3 Name', 'Option 3 Name']);
    const opt3Val = getField(row, ['Option3 value', 'Option3 Value', 'Option 3 Value']);

    const varPrice = parseFloat(getField(row, ['Price', 'price', 'Variant Price', 'variant_price']) || 0) || 0;
    const varComparePrice = parseFloat(getField(row, ['Compare-at price', 'Compare At Price', 'Variant Compare At Price', 'compare_at_price']) || 0) || null;
    const varCost = parseFloat(getField(row, ['Cost per item', 'Cost', 'cost']) || 0) || 0;
    const varSku = getField(row, ['SKU', 'sku', 'Variant SKU']) || `SKU-${handle}-${i + 1}`;
    const varBarcode = getField(row, ['Barcode', 'barcode', 'Variant Barcode']);
    const varStock = parseInt(getField(row, ['Inventory quantity', 'Inventory Qty', 'Variant Inventory Qty', 'Stock', 'stock']) || '99', 10);
    const varPolicy = (getField(row, ['Continue selling when out of stock', 'Variant Inventory Policy', 'Inventory Policy']) || 'continue').toLowerCase();
    const varShipping = getField(row, ['Requires shipping', 'Variant Requires Shipping']) !== 'FALSE';
    const varTaxable = getField(row, ['Charge tax', 'Variant Taxable']) !== 'FALSE';
    const varWeight = parseFloat(getField(row, ['Weight value (grams)', 'Variant Grams', 'Weight', 'weight']) || 0) || 0;

    // Image fields
    const imageSrc = getField(row, ['Product image URL', 'Variant image URL', 'Image Src', 'Image URL', 'Image', 'image']);
    const imageAlt = getField(row, ['Image alt text', 'Image Alt Text', 'Image Alt', 'alt']) || title;
    const imagePos = parseInt(getField(row, ['Image position', 'Image Position']) || '1', 10);

    const variantTitleParts = [opt1Val, opt2Val, opt3Val].filter(v => v && v !== 'Default Title');
    const variantTitle = variantTitleParts.length > 0 ? variantTitleParts.join(' / ') : 'Default Title';

    if (!productsMap.has(handle)) {
      // First row for this product
      const tagsList = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

      const initialVariant = {
        id: `v-${handle}-1`,
        title: variantTitle,
        price: varPrice,
        compare_at_price: (varComparePrice && varComparePrice > varPrice) ? varComparePrice : null,
        cost_per_item: varCost,
        sku: varSku,
        barcode: varBarcode,
        inventory_quantity: isNaN(varStock) ? 99 : varStock,
        inventory_policy: varPolicy.includes('deny') ? 'deny' : 'continue',
        requires_shipping: varShipping,
        taxable: varTaxable,
        weight: varWeight,
        option1: opt1Val || null,
        option2: opt2Val || null,
        option3: opt3Val || null
      };

      const initialImages = [];
      if (imageSrc) {
        initialImages.push({
          id: 1,
          src: imageSrc,
          alt: imageAlt,
          position: imagePos || 1
        });
      }

      const options = [];
      if (opt1Name && opt1Name !== 'Title') options.push({ name: opt1Name, values: opt1Val ? [opt1Val] : [] });
      if (opt2Name) options.push({ name: opt2Name, values: opt2Val ? [opt2Val] : [] });
      if (opt3Name) options.push({ name: opt3Name, values: opt3Val ? [opt3Val] : [] });

      productsMap.set(handle, {
        id: `imp-${handle}-${Date.now()}`,
        handle: handle,
        title: title || handle,
        description: bodyHtml,
        vendor: vendor || 'Store',
        product_type: productCategory || type || 'General',
        category: productCategory || type || 'General',
        type: type || productCategory || 'General',
        template_suffix: templateSuffix,
        template: templateSuffix,
        tags: tagsList,
        status: status === 'draft' ? 'draft' : (status === 'archived' ? 'archived' : 'active'),
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        price: varPrice,
        regular_price: (varComparePrice && varComparePrice > varPrice) ? varComparePrice : varPrice,
        currency: 'USD',
        variants: [initialVariant],
        images: initialImages,
        options: options,
        url: '',
        source: 'imported_shopify'
      });
    } else {
      // Subsequent row: Can be an additional variant or an additional image for existing product
      const product = productsMap.get(handle);

      // If this row contains a new image
      if (imageSrc && !product.images.some(img => img.src === imageSrc)) {
        product.images.push({
          id: product.images.length + 1,
          src: imageSrc,
          alt: imageAlt || product.title,
          position: imagePos || (product.images.length + 1)
        });
      }

      // If this row contains a distinct variant (opt1Val or new price/sku)
      if (opt1Val && opt1Val !== 'Default Title') {
        const isDuplicateVar = product.variants.some(v => v.sku === varSku && v.title === variantTitle);
        if (!isDuplicateVar) {
          product.variants.push({
            id: `v-${handle}-${product.variants.length + 1}`,
            title: variantTitle,
            price: varPrice || product.price,
            compare_at_price: (varComparePrice && varComparePrice > (varPrice || product.price)) ? varComparePrice : null,
            cost_per_item: varCost,
            sku: varSku || `SKU-${handle}-${product.variants.length + 1}`,
            barcode: varBarcode,
            inventory_quantity: isNaN(varStock) ? 99 : varStock,
            inventory_policy: varPolicy.includes('deny') ? 'deny' : 'continue',
            requires_shipping: varShipping,
            taxable: varTaxable,
            weight: varWeight,
            option1: opt1Val || null,
            option2: opt2Val || null,
            option3: opt3Val || null
          });
        }
      }
    }
  }

  return Array.from(productsMap.values());
}

/**
 * Parses WooCommerce Product CSV format
 */
export function parseWooCommerceCsv(rows = []) {
  const products = [];
  const parentMap = new Map();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const type = (getField(row, ['Type', 'type']) || 'simple').toLowerCase();
    const id = getField(row, ['ID', 'id']) || `woo-${i + 1}`;
    const name = getField(row, ['Name', 'name', 'Title', 'title']) || `Product ${i + 1}`;
    const sku = getField(row, ['SKU', 'sku']) || `SKU-${id}`;
    const desc = getField(row, ['Description', 'description', 'Short description', 'short_description']);
    const regPrice = parseFloat(getField(row, ['Regular price', 'regular_price', 'Price']) || 0) || 0;
    const salePrice = parseFloat(getField(row, ['Sale price', 'sale_price']) || 0) || 0;
    const price = (salePrice > 0 && salePrice < regPrice) ? salePrice : regPrice;
    const categories = getField(row, ['Categories', 'categories', 'category']);
    const tagsStr = getField(row, ['Tags', 'tags']);
    const imagesStr = getField(row, ['Images', 'images', 'image']);
    const stock = parseInt(getField(row, ['Stock', 'stock', 'In stock?']) || '99', 10);
    const parentId = getField(row, ['Parent', 'parent']);

    const catList = categories ? categories.split('>').map(c => c.trim()).filter(Boolean) : ['General'];
    const tagsList = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    const images = [];
    if (imagesStr) {
      const urls = imagesStr.split(',').map(u => u.trim()).filter(Boolean);
      urls.forEach((src, idx) => {
        images.push({ id: idx + 1, src, alt: name, position: idx + 1 });
      });
    }

    if (type === 'variation' && parentId && parentMap.has(parentId)) {
      // Attach variant to parent product
      const parentProd = parentMap.get(parentId);
      parentProd.variants.push({
        id: `v-${id}`,
        title: name,
        price: price || parentProd.price,
        compare_at_price: (regPrice > price) ? regPrice : null,
        sku: sku,
        inventory_quantity: isNaN(stock) ? 99 : stock,
        inventory_policy: 'continue',
        requires_shipping: true,
        taxable: true
      });
    } else {
      const prodObj = {
        id: `imp-woo-${id}-${Date.now()}`,
        handle: name.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/(^-|-$)/g, '') || `woo-${id}`,
        title: name,
        description: desc,
        vendor: 'WooCommerce Store',
        product_type: catList[0] || 'General',
        category: catList[0] || 'General',
        type: catList[0] || 'General',
        template_suffix: '',
        template: '',
        tags: [...tagsList, ...catList],
        status: 'active',
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        price: price,
        regular_price: (regPrice > price) ? regPrice : price,
        currency: 'USD',
        variants: [{
          id: `v-${id}-1`,
          title: 'Default Title',
          price: price,
          compare_at_price: (regPrice > price) ? regPrice : null,
          sku: sku,
          inventory_quantity: isNaN(stock) ? 99 : stock,
          inventory_policy: 'continue',
          requires_shipping: true,
          taxable: true
        }],
        images: images,
        options: [],
        url: '',
        source: 'imported_woocommerce'
      };

      parentMap.set(id, prodObj);
      products.push(prodObj);
    }
  }

  return products;
}

/**
 * Universal CSV Parser for Generic / Supplier CSVs
 */
export function parseGenericCsv(rows = []) {
  const products = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const title = getField(row, ['Title', 'title', 'Name', 'name', 'Product Name', 'Item Name', 'Product', 'Item']);
    if (!title) continue;

    const handle = getField(row, ['Handle', 'handle', 'Slug', 'slug']) || title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/(^-|-$)/g, '') || `prod-${i + 1}`;
    const desc = getField(row, ['Description', 'description', 'Details', 'Body', 'body_html', 'Short Description']);
    const vendor = getField(row, ['Vendor', 'vendor', 'Brand', 'brand', 'Supplier', 'Manufacturer']) || 'Supplier';
    const category = getField(row, ['Category', 'category', 'Product Type', 'type', 'Classification']) || 'General';
    const type = getField(row, ['Type', 'type', 'Product Type', 'Category', 'category']) || category;
    const templateSuffix = getField(row, ['Template', 'template', 'Template Suffix', 'template_suffix']);
    const tagsStr = getField(row, ['Tags', 'tags', 'Keywords', 'keywords']);
    const tagsList = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    const price = parseFloat(getField(row, ['Price', 'price', 'Sale Price', 'Unit Price', 'Amount', 'Cost']) || 0) || 0;
    const regPrice = parseFloat(getField(row, ['Regular Price', 'regular_price', 'Compare At Price', 'MSRP', 'Original Price']) || 0) || price;
    const sku = getField(row, ['SKU', 'sku', 'Item Code', 'Product Code', 'Barcode', 'barcode']) || `SKU-${i + 1}`;
    const barcode = getField(row, ['Barcode', 'barcode', 'UPC', 'EAN', 'ISBN']);
    const stock = parseInt(getField(row, ['Stock', 'stock', 'Quantity', 'qty', 'Inventory', 'inventory']) || '99', 10);
    const imageSrc = getField(row, ['Image', 'image', 'Image Src', 'Image URL', 'Photo', 'Picture', 'Thumbnail']);
    const currency = getField(row, ['Currency', 'currency']) || (title && /[\u0980-\u09FF]/.test(title) ? 'BDT' : 'USD');

    const images = [];
    if (imageSrc) {
      const urls = imageSrc.split(',').map(u => u.trim()).filter(Boolean);
      urls.forEach((src, idx) => {
        images.push({ id: idx + 1, src, alt: title, position: idx + 1 });
      });
    }

    products.push({
      id: `imp-gen-${i + 1}-${Date.now()}`,
      handle: handle,
      title: title,
      description: desc || `${title} - High quality product.`,
      vendor: vendor,
      product_type: category,
      category: category,
      type: type,
      template_suffix: templateSuffix,
      template: templateSuffix,
      tags: tagsList,
      status: 'active',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      price: price,
      regular_price: (regPrice > price) ? regPrice : price,
      currency: currency,
      variants: [{
        id: `v-${i + 1}-1`,
        title: 'Default Title',
        price: price,
        compare_at_price: (regPrice > price) ? regPrice : null,
        sku: sku,
        barcode: barcode,
        inventory_quantity: isNaN(stock) ? 99 : stock,
        inventory_policy: 'continue',
        requires_shipping: true,
        taxable: true
      }],
      images: images,
      options: [],
      url: '',
      source: 'imported_csv'
    });
  }

  return products;
}

/**
 * Parses Wix Store Product CSV format (supporting both Multi-Row Variation and Simple Product formats)
 */
export function parseWixCsv(rows = []) {
  const productsMap = new Map();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const handleId = getField(row, ['handleId', 'HandleID', 'handle', 'id']) || `wix-${i + 1}`;
    const fieldType = (getField(row, ['fieldType', 'FieldType', 'type']) || 'Product').toLowerCase();
    const name = getField(row, ['name', 'Name', 'title', 'Title']);
    const desc = getField(row, ['description', 'Description', 'details']);
    const rawImages = getField(row, ['productImageUrl', 'ProductImageUrl', 'images', 'image']);
    const collection = getField(row, ['collection', 'Collection', 'category', 'Category']);
    const sku = getField(row, ['sku', 'SKU']) || `SKU-${handleId}`;
    const ribbon = getField(row, ['ribbon', 'Ribbon']);
    const price = parseFloat(getField(row, ['price', 'Price']) || 0) || 0;
    const discountMode = getField(row, ['discountMode', 'DiscountMode']);
    const discountVal = parseFloat(getField(row, ['discountValue', 'DiscountValue']) || 0) || 0;
    const rawInventory = getField(row, ['inventory', 'Inventory']);
    const stock = rawInventory === 'InStock' ? 99 : (parseInt(rawInventory, 10) || 99);
    const weight = parseFloat(getField(row, ['weight', 'Weight']) || 0) || 0;
    const brand = getField(row, ['brand', 'Brand', 'vendor', 'Vendor']) || 'Wix Store';

    // Option fields
    const opt1Name = getField(row, ['productOptionName1', 'ProductOptionName1']);
    const opt1Val = getField(row, ['productOptionDescription1', 'ProductOptionDescription1']);
    const opt2Name = getField(row, ['productOptionName2', 'ProductOptionName2']);
    const opt2Val = getField(row, ['productOptionDescription2', 'ProductOptionDescription2']);
    const opt3Name = getField(row, ['productOptionName3', 'ProductOptionName3']);
    const opt3Val = getField(row, ['productOptionDescription3', 'ProductOptionDescription3']);

    let regPrice = price;
    let salePrice = price;
    if (discountMode.toLowerCase() === 'amount' && discountVal > 0) {
      salePrice = Math.max(0, price - discountVal);
      regPrice = price;
    }

    if (fieldType === 'product' || !productsMap.has(handleId)) {
      const images = [];
      if (rawImages) {
        const urls = rawImages.split(';').map(u => u.trim()).filter(Boolean);
        urls.forEach((src, idx) => {
          images.push({ id: idx + 1, src, alt: name || handleId, position: idx + 1 });
        });
      }

      const tags = [];
      if (collection) tags.push(collection);
      if (ribbon) tags.push(ribbon);

      const options = [];
      if (opt1Name && opt1Val) options.push({ name: opt1Name, values: opt1Val.split(';').map(v => v.trim()).filter(Boolean) });
      if (opt2Name && opt2Val) options.push({ name: opt2Name, values: opt2Val.split(';').map(v => v.trim()).filter(Boolean) });
      if (opt3Name && opt3Val) options.push({ name: opt3Name, values: opt3Val.split(';').map(v => v.trim()).filter(Boolean) });

      const initialVariant = {
        id: `v-${handleId}-1`,
        title: 'Default Title',
        price: salePrice,
        compare_at_price: (regPrice > salePrice) ? regPrice : null,
        sku: sku,
        inventory_quantity: stock,
        inventory_policy: 'continue',
        requires_shipping: true,
        taxable: true,
        weight: weight,
        option1: null
      };

      productsMap.set(handleId, {
        id: `imp-wix-${handleId}-${Date.now()}`,
        handle: handleId.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: name || handleId,
        description: desc || '',
        vendor: brand,
        product_type: collection || 'General',
        category: collection || 'General',
        type: collection || 'General',
        template_suffix: '',
        template: '',
        tags: tags,
        status: 'active',
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        price: salePrice,
        regular_price: regPrice,
        currency: 'USD',
        variants: [initialVariant],
        images: images,
        options: options,
        url: '',
        source: 'imported_wix'
      });
    } else if (fieldType === 'variant') {
      const product = productsMap.get(handleId);
      if (product) {
        const varTitleParts = [opt1Val, opt2Val, opt3Val].filter(Boolean);
        const varTitle = varTitleParts.length > 0 ? varTitleParts.join(' / ') : `Variant ${product.variants.length + 1}`;

        if (product.variants.length === 1 && product.variants[0].title === 'Default Title' && varTitle !== 'Default Title') {
          product.variants[0].title = varTitle;
          product.variants[0].sku = sku;
          product.variants[0].price = price || product.price;
          product.variants[0].inventory_quantity = stock;
          product.variants[0].weight = weight;
          product.variants[0].option1 = opt1Val || null;
          product.variants[0].option2 = opt2Val || null;
          product.variants[0].option3 = opt3Val || null;
        } else {
          product.variants.push({
            id: `v-${handleId}-${product.variants.length + 1}`,
            title: varTitle,
            price: price || product.price,
            compare_at_price: null,
            sku: sku || `SKU-${handleId}-${product.variants.length + 1}`,
            inventory_quantity: stock,
            inventory_policy: 'continue',
            requires_shipping: true,
            taxable: true,
            weight: weight,
            option1: opt1Val || null,
            option2: opt2Val || null,
            option3: opt3Val || null
          });
        }
      }
    }
  }

  return Array.from(productsMap.values());
}

/**
 * Main CSV Import Function
 * Takes a File object or raw CSV string, parses it, auto-detects format, and returns normalized products.
 */
export function importCsvFile(fileOrString) {
  return new Promise((resolve, reject) => {
    Papa.parse(fileOrString, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        try {
          const rows = results.data || [];
          if (rows.length === 0) {
            return reject(new Error('The uploaded CSV file is empty.'));
          }

          const headers = results.meta?.fields || Object.keys(rows[0] || {});
          const formatInfo = detectCsvFormat(headers);

          let parsedProducts = [];
          if (formatInfo.type === 'shopify') {
            parsedProducts = parseShopifyCsv(rows);
          } else if (formatInfo.type === 'woocommerce') {
            parsedProducts = parseWooCommerceCsv(rows);
          } else if (formatInfo.type === 'wix') {
            parsedProducts = parseWixCsv(rows);
          } else {
            parsedProducts = parseGenericCsv(rows);
          }

          if (parsedProducts.length === 0) {
            // Try generic fallback
            parsedProducts = parseGenericCsv(rows);
          }

          if (parsedProducts.length === 0) {
            return reject(new Error('Could not extract any valid product items from this CSV.'));
          }

          // Compute summary stats
          const totalVariants = parsedProducts.reduce((acc, p) => acc + (p.variants?.length || 1), 0);
          const totalImages = parsedProducts.reduce((acc, p) => acc + (p.images?.length || 0), 0);

          resolve({
            products: parsedProducts,
            format: formatInfo,
            totalRows: rows.length,
            totalProducts: parsedProducts.length,
            totalVariants,
            totalImages,
            headers
          });
        } catch (err) {
          reject(new Error(`CSV processing error: ${err.message}`));
        }
      },
      error: (err) => {
        reject(new Error(`CSV parse failure: ${err.message}`));
      }
    });
  });
}
