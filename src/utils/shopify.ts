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

/** Raw shape returned by /products.json */
interface RawProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
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

/** Strip HTML tags and collapse whitespace for plain-text teasers. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _discoverProductHandles(): Promise<string[]> {
  const KNOWN_PRODUCT_HANDLES: string[] = [];
  const ua = 'Mozilla/5.0 (compatible; smalltalkcafe.de-astro-build/1.0)';

  // ── Step 1: Homepage scrape (merchant sort order for featured products) ────
  let homepageHandles: string[] = [];
  try {
    const homeRes = await fetch(SHOP_DOMAIN, { headers: { 'User-Agent': ua } });
    if (homeRes.ok) {
      const html = await homeRes.text();
      const matches = [...html.matchAll(/["'\/]products\/([^"'?#\s\/]+)/g)]
        .map((m) => decodeURIComponent(m[1]))
        .filter((h) => h && !h.includes('.') && h.length > 2);
      homepageHandles = [...new Set(matches)];
    }
  } catch {
    // continue to sitemap
  }

  // ── Step 2: Sitemap (always run for complete catalogue) ───────────────────
  const sitemapHandles: string[] = [];
  try {
    const rootRes = await fetch(`${SHOP_DOMAIN}/sitemap.xml`, { headers: { 'User-Agent': ua } });
    if (rootRes.ok) {
      const rootXml = await rootRes.text();
      const productSitemapUrls = [...rootXml.matchAll(/<loc>([^<]*sitemap_products[^<]*)<\/loc>/g)]
        .map((m) => m[1])
        .filter((url) => !url.includes('/de/') && !url.includes('/fr/') &&
                         !url.includes('/it/') && !url.includes('/es/') &&
                         !url.includes('/ca/'));
      for (const sitemapUrl of productSitemapUrls) {
        const res = await fetch(sitemapUrl, { headers: { 'User-Agent': ua } });
        if (!res.ok) continue;
        const xml = await res.text();
        const found = [...xml.matchAll(new RegExp(`${SHOP_DOMAIN}/products/([^<"?]+)`, 'g'))]
          .map((m) => decodeURIComponent(m[1]));
        sitemapHandles.push(...found);
      }
    }
  } catch {
    // continue with homepage handles only
  }

  // ── Merge: homepage order first, then sitemap extras, then known fallbacks ──
  const homepageSet = new Set(homepageHandles);
  const extraFromSitemap = [...new Set(sitemapHandles)].filter((h) => !homepageSet.has(h));
  const discovered = [...homepageHandles, ...extraFromSitemap];
  const discoveredSet = new Set(discovered);

  // Always include all known handles (CI fallback for when scraping is blocked)
  const extraFromKnown = KNOWN_PRODUCT_HANDLES.filter((h) => !discoveredSet.has(h));
  const merged = [...discovered, ...extraFromKnown];

  if (merged.length === 0) {
    console.warn('[shopify] No product handles found from homepage, sitemap, or known list.');
    return [];
  }

  const source = discovered.length > 0
    ? `${discovered.length} discovered + ${extraFromKnown.length} from known list`
    : `known list only (scraping blocked in this environment)`;
  console.log(`[shopify] Using ${merged.length} handle(s) (${source}).`);
  return merged;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _fetchShopifyProductsFromNetwork(): Promise<ShopifyProduct[]> {
  const ua = 'Mozilla/5.0 (compatible; smalltalkcafe.de-astro-build/1.0)';

  try {
    const handles = await _discoverProductHandles();
    if (handles.length === 0) {
      console.warn('[shopify] No product handles found — shop page will show fallback.');
      return [];
    }
    console.log(`[shopify] Fetching ${handles.length} product(s)…`);

    // Fetch all product JSONs in parallel (Shopify CDN handles this fine)
    const settled = await Promise.allSettled(
      handles.map((handle) =>
        fetch(`${SHOP_DOMAIN}/products/${encodeURIComponent(handle)}.json`, {
          headers: { 'User-Agent': ua },
        }).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json() as Promise<{ product: RawProduct }>;
        })
      )
    );

    const results: ShopifyProduct[] = [];
    for (const [i, outcome] of settled.entries()) {
      if (outcome.status === 'rejected') {
        console.warn(`[shopify] Failed to fetch product "${handles[i]}":`, outcome.reason);
        continue;
      }
      const raw = outcome.value.product;

      // Find cheapest variant to surface the headline price
      const cheapest = raw.variants.reduce<ShopifyVariant | null>((min, v) => {
        if (!min) return v;
        return parseFloat(v.price) < parseFloat(min.price) ? v : min;
      }, null);

      const plain = stripHtml(raw.body_html);

      results.push({
        id: raw.id,
        title: raw.title,
        handle: raw.handle,
        bodyHtml: raw.body_html,
        teaser: plain.length > 140 ? plain.slice(0, 137) + '…' : plain,
        vendor: raw.vendor,
        productType: raw.product_type,
        tags: raw.tags,
        variants: raw.variants,
        images: raw.images,
        url: `${SHOP_DOMAIN}/products/${raw.handle}`,
        price: cheapest?.price ?? '0.00',
        // Shopify returns '' for no sale price — normalise to null
        compareAtPrice: cheapest?.compare_at_price || null,
        // `available` is absent from the public API on some Shopify plans.
        // Treat null/undefined as "in stock" — only mark sold out when explicitly false.
        available: raw.variants.some((v) => v.available !== false),
      });
    }
    console.log(`[shopify] Successfully loaded ${results.length} product(s).`);
    return results;
  } catch (err) {
    console.warn('[shopify] Failed to fetch products — shop page will show fallback:', err);
    return [];
  }
}
