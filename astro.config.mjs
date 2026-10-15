import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

import fs from 'node:fs';
import path from 'node:path';

function servePublicDirectoriesPlugin() {
  return {
    name: 'serve-public-directories',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();
        const [pathname, search] = req.url.split('?');
        const cleanPath = decodeURIComponent(pathname);
        const publicDir = path.resolve(process.cwd(), 'public');
        const targetPath = path.join(publicDir, cleanPath.replace(/^\//, ''));

        // Security check: ensure targetPath is within publicDir
        if (!targetPath.startsWith(publicDir)) {
          return next();
        }

        if (fs.existsSync(targetPath)) {
          const stat = fs.statSync(targetPath);
          if (stat.isDirectory()) {
            const indexPath = path.join(targetPath, 'index.html');
            if (fs.existsSync(indexPath)) {
              if (!pathname.endsWith('/')) {
                res.writeHead(301, { Location: `${pathname}/${search ? `?${search}` : ''}` });
                return res.end();
              }
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              return fs.createReadStream(indexPath).pipe(res);
            }
          }
        }
        next();
      });
    },
  };
}

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
    sitemap({
      // Hint to Google how often to re-crawl and the relative importance of each page.
      // lastmod signals whether content has changed since the last crawl.
      serialize(item) {
        item.changefreq = 'weekly';
        item.lastmod = new Date().toISOString();
        const url = item.url;
        if (url === 'https://smalltalkcafe.de/') {
          item.priority = 1.0;
        } else if (/\/shows\/[^/]+\/$/.test(url)) {
          // Individual show pages (e.g. /shows/english-german/)
          item.priority = 0.9;
        } else if (url === 'https://smalltalkcafe.de/shows/') {
          item.priority = 0.85;
        } else if (/\/shows\/[^/]+\/[^/]+\//.test(url)) {
          // Episode pages — numerous but still valuable long-tail
          item.priority = 0.7;
        } else {
          item.priority = 0.6;
        }
        return item;
      },
    }),
  ],
  output: 'static',
  build: {
    assets: 'assets'
  },
  vite: {
    plugins: [
      servePublicDirectoriesPlugin(),
    ],
    css: {
      postcss: {
        plugins: [
          tailwindcss(),
          autoprefixer(),
        ],
      },
    },
  },
});
