/**
 * Shopify Standard Product Taxonomy Helper & Dictionary
 * Maps store categories, keywords, and product types to official Shopify Standard Product Taxonomy paths.
 * 
 * Rules:
 * 1. If an input already contains ' > ' (hierarchical path), it is treated as a valid taxonomy string.
 * 2. If it matches a known product keyword/category in the taxonomy dictionary, it returns the standard taxonomy hierarchy.
 * 3. If no standard taxonomy is matched and it has no hierarchy, it returns '' (empty string),
 *    preventing Shopify from throwing the "invalid product category" import error.
 */

// Official Shopify Standard Product Taxonomy Dictionary
const SHOPIFY_TAXONOMY_MAP = {
  // Baby & Toddler
  'soother': 'Baby & Toddler > Baby Toys & Activity Equipment > Pacifiers & Teethers',
  'soothers': 'Baby & Toddler > Baby Toys & Activity Equipment > Pacifiers & Teethers',
  'pacifier': 'Baby & Toddler > Baby Toys & Activity Equipment > Pacifiers & Teethers',
  'pacifiers': 'Baby & Toddler > Baby Toys & Activity Equipment > Pacifiers & Teethers',
  'teether': 'Baby & Toddler > Baby Toys & Activity Equipment > Pacifiers & Teethers',
  'teethers': 'Baby & Toddler > Baby Toys & Activity Equipment > Pacifiers & Teethers',
  'comforter': 'Baby & Toddler > Baby Toys & Activity Equipment > Soft & Plush Toys',
  'comforters': 'Baby & Toddler > Baby Toys & Activity Equipment > Soft & Plush Toys',
  'plush': 'Baby & Toddler > Baby Toys & Activity Equipment > Soft & Plush Toys',
  'plush toy': 'Baby & Toddler > Baby Toys & Activity Equipment > Soft & Plush Toys',
  'plush toys': 'Baby & Toddler > Baby Toys & Activity Equipment > Soft & Plush Toys',
  'soft toy': 'Baby & Toddler > Baby Toys & Activity Equipment > Soft & Plush Toys',
  'soft toys': 'Baby & Toddler > Baby Toys & Activity Equipment > Soft & Plush Toys',
  'stuffed animal': 'Baby & Toddler > Baby Toys & Activity Equipment > Soft & Plush Toys',
  'stuffed animals': 'Baby & Toddler > Baby Toys & Activity Equipment > Soft & Plush Toys',
  'jellycat': 'Baby & Toddler > Baby Toys & Activity Equipment > Soft & Plush Toys',
  'baby blanket': 'Baby & Toddler > Baby Bedding > Baby Blankets',
  'baby clothing': 'Baby & Toddler > Baby & Toddler Clothing',
  'onesie': 'Baby & Toddler > Baby & Toddler Clothing > Baby & Toddler One-Pieces',
  'romper': 'Baby & Toddler > Baby & Toddler Clothing > Baby & Toddler One-Pieces',

  // Apparel & Clothing - Tops
  't-shirt': 'Apparel & Accessories > Clothing > Clothing Tops > T-Shirts',
  't-shirts': 'Apparel & Accessories > Clothing > Clothing Tops > T-Shirts',
  'tshirt': 'Apparel & Accessories > Clothing > Clothing Tops > T-Shirts',
  'tshirts': 'Apparel & Accessories > Clothing > Clothing Tops > T-Shirts',
  'tee': 'Apparel & Accessories > Clothing > Clothing Tops > T-Shirts',
  'tees': 'Apparel & Accessories > Clothing > Clothing Tops > T-Shirts',
  'graphic shirt': 'Apparel & Accessories > Clothing > Clothing Tops > T-Shirts',
  'graphic tee': 'Apparel & Accessories > Clothing > Clothing Tops > T-Shirts',
  'shirt': 'Apparel & Accessories > Clothing > Shirts & Tops',
  'shirts': 'Apparel & Accessories > Clothing > Shirts & Tops',
  'blouse': 'Apparel & Accessories > Clothing > Shirts & Tops',
  'polo': 'Apparel & Accessories > Clothing > Clothing Tops > Polo Shirts',
  'tank top': 'Apparel & Accessories > Clothing > Clothing Tops > Tank Tops',
  'hoodie': 'Apparel & Accessories > Clothing > Clothing Tops > Sweatshirts & Hoodies',
  'hoodies': 'Apparel & Accessories > Clothing > Clothing Tops > Sweatshirts & Hoodies',
  'sweatshirt': 'Apparel & Accessories > Clothing > Clothing Tops > Sweatshirts & Hoodies',
  'sweatshirts': 'Apparel & Accessories > Clothing > Clothing Tops > Sweatshirts & Hoodies',
  'sweater': 'Apparel & Accessories > Clothing > Clothing Tops > Sweaters',
  'sweaters': 'Apparel & Accessories > Clothing > Clothing Tops > Sweaters',
  'cardigan': 'Apparel & Accessories > Clothing > Clothing Tops > Sweaters',

  // Apparel - Bottoms & Full
  'dress': 'Apparel & Accessories > Clothing > Dresses',
  'dresses': 'Apparel & Accessories > Clothing > Dresses',
  'gown': 'Apparel & Accessories > Clothing > Dresses',
  'pants': 'Apparel & Accessories > Clothing > Pants',
  'trousers': 'Apparel & Accessories > Clothing > Pants',
  'jeans': 'Apparel & Accessories > Clothing > Pants',
  'joggers': 'Apparel & Accessories > Clothing > Activewear > Track Pants & Joggers',
  'shorts': 'Apparel & Accessories > Clothing > Shorts',
  'skirt': 'Apparel & Accessories > Clothing > Skirts',
  'skirts': 'Apparel & Accessories > Clothing > Skirts',
  'jacket': 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
  'jackets': 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
  'coat': 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
  'outerwear': 'Apparel & Accessories > Clothing > Outerwear',
  'blazer': 'Apparel & Accessories > Clothing > Suits > Suit Jackets & Blazers',
  'swimwear': 'Apparel & Accessories > Clothing > Swimwear',
  'swimsuit': 'Apparel & Accessories > Clothing > Swimwear',
  'bikini': 'Apparel & Accessories > Clothing > Swimwear',
  'underwear': 'Apparel & Accessories > Clothing > Underwear & Socks',
  'socks': 'Apparel & Accessories > Clothing > Underwear & Socks > Socks',
  'sleepwear': 'Apparel & Accessories > Clothing > Sleepwear & Loungewear',
  'pajamas': 'Apparel & Accessories > Clothing > Sleepwear & Loungewear',

  // Footwear
  'shoes': 'Apparel & Accessories > Shoes',
  'shoe': 'Apparel & Accessories > Shoes',
  'sneakers': 'Apparel & Accessories > Shoes',
  'boots': 'Apparel & Accessories > Shoes',
  'sandals': 'Apparel & Accessories > Shoes',
  'footwear': 'Apparel & Accessories > Shoes',
  'heels': 'Apparel & Accessories > Shoes',
  'loafers': 'Apparel & Accessories > Shoes',
  'slippers': 'Apparel & Accessories > Shoes',

  // Accessories & Bags
  'bag': 'Luggage & Bags > Bags',
  'bags': 'Luggage & Bags > Bags',
  'handbag': 'Luggage & Bags > Handbags, Wallets & Cases > Handbags',
  'handbags': 'Luggage & Bags > Handbags, Wallets & Cases > Handbags',
  'backpack': 'Luggage & Bags > Backpacks',
  'backpacks': 'Luggage & Bags > Backpacks',
  'wallet': 'Luggage & Bags > Handbags, Wallets & Cases > Wallets & Money Clips',
  'purse': 'Luggage & Bags > Handbags, Wallets & Cases > Handbags',
  'tote': 'Luggage & Bags > Shopping Totes',
  'luggage': 'Luggage & Bags > Suitcases',
  'belt': 'Apparel & Accessories > Clothing Accessories > Belts',
  'hat': 'Apparel & Accessories > Clothing Accessories > Hats',
  'cap': 'Apparel & Accessories > Clothing Accessories > Hats',
  'scarf': 'Apparel & Accessories > Clothing Accessories > Scarves & Shawls',
  'sunglasses': 'Apparel & Accessories > Clothing Accessories > Sunglasses',
  'glasses': 'Apparel & Accessories > Clothing Accessories > Sunglasses',
  'jewelry': 'Apparel & Accessories > Jewelry',
  'jewellery': 'Apparel & Accessories > Jewelry',
  'watch': 'Apparel & Accessories > Jewelry > Watches',
  'watches': 'Apparel & Accessories > Jewelry > Watches',
  'smartwatch': 'Apparel & Accessories > Jewelry > Watches',
  'necklace': 'Apparel & Accessories > Jewelry > Necklaces',
  'ring': 'Apparel & Accessories > Jewelry > Rings',
  'earrings': 'Apparel & Accessories > Jewelry > Earrings',
  'bracelet': 'Apparel & Accessories > Jewelry > Bracelets',

  // Health & Beauty
  'perfume': 'Health & Beauty > Personal Care > Cosmetics > Perfumes & Colognes',
  'perfumes': 'Health & Beauty > Personal Care > Cosmetics > Perfumes & Colognes',
  'cologne': 'Health & Beauty > Personal Care > Cosmetics > Perfumes & Colognes',
  'fragrance': 'Health & Beauty > Personal Care > Cosmetics > Perfumes & Colognes',
  'cosmetics': 'Health & Beauty > Personal Care > Cosmetics',
  'makeup': 'Health & Beauty > Personal Care > Cosmetics',
  'lipstick': 'Health & Beauty > Personal Care > Cosmetics > Lipsticks',
  'foundation': 'Health & Beauty > Personal Care > Cosmetics',
  'mascara': 'Health & Beauty > Personal Care > Cosmetics',
  'skincare': 'Health & Beauty > Personal Care > Cosmetics > Skin Care',
  'skin care': 'Health & Beauty > Personal Care > Cosmetics > Skin Care',
  'moisturizer': 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Lotions & Moisturizers',
  'lotion': 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Lotions & Moisturizers',
  'serum': 'Health & Beauty > Personal Care > Cosmetics > Skin Care',
  'sunscreen': 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Sunscreen',
  'hair care': 'Health & Beauty > Personal Care > Hair Care',
  'shampoo': 'Health & Beauty > Personal Care > Hair Care > Shampoo & Conditioner',
  'conditioner': 'Health & Beauty > Personal Care > Hair Care > Shampoo & Conditioner',
  'vitamins': 'Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements',
  'supplement': 'Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements',
  'supplements': 'Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements',

  // Media & Books
  'book': 'Media > Books > Print Books',
  'books': 'Media > Books > Print Books',
  'ebook': 'Media > Books > E-Books',
  'ebooks': 'Media > Books > E-Books',
  'e-book': 'Media > Books > E-Books',
  'e-books': 'Media > Books > E-Books',
  'digital book': 'Media > Books > E-Books',
  'digital books': 'Media > Books > E-Books',
  'audiobook': 'Media > Audiobooks',
  'music': 'Media > Music & Sound Recordings',
  'vinyl': 'Media > Music & Sound Recordings > Records & LPs',
  'cd': 'Media > Music & Sound Recordings > Compact Discs',
  'dvd': 'Media > DVDs & Videos',

  // Electronics
  'electronics': 'Electronics',
  'headphone': 'Electronics > Audio > Audio Components > Headphones & Headsets',
  'headphones': 'Electronics > Audio > Audio Components > Headphones & Headsets',
  'earphone': 'Electronics > Audio > Audio Components > Headphones & Headsets',
  'earbuds': 'Electronics > Audio > Audio Components > Headphones & Headsets',
  'speaker': 'Electronics > Audio > Audio Components > Speakers',
  'speakers': 'Electronics > Audio > Audio Components > Speakers',
  'phone': 'Electronics > Communications > Telephony > Mobile Phones',
  'phones': 'Electronics > Communications > Telephony > Mobile Phones',
  'smartphone': 'Electronics > Communications > Telephony > Mobile Phones',
  'smartphones': 'Electronics > Communications > Telephony > Mobile Phones',
  'laptop': 'Electronics > Computers > Laptops',
  'laptops': 'Electronics > Computers > Laptops',
  'computer': 'Electronics > Computers > Desktop Computers',
  'tablet': 'Electronics > Computers > Tablet Computers',
  'camera': 'Cameras & Optics > Cameras',
  'cameras': 'Cameras & Optics > Cameras',
  'cable': 'Electronics > Electronics Accessories > Cables',
  'charger': 'Electronics > Electronics Accessories > Power Adapters & Chargers',
  'case': 'Electronics > Electronics Accessories > Cases & Covers',

  // Home & Kitchen & Living
  'furniture': 'Furniture',
  'chair': 'Furniture > Chairs',
  'chairs': 'Furniture > Chairs',
  'table': 'Furniture > Tables',
  'sofa': 'Furniture > Sofas',
  'bed': 'Furniture > Beds & Bed Frames',
  'desk': 'Furniture > Desks',
  'home decor': 'Home & Garden > Decor',
  'decor': 'Home & Garden > Decor',
  'vase': 'Home & Garden > Decor > Vases',
  'candle': 'Home & Garden > Decor > Home Fragrances > Candles',
  'candles': 'Home & Garden > Decor > Home Fragrances > Candles',
  'pillow': 'Home & Garden > Linens & Bedding > Bedding > Bed Pillows',
  'bedding': 'Home & Garden > Linens & Bedding > Bedding',
  'blanket': 'Home & Garden > Linens & Bedding > Bedding > Blankets & Throws',
  'kitchen': 'Home & Garden > Kitchen & Dining',
  'cookware': 'Home & Garden > Kitchen & Dining > Cookware & Bakeware',
  'lighting': 'Home & Garden > Lighting',
  'lamp': 'Home & Garden > Lighting > Lamps',

  // Toys & Games & Sports
  'toy': 'Toys & Games > Toys',
  'toys': 'Toys & Games > Toys',
  'game': 'Toys & Games > Games',
  'games': 'Toys & Games > Games',
  'board game': 'Toys & Games > Games > Board Games',
  'puzzle': 'Toys & Games > Puzzles',
  'sport': 'Sporting Goods',
  'sports': 'Sporting Goods',
  'fitness': 'Sporting Goods > Exercise & Fitness',
  'gym': 'Sporting Goods > Exercise & Fitness',

  // Animals & Pets
  'pet': 'Animals & Pet Supplies > Pet Supplies',
  'pet supplies': 'Animals & Pet Supplies > Pet Supplies',
  'dog': 'Animals & Pet Supplies > Pet Supplies > Dog Supplies',
  'cat': 'Animals & Pet Supplies > Pet Supplies > Cat Supplies',

  // Food & Beverages
  'food': 'Food, Beverages & Tobacco > Food Items',
  'snack': 'Food, Beverages & Tobacco > Food Items > Snack Foods',
  'snacks': 'Food, Beverages & Tobacco > Food Items > Snack Foods',
  'coffee': 'Food, Beverages & Tobacco > Beverages > Coffee',
  'tea': 'Food, Beverages & Tobacco > Beverages > Tea & Infusions',
  'chocolate': 'Food, Beverages & Tobacco > Food Items > Candy & Chocolate'
};

