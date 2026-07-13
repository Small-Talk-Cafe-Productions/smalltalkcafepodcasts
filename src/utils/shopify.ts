/**
 * Shopify Product Fetcher
 *
 * Reads pre-fetched product data from src/data/products.json — a static file
 * committed to the repository. This avoids Cloudflare bot-protection blocking
 * the live Shopify API from GitHub Actions CI environments.
 *
 * To refresh product data, run locally:
 *   node scripts/fetch-products.mjs
 * Then commit the updated src/data/products.json.
 */

// The Shopify store has been permanently closed. This domain is no longer active.
export const SHOP_DOMAIN = 'https://smalltalkcafe.shop';

import cachedProducts from '../data/products.json';


// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
  width: number;
  height: number;
}

export interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  // The public /products/{handle}.json endpoint does not return `available` on
  // all Shopify plan configurations — it may be absent (undefined/null).
  available?: boolean | null;
}


/** Enriched product shape used by shop.astro */
export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  /** Raw HTML description from Shopify */
  bodyHtml: string;
  /** Plain-text teaser (first 140 chars of description, HTML stripped) */
  teaser: string;
  vendor: string;
  productType: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  /** Direct URL to the product on the Shopify storefront */
  url: string;
  /** Lowest variant price as a string, e.g. "19.99" */
  price: string;
  /** compare_at_price of the cheapest variant, null if not on sale */
  compareAtPrice: string | null;
  /** True if at least one variant is available to purchase */
  available: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────


/** Format a Shopify price string as a localised EUR amount, e.g. "€19.99" */
export function formatPrice(price: string): string {
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(num);
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

// ─── Fetcher ──────────────────────────────────────────────────────────────────

/**
 * Returns pre-fetched Shopify product data from src/data/products.json.
 * To update, run: node scripts/fetch-products.mjs
 */
export async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  console.log(`[shopify] Loaded ${cachedProducts.length} product(s) from static cache.`);
  return cachedProducts as unknown as ShopifyProduct[];
}

// To refresh product data, run locally:
//   node scripts/fetch-products.mjs
// Then commit the updated src/data/products.json.

