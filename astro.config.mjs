import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://yourusername.github.io',
  // Use base path only in production (for GitHub Pages)
  // In dev mode, serve at root for easier development
  base: import.meta.env.PROD ? '/smalltalkcafepodcasts' : '/',
  integrations: [tailwind()],
  output: 'static',
  build: {
    assets: 'assets'
  }
});
