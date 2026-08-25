/**
 * Exports products as formatted JSON string
 */
function exportJson(products, format = 'standard') {
  if (format === 'shopify_native') {
    return JSON.stringify({
      products: products.map(p => ({
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

  return JSON.stringify(products, null, 2);
}

module.exports = {
  exportJson
};
