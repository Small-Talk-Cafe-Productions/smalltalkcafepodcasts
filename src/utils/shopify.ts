/**
 * Shopify Product Fetcher
 *
 * Pulls live product data from the public Shopify AJAX Products API at build
 * time. No API key or authentication is required — this endpoint is available
 * on all public Shopify storefronts.
 *
 * Endpoint:  GET https://smalltalkcafe.shop/products.json?limit=250
 * Docs:      https://shopify.dev/docs/api/ajax/reference/product
 *
 * Called during `astro build` (and during the weekly GitHub Actions cron job),
 * so the shop page always reflects the latest Shopify catalogue without any
 * manual maintenance.
 */

export const SHOP_DOMAIN = 'https://smalltalkcafe.shop';

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

/**
 * Discover product handles in storefront display order.
 *
 * Primary: scrape the store homepage HTML — Shopify renders the featured
 * collection in merchant-defined order, so the first appearance of each
 * /products/{handle} link in the page is the canonical display sequence.
 *
 * Fallback: if the homepage yields no product links (e.g. the theme changes),
 * we fall back to the sitemap strategy which returns all products but in an
 * arbitrary (by-ID) order.
 */
async function discoverProductHandles(): Promise<string[]> {
  const ua = 'Mozilla/5.0 (compatible; smalltalkcafe.de-astro-build/1.0)';

  // ── Primary: homepage scrape (preserves merchant sort order) ──────────────
  try {
    const homeRes = await fetch(SHOP_DOMAIN, { headers: { 'User-Agent': ua } });
    if (homeRes.ok) {
      const html = await homeRes.text();
      // Match every /products/{handle} path in the HTML, in document order
      const matches = [...html.matchAll(/["'\/]products\/([^"'?#\s\/]+)/g)]
        .map((m) => decodeURIComponent(m[1]))
        // Exclude Shopify system slugs (.json, .js, .css asset references)
        .filter((h) => h && !h.includes('.') && h.length > 2);
      const ordered = [...new Set(matches)];
      if (ordered.length > 0) {
        console.log(`[shopify] Discovered ${ordered.length} handle(s) from homepage (store order preserved).`);
        return ordered;
      }
    }
  } catch {
    // fall through to sitemap fallback
  }

  // ── Fallback: sitemap (order not guaranteed) ───────────────────────────────
  console.log('[shopify] Homepage scrape yielded no handles — falling back to sitemap.');
  const rootRes = await fetch(`${SHOP_DOMAIN}/sitemap.xml`, { headers: { 'User-Agent': ua } });
  if (!rootRes.ok) throw new Error(`sitemap.xml returned HTTP ${rootRes.status}`);
  const rootXml = await rootRes.text();

  const productSitemapUrls = [...rootXml.matchAll(/<loc>([^<]*sitemap_products[^<]*)<\/loc>/g)]
    .map((m) => m[1])
    .filter((url) => !url.includes('/de/') && !url.includes('/fr/') &&
                     !url.includes('/it/') && !url.includes('/es/') &&
                     !url.includes('/ca/'));

  const handles: string[] = [];
  for (const sitemapUrl of productSitemapUrls) {
    const res = await fetch(sitemapUrl, { headers: { 'User-Agent': ua } });
    if (!res.ok) continue;
    const xml = await res.text();
    const found = [...xml.matchAll(new RegExp(`${SHOP_DOMAIN}/products/([^<"?]+)`, 'g'))]
      .map((m) => decodeURIComponent(m[1]));
    handles.push(...found);
  }
  return [...new Set(handles)];
}

/**
 * Fetch all products from the Shopify storefront at build time.
 *
 * Strategy: discover product handles via the Shopify-generated sitemap XML,
 * then fetch each product's `/products/{handle}.json` endpoint in parallel.
 * This works reliably even when the catalogue-level `/products.json` returns
 * 404 (which can happen on certain Shopify plan configurations).
 *
 * On any network or parse error it logs a warning and returns [] so that
 * the build never fails — the shop page will gracefully show a "visit the
 * store" fallback instead.
 */
export async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  const ua = 'Mozilla/5.0 (compatible; smalltalkcafe.de-astro-build/1.0)';

  try {
    const handles = await discoverProductHandles();
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
        compareAtPrice: cheapest?.compare_at_price ?? null,
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
