import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://smalltalkcafe.de',
  // Use base path only in production (for GitHub Pages)
  // In dev mode, serve at root for easier development
  base: '/',
  // Always use trailing slashes so canonical URLs, sitemap URLs, and
  // GitHub Pages served URLs are all consistent (no 301 redirect loops).
  trailingSlash: 'always',
  integrations: [
    tailwind(),
    sitemap(),
  ],
  output: 'static',
  build: {
    assets: 'assets'
  }
});
