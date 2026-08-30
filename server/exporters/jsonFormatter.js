/**
 * Exports products as formatted JSON string
 */
function exportJson(products, format = 'standard', options = {}) {
  const customVendor = options.customVendor && options.customVendor.trim() ? options.customVendor.trim() : null;
  const prods = customVendor ? products.map(p => ({ ...p, vendor: customVendor })) : products;

  if (format === 'shopify_native') {
    return JSON.stringify({
      products: prods.map(p => ({
        id: p.id,
        title: p.title,
        body_html: p.description,
        vendor: p.vendor,
        product_type: p.product_type,
        created_at: p.created_at,
        handle: p.handle,
        published_at: p.published_at,
        tags: p.tags,
        variants: p.variants,
        images: p.images,
        options: p.options
      }))
    }, null, 2);
  }

  return JSON.stringify(prods, null, 2);
}

module.exports = {
  exportJson
};
