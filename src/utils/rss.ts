/**
 * RSS Feed Utilities
 *
 * Fetches and parses Castos podcast RSS feeds at build time.
 * Each show's episodes become individually SEO-indexed pages via getStaticPaths.
 * Returns an empty array on any failure so builds never break.
 */

import Parser from 'rss-parser';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// In-memory cache for ultra-fast same-process reuse
const memoryCache = new Map<string, { timestamp: number; episodes: RssEpisode[] }>();
// In-flight deduplication map so concurrent calls for the same URL share a single request
const inFlightRequests = new Map<string, Promise<RssEpisode[]>>();

const CACHE_DIR = path.resolve(process.cwd(), 'node_modules/.cache/smalltalkcafe-rss');
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

function getCacheFilePath(url: string): string {
  const hash = crypto.createHash('sha256').update(url).digest('hex').slice(0, 16);
  return path.join(CACHE_DIR, `feed-${hash}.json`);
}

function readDiskCache(url: string): { episodes: RssEpisode[]; isFresh: boolean } | null {
  try {
    const filePath = getCacheFilePath(url);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data.episodes) || typeof data.timestamp !== 'number') return null;
    const isFresh = Date.now() - data.timestamp < CACHE_TTL_MS;
    return { episodes: data.episodes, isFresh };
  } catch {
    return null;
  }
}

function writeDiskCache(url: string, episodes: RssEpisode[]) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    const filePath = getCacheFilePath(url);
    fs.writeFileSync(filePath, JSON.stringify({ timestamp: Date.now(), episodes }), 'utf-8');
  } catch (err) {
    console.warn(`[RSS] Failed to write disk cache for ${url}:`, (err as Error).message);
  }
}

export interface RssEpisode {
  /** URL-safe slug derived from episode title (unique within a show) */
  slug: string;
  /** Episode title */
  title: string;
  /** Short plain-text description (≤ 200 chars) for meta description */
  description: string;
  /** Full HTML show website content rendered on the episode page */
  contentHtml: string;
  /** ISO 8601 publish date */
  pubDate: string;
  /** Direct audio file URL (from RSS <enclosure>) */
  audioUrl?: string;
  /** Audio MIME type, e.g. "audio/mpeg" */
  audioType?: string;
  /** Duration string, e.g. "12:34" or "1:02:45" */
  duration?: string;
  /** Episode number from iTunes namespace */
  episodeNumber?: string;
  /** Season number from iTunes namespace */
  season?: string;
  /** Episode artwork URL */
  artworkUrl?: string;
  /** Original GUID from the RSS feed */
  guid: string;
  /** Castos episode page link */
  link?: string;
}

/** Convert a title string into a URL-safe slug (strips diacritics, lowercases, hyphenates) */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

type CustomItem = {
  'content:encoded'?: string;
  itunes?: {
    image?: string | { href?: string };
    duration?: string;
    episode?: string | number;
    season?: string | number;
    subtitle?: string;
    summary?: string;
  };
};

/** A single episode paired with the show it belongs to. */
export interface EpisodeWithShow {
  episode: RssEpisode;
  showId: string;
  showTitle: string;
  showSubtitle?: string;
}

/**
 * Fetch the single most recently published episode across all shows that have
 * an RSS URL configured. Used on the homepage to guarantee fresh content.
 */
export async function fetchLatestEpisodeAcrossShows(
  shows: Array<{ id: string; title: string; subtitle?: string; rssUrl?: string }>
): Promise<EpisodeWithShow | null> {
  const showsWithRss = shows.filter((s) => s.rssUrl);
  if (showsWithRss.length === 0) return null;

  const settled = await Promise.allSettled(
    showsWithRss.map(async (show) => {
      const episodes = await fetchEpisodes(show.rssUrl!);
      if (episodes.length === 0) return null;
      // Castos feeds are newest-first in feed order
      return {
        episode: episodes[0],
        showId: show.id,
        showTitle: show.title,
        showSubtitle: show.subtitle,
      } satisfies EpisodeWithShow;
    })
  );

  const candidates: EpisodeWithShow[] = [];
  for (const r of settled) {
    if (r.status === 'fulfilled' && r.value !== null) {
      candidates.push(r.value);
    }
  }

  if (candidates.length === 0) return null;

  return candidates.sort(
    (a, b) =>
      new Date(b.episode.pubDate).getTime() - new Date(a.episode.pubDate).getTime()
  )[0];
}

/**
 * Fetch the most recent episode individually for each show that has an RSS URL.
 * Returns a record keyed by show id. Shows with no RSS or fetch failure map to null.
 * Used on the homepage to display a "latest episode" row per show.
 */
