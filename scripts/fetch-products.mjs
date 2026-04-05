// Script: fetch all Shopify products and save to src/data/products.json
// Run from project root: node scripts/fetch-products.mjs

import { writeFileSync, mkdirSync } from 'node:fs';

const SHOP = 'https://smalltalkcafe.shop';
const UA = 'Mozilla/5.0 (compatible; smalltalkcafe.de-astro-build/1.0)';
const HANDLES = [
  'small-talk-cafe-bier-essentials-mug-german-learner-expat-coffee-cup',
  'copy-of-small-talk-cafe-weiss-bier-essentials-mug-german-learner-expat-coffee-cup',
  'copy-of-copy-of-small-talk-cafe-wild-bier-essentials-mug-german-learner-expat-coffee-cup',
  '11oz-ceramic-mug-white-with-color-inside-brezel-german-essentials',
  'copy-of-small-talk-cafe-t-shirt-bier-essentials-german-language-culture-apparel',
  'small-talk-cafe-t-shirt-weiss-bier-essentials-german-language-culture-apparel',
  'small-talk-cafe-t-shirt-wild-bier-essentials-german-language-culture-apparel',
  'heavyweight-unisex-crewneck-t-shirt-gildan\u00AE-5000-white-brezel-german-essentials',
];

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const settled = await Promise.allSettled(
  HANDLES.map(h =>
    fetch(`${SHOP}/products/${encodeURIComponent(h)}.json`, {
      headers: { 'User-Agent': UA },
    }).then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
  )
);

const products = [];
for (const [i, result] of settled.entries()) {
  if (result.status === 'rejected') {
    console.error(`FAIL: ${HANDLES[i]} — ${result.reason.message}`);
    continue;
  }
  const raw = result.value.product;
  const cheapest = raw.variants.reduce(
    (min, v) => (!min || parseFloat(v.price) < parseFloat(min.price) ? v : min),
    null
  );
  const plain = stripHtml(raw.body_html ?? '');
  products.push({
    id: raw.id,
    title: raw.title,
    handle: raw.handle,
    bodyHtml: raw.body_html ?? '',
    teaser: plain.length > 140 ? plain.slice(0, 137) + '...' : plain,
    vendor: raw.vendor ?? '',
    productType: raw.product_type ?? '',
    tags: raw.tags ?? [],
    variants: raw.variants,
    images: raw.images ?? [],
    url: `${SHOP}/products/${raw.handle}`,
    price: cheapest?.price ?? '0.00',
    compareAtPrice: cheapest?.compare_at_price || null,
    available: raw.variants.some(v => v.available !== false),
  });
  console.log(`OK: ${raw.title} | EUR ${cheapest?.price}`);
}

mkdirSync('src/data', { recursive: true });
writeFileSync('src/data/products.json', JSON.stringify(products, null, 2));
console.log(`\nSaved ${products.length} products to src/data/products.json`);
