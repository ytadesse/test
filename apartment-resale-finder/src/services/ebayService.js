/**
 * eBay Browse API Service
 *
 * Searches eBay for similar items and returns pricing data.
 * Falls back to mock data when no API credentials are configured.
 *
 * To use the real eBay API, set VITE_EBAY_APP_ID in your .env file
 * or enter it in the app settings panel.
 */

const EBAY_BROWSE_API = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

function getAppId() {
  return import.meta.env.VITE_EBAY_APP_ID || localStorage.getItem('ebay_app_id') || '';
}

function getAccessToken() {
  return localStorage.getItem('ebay_access_token') || '';
}

/**
 * Search eBay for a single product.
 * @param {string} query - product search query
 * @param {string} category - product category hint
 * @returns {Promise<{query: string, listings: Array, priceRange: {low: number, high: number, avg: number, currency: string}, totalResults: number}>}
 */
export async function searchProduct(query, category = '') {
  const token = getAccessToken();
  const appId = getAppId();

  if (!token && !appId) {
    return mockSearchProduct(query);
  }

  const params = new URLSearchParams({
    q: query,
    limit: '10',
    sort: 'price',
  });

  if (category) {
    params.set('category_ids', mapCategoryToEbayId(category));
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${EBAY_BROWSE_API}?${params}`, { headers });

  if (!response.ok) {
    throw new Error(`eBay API error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  const listings = (data.itemSummaries || []).map((item) => ({
    title: item.title,
    price: parseFloat(item.price?.value || 0),
    currency: item.price?.currency || 'USD',
    condition: item.condition,
    imageUrl: item.image?.imageUrl || '',
    itemUrl: item.itemWebUrl || '',
    seller: item.seller?.username || 'Unknown',
  }));

  const prices = listings.map((l) => l.price).filter((p) => p > 0);

  return {
    query,
    listings,
    priceRange: prices.length > 0
      ? {
          low: Math.min(...prices),
          high: Math.max(...prices),
          avg: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100,
          currency: 'USD',
        }
      : { low: 0, high: 0, avg: 0, currency: 'USD' },
    totalResults: data.total || listings.length,
  };
}

/**
 * Search eBay for multiple products in parallel.
 * @param {Array<{name: string, category: string}>} products
 * @returns {Promise<Array>} array of search results, one per product
 */
export async function searchProductsInParallel(products) {
  const searches = products.map((product) =>
    searchProduct(product.name, product.category)
      .then((result) => ({ ...result, product }))
      .catch((err) => ({
        query: product.name,
        product,
        listings: [],
        priceRange: { low: 0, high: 0, avg: 0, currency: 'USD' },
        totalResults: 0,
        error: err.message,
      }))
  );

  return Promise.all(searches);
}

function mapCategoryToEbayId(category) {
  const map = {
    Electronics: '293',
    Furniture: '3197',
    Clothing: '11450',
    Books: '267',
    Kitchen: '20625',
    Decor: '10033',
    Sports: '888',
  };
  return map[category] || '';
}

/** Mock eBay search for demo/development */
function mockSearchProduct(query) {
  return new Promise((resolve) => {
    const delay = 800 + Math.random() * 1200;
    setTimeout(() => {
      const basePrice = 20 + Math.random() * 300;
      const listings = Array.from({ length: 5 + Math.floor(Math.random() * 6) }, (_, i) => {
        const variance = 0.6 + Math.random() * 0.8;
        const price = Math.round(basePrice * variance * 100) / 100;
        return {
          title: `${query}${i > 0 ? ` - Listing ${i + 1}` : ''}`,
          price,
          currency: 'USD',
          condition: ['New', 'Like New', 'Used - Good', 'Used - Fair'][Math.floor(Math.random() * 4)],
          imageUrl: '',
          itemUrl: '#',
          seller: `seller_${Math.floor(Math.random() * 9000 + 1000)}`,
        };
      });

      const prices = listings.map((l) => l.price);

      resolve({
        query,
        listings,
        priceRange: {
          low: Math.min(...prices),
          high: Math.max(...prices),
          avg: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100,
          currency: 'USD',
        },
        totalResults: 40 + Math.floor(Math.random() * 200),
      });
    }, delay);
  });
}

export default { searchProduct, searchProductsInParallel };