export async function fetchLatestEpisodePerShow(
  shows: Array<{ id: string; title: string; subtitle?: string; rssUrl?: string }>
): Promise<Record<string, EpisodeWithShow | null>> {
  const results: Record<string, EpisodeWithShow | null> = {};

  await Promise.allSettled(
    shows.map(async (show) => {
      if (!show.rssUrl) {
        results[show.id] = null;
        return;
      }
      const episodes = await fetchEpisodes(show.rssUrl);
      results[show.id] =
        episodes.length === 0
          ? null
          : { episode: episodes[0], showId: show.id, showTitle: show.title, showSubtitle: show.subtitle };
    })
  );

  return results;
}

/**
 * Fetch all episodes from a Castos RSS feed URL.
 * Slugs are deduplicated: if two episode titles are identical the second gets a
 * numeric suffix (-2, -3, …).
 */
export async function fetchEpisodes(rssUrl: string): Promise<RssEpisode[]> {
  if (!rssUrl) return [];

  // 1. Check in-memory cache first
  const memCached = memoryCache.get(rssUrl);
  if (memCached && Date.now() - memCached.timestamp < CACHE_TTL_MS) {
    return memCached.episodes;
  }

  // 2. Check disk cache
  const diskCached = readDiskCache(rssUrl);
  if (diskCached && diskCached.isFresh) {
    memoryCache.set(rssUrl, { timestamp: Date.now(), episodes: diskCached.episodes });
    return diskCached.episodes;
  }

  // 3. Deduplicate concurrent requests
  const existingPromise = inFlightRequests.get(rssUrl);
  if (existingPromise) {
    return existingPromise;
  }

  const fetchPromise = (async () => {
    try {
      let xmlText = '';
      let lastError: Error | null = null;
      const MAX_RETRIES = 3;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await fetch(rssUrl, {
            signal: AbortSignal.timeout(30000),
            headers: {
              'User-Agent': 'SmallTalkCafe/1.0 (+https://smalltalkcafe.de)',
              'Accept': 'application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.8',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
          }

          xmlText = await response.text();
          break;
        } catch (err) {
          lastError = err as Error;
          if (attempt < MAX_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
          }
        }
      }

      if (!xmlText) {
        throw lastError || new Error(`Failed to fetch RSS feed from ${rssUrl}`);
      }
      const parser = new Parser<Record<string, unknown>, CustomItem>({
        customFields: {
          item: [['content:encoded', 'content:encoded']],
        },
      });

      const feed = await parser.parseString(xmlText);
      const items = feed.items ?? [];

      const episodes: RssEpisode[] = items.map((item) => {
        const title = item.title?.trim() || 'Untitled Episode';
        const guid = item.guid || item.link || title;
        const contentEncoded = (item as CustomItem)['content:encoded'] ?? '';

        // itunes image can be a string URL or an object with href
        const rawImage = item.itunes?.image as string | { href?: string } | undefined;
        const artworkUrl =
          typeof rawImage === 'string'
            ? rawImage
            : (rawImage as { href?: string } | undefined)?.href ?? undefined;

        const raw = (item.contentSnippet || item.itunes?.subtitle || '').trim();
        const description = raw.length > 200
          ? raw.slice(0, raw.lastIndexOf(' ', 197)).trimEnd() + '…'
          : raw;

        return {
          slug: slugify(title),
          title,
          description,
          contentHtml: contentEncoded || item.content || '',
          pubDate: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
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

      // Deduplicate slugs within this feed
      const slugCount = new Map<string, number>();
      for (const ep of episodes) {
        slugCount.set(ep.slug, (slugCount.get(ep.slug) ?? 0) + 1);
      }
      const slugOccurrence = new Map<string, number>();
      for (const ep of episodes) {
        if ((slugCount.get(ep.slug) ?? 0) > 1) {
          const occ = (slugOccurrence.get(ep.slug) ?? 0) + 1;
          slugOccurrence.set(ep.slug, occ);
          ep.slug = occ === 1 ? ep.slug : `${ep.slug}-${occ}`;
        }
      }

      // Store in memory & disk cache
      memoryCache.set(rssUrl, { timestamp: Date.now(), episodes });
      writeDiskCache(rssUrl, episodes);

      return episodes;
    } catch (error) {
      // If network fails, fall back to stale disk cache if available
      if (diskCached && diskCached.episodes.length > 0) {
        console.warn(`[RSS] Failed to fetch "${rssUrl}", using stale disk cache:`, (error as Error).message);
        memoryCache.set(rssUrl, { timestamp: Date.now(), episodes: diskCached.episodes });
        return diskCached.episodes;
      }
      console.warn(`[RSS] Failed to fetch "${rssUrl}":`, (error as Error).message);
      return [];
    } finally {
      inFlightRequests.delete(rssUrl);
    }
  })();

  inFlightRequests.set(rssUrl, fetchPromise);
  return fetchPromise;
}