// Known valid top-level Shopify taxonomy roots
const VALID_TAXONOMY_ROOTS = new Set([
  'Animals & Pet Supplies',
  'Apparel & Accessories',
  'Arts & Entertainment',
  'Baby & Toddler',
  'Business & Industrial',
  'Cameras & Optics',
  'Electronics',
  'Food, Beverages & Tobacco',
  'Furniture',
  'Hardware',
  'Health & Beauty',
  'Home & Garden',
  'Luggage & Bags',
  'Media',
  'Office Supplies',
  'Religious & Ceremonial',
  'Software',
  'Sporting Goods',
  'Toys & Games',
  'Vehicles & Parts'
]);

/**
 * Resolves an official Shopify Standard Product Taxonomy hierarchy string.
 * If no valid standard taxonomy is found, returns '' so that Shopify import succeeds with NO errors.
 * 
 * @param {string} category - Scraped category, custom category override, or taxonomy path
 * @param {string} productType - Product type
 * @param {string} title - Product title for fallback context
 * @param {Array|string} tags - Tags list
 * @returns {string} Official Shopify Taxonomy path (e.g. "Apparel & Accessories > Clothing > Clothing Tops > T-Shirts") or ""
 */
function resolveShopifyTaxonomy(category = '', productType = '', title = '', tags = []) {
  const cat = String(category || '').trim();
  const pType = String(productType || '').trim();
  const pTitle = String(title || '').trim();
  const tagsArr = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : []);

  // 1. If category already has taxonomy hierarchy with ' > '
  if (cat.includes(' > ')) {
    const root = cat.split(' > ')[0].trim();
    if (VALID_TAXONOMY_ROOTS.has(root)) {
      return cat;
    }
  }

  // 2. Check if cat itself is an exact top-level taxonomy root
  if (VALID_TAXONOMY_ROOTS.has(cat)) {
    return cat;
  }

  // Helper to normalize and search the taxonomy map
  const checkLookup = (str) => {
    if (!str) return null;
    const lower = str.toLowerCase().replace(/['"]/g, '').trim();
    if (SHOPIFY_TAXONOMY_MAP[lower]) {
      return SHOPIFY_TAXONOMY_MAP[lower];
    }
    // Substring match
    for (const [key, taxonomy] of Object.entries(SHOPIFY_TAXONOMY_MAP)) {
      const regex = new RegExp(`\\b${key}\\b`, 'i');
      if (regex.test(lower)) {
        return taxonomy;
      }
    }
    return null;
  };

  // 3. Try matching category
  const matchCat = checkLookup(cat);
  if (matchCat) return matchCat;

  // 4. Try matching productType
  const matchType = checkLookup(pType);
  if (matchType) return matchType;

  // 5. Try matching tags
  for (const tag of tagsArr) {
    const matchTag = checkLookup(tag);
    if (matchTag) return matchTag;
  }

  // 6. Try matching title keywords (e.g. "Sun Soother", "Graphic T-Shirt")
  const matchTitle = checkLookup(pTitle);
  if (matchTitle) return matchTitle;

  // 7. If no valid taxonomy is matched, return '' so Shopify accepts the CSV with ZERO errors.
  return '';
}

/**
 * Resolves the merchant's custom product type (e.g. "Comforters", "Graphic shirt", "Digital book", "Perfume").
 * 
 * @param {string} customType - User override for custom type
 * @param {string} productType - Scraped product type
 * @param {string} category - Scraped category
 * @param {string} defaultFallback - Fallback
 * @returns {string} Custom product type string
 */
function resolveCustomProductType(customType = '', productType = '', category = '', defaultFallback = '') {
  if (customType && customType.trim()) return customType.trim();
  if (productType && productType.trim() && !productType.includes(' > ')) return productType.trim();
  if (category && category.trim() && !category.includes(' > ')) return category.trim();
  
  // If category was a taxonomy hierarchy, extract the leaf node as the custom type
  if (category && category.includes(' > ')) {
    const parts = category.split(' > ');
    return parts[parts.length - 1].trim();
  }

  return defaultFallback || '';
}

module.exports = {
  resolveShopifyTaxonomy,
  resolveCustomProductType,
  SHOPIFY_TAXONOMY_MAP,
  VALID_TAXONOMY_ROOTS
};
