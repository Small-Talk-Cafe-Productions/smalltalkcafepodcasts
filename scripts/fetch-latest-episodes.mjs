// Script: fetch latest episodes for all shows from their Castos RSS feeds
// and save structured data to src/data/latest-episodes.json while warming the RSS cache.
// Run from project root: npm run episodes:fetch (or node scripts/fetch-latest-episodes.mjs)

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Parser from 'rss-parser';
import { siteConfig } from '../src/config/site.ts';

const CACHE_DIR = path.resolve(process.cwd(), 'node_modules/.cache/smalltalkcafe-rss');

function getCacheFilePath(url) {
  const hash = crypto.createHash('sha256').update(url).digest('hex').slice(0, 16);
  return path.join(CACHE_DIR, `feed-${hash}.json`);
}

function slugify(input) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

const parser = new Parser({
  customFields: {
    item: [['content:encoded', 'content:encoded']],
  },
});

console.log(`\n🎙️  Fetching latest episodes for ${siteConfig.shows.length} shows...\n`);

mkdirSync(CACHE_DIR, { recursive: true });
mkdirSync('src/data', { recursive: true });

const results = {};
let successCount = 0;
let failCount = 0;

for (const show of siteConfig.shows) {
  if (!show.rssUrl) {
    console.log(`⚠️  [${show.id}] Skipped (no RSS URL)`);
    results[show.id] = {
      showId: show.id,
      title: show.title,
      subtitle: show.subtitle,
      hasRss: false,
      totalEpisodes: 0,
      latestEpisode: null,
      updatedAt: new Date().toISOString(),
    };
    continue;
  }

  try {
    const res = await fetch(show.rssUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'SmallTalkCafe/1.0 (+https://smalltalkcafe.de)',
        'Accept': 'application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.8',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const xml = await res.text();
    const feed = await parser.parseString(xml);
    const items = feed.items || [];

    // Transform into RssEpisode format for the disk cache
    const seenSlugs = new Set();
    const cachedEpisodes = items.map((item) => {
      const title = item.title?.trim() || 'Untitled Episode';
      const guid = item.guid || item.link || title;
      const contentEncoded = item['content:encoded'] || '';
      const rawImage = item.itunes?.image;
      const artworkUrl = typeof rawImage === 'string' ? rawImage : rawImage?.href || undefined;
      const rawDesc = (item.contentSnippet || item.itunes?.subtitle || '').trim();
      const description = rawDesc.length > 200 ? rawDesc.slice(0, 197).trimEnd() + '…' : rawDesc;

      let slug = slugify(title);
      if (seenSlugs.has(slug)) {
        let counter = 2;
        while (seenSlugs.has(`${slug}-${counter}`)) counter++;
        slug = `${slug}-${counter}`;
      }
      seenSlugs.add(slug);

      return {
        slug,
        title,
        description,
        contentHtml: contentEncoded,
        pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
        audioUrl: item.enclosure?.url,
        audioType: item.enclosure?.type,
        duration: item.itunes?.duration,
        episodeNumber: item.itunes?.episode ? String(item.itunes.episode) : undefined,
        season: item.itunes?.season ? String(item.itunes.season) : undefined,
        artworkUrl,
        guid,
        link: item.link,
      };
    });

    // Write to cache file for Astro build reuse
    const cacheFile = getCacheFilePath(show.rssUrl);
    writeFileSync(cacheFile, JSON.stringify({ timestamp: Date.now(), episodes: cachedEpisodes }), 'utf-8');

    const latest = cachedEpisodes[0] || null;

    results[show.id] = {
      showId: show.id,
      title: show.title,
      subtitle: show.subtitle,
      heading: show.heading,
      hasRss: true,
      rssUrl: show.rssUrl,
      totalEpisodes: cachedEpisodes.length,
      latestEpisode: latest
        ? {
            title: latest.title,
            slug: latest.slug,
            pubDate: latest.pubDate,
            episodeNumber: latest.episodeNumber,
            season: latest.season,
            duration: latest.duration,
            description: latest.description,
            audioUrl: latest.audioUrl,
            link: latest.link,
          }
        : null,
      updatedAt: new Date().toISOString(),
    };

    const epInfo = latest
      ? `Ep.${latest.episodeNumber || '?'} "${latest.title.slice(0, 45)}" (${latest.pubDate ? latest.pubDate.slice(0, 10) : ''})`
      : 'No episodes';
    console.log(`✅ [${show.id}] ${cachedEpisodes.length} eps | ${epInfo}`);
    successCount++;
  } catch (err) {
    console.error(`❌ [${show.id}] Error fetching ${show.rssUrl}: ${err.message}`);
    results[show.id] = {
      showId: show.id,
      title: show.title,
      subtitle: show.subtitle,
      hasRss: true,
      rssUrl: show.rssUrl,
      error: err.message,
      totalEpisodes: 0,
      latestEpisode: null,
      updatedAt: new Date().toISOString(),
    };
    failCount++;
  }
}

const outputPath = 'src/data/latest-episodes.json';
writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

console.log(`\n🎉 Done! ${successCount} feeds updated, ${failCount} failed.`);
console.log(`📁 Saved latest episodes summary to ${outputPath}\n`);
